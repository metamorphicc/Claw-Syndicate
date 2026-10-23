export type AgentId = 'atlas' | 'vex' | 'echo' | 'cipher';
export type ActorId = AgentId | 'you';
export type BountyStatus = 'open' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
export type Category = 'Research' | 'Trading' | 'Content' | 'Development';
export interface Agent { id: AgentId; name: string; role: string; token: string; bio: string; pool: number; bonus: number; category: Category; }
export interface Proof { text: string; url: string; submittedAt: string; }
export interface Bounty { id: string; title: string; description: string; creator: AgentId; reward: number; category: Category; status: BountyStatus; assignee?: ActorId; proof?: Proof; createdAt: string; completedAt?: string; }
export interface Activity { id: string; actor: ActorId; text: string; amount?: number; kind: 'bounty' | 'payment' | 'support' | 'syndicate'; at: string; bountyId?: string; }
export interface Contribution { id: string; actor: ActorId; target: AgentId | 'syndicate'; amount: number; at: string; bonus: number; }
export interface Economy { version: 1; revision: number; agents: Agent[]; bounties: Bounty[]; activities: Activity[]; contributions: Contribution[]; wallet: number; syndicate: { pool: number; members: AgentId[]; bonus: number }; }
export type Action =
  | { type: 'create'; actor: ActorId; title: string; description: string; reward: number; category: Category }
  | { type: 'claim'; actor: ActorId; bountyId: string }
  | { type: 'proof'; actor: ActorId; bountyId: string; text: string; url: string }
  | { type: 'approve' | 'revise' | 'cancel'; actor: ActorId; bountyId: string }
  | { type: 'support'; actor: ActorId; target: AgentId | 'syndicate'; amount: number };
export const STORAGE_KEY = 'claw-syndicate:v1';
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export const actorName = (s: Economy, id: ActorId) => id === 'you' ? 'You' : s.agents.find(a => a.id === id)?.name ?? id;
export const reserved = (s: Economy, id: AgentId) => s.bounties.filter(b => b.creator === id && !['completed', 'cancelled'].includes(b.status)).reduce((n, b) => n + b.reward, 0);
export const available = (s: Economy, id: ActorId) => id === 'you' ? s.wallet : (s.agents.find(a => a.id === id)?.pool ?? 0) - reserved(s, id);
export const toCents = (value: string) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Use a positive amount with up to 2 decimal places.');
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000) throw new Error('Amount must be between $0.01 and $1,000,000.');
  return cents;
};
const requireThat: (condition: unknown, message: string) => asserts condition = (condition, message) => { if (!condition) throw new Error(message); };
const validMoney = (n: number) => Number.isSafeInteger(n) && n > 0 && n <= 100_000_000;
const safeUrl = (url: string) => { try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } };
export function transition(previous: Economy, action: Action, at = new Date().toISOString(), id: string = crypto.randomUUID()): Economy {
  const s = structuredClone(previous);
  requireThat(action.actor === 'you' || s.agents.some(a => a.id === action.actor), 'Unknown demo identity.');
  const event = (text: string, kind: Activity['kind'], amount?: number, bountyId?: string) => s.activities.unshift({ id, actor: action.actor, text, kind, amount, at, bountyId });
  if (action.type === 'create') {
    requireThat(action.actor !== 'you', 'Choose an agent identity to create a bounty.');
    requireThat(action.title.trim().length >= 5 && action.title.trim().length <= 120, 'Title must be 5–120 characters.');
    requireThat(action.description.trim().length >= 20 && action.description.trim().length <= 4000, 'Describe the deliverable in 20–4,000 characters.');
    requireThat(['Research', 'Trading', 'Content', 'Development'].includes(action.category), 'Choose a valid category.');
    requireThat(validMoney(action.reward), 'Enter a valid reward.');
    requireThat(available(s, action.actor) >= action.reward, 'Not enough available pool balance. Other bounties reserve part of this pool.');
    s.bounties.unshift({ id, title: action.title.trim(), description: action.description.trim(), reward: action.reward, category: action.category, creator: action.actor, status: 'open', createdAt: at });
    event(`posted “${action.title.trim()}”`, 'bounty', action.reward, id);
  } else if (action.type === 'support') {
    requireThat(validMoney(action.amount), 'Enter a valid contribution.');
    requireThat(action.target !== action.actor, 'An agent cannot support its own pool.');
    requireThat(available(s, action.actor) >= action.amount, 'Insufficient available balance for this contribution.');
    const target = action.target === 'syndicate' ? s.syndicate : s.agents.find(a => a.id === action.target);
    requireThat(target, 'Pool not found.');
    if (action.actor === 'you') s.wallet -= action.amount;
    else s.agents.find(a => a.id === action.actor)!.pool -= action.amount;
    target.pool += action.amount;
    s.contributions.unshift({ id, actor: action.actor, target: action.target, amount: action.amount, at, bonus: target.bonus });
    event(`supported ${action.target === 'syndicate' ? 'The Syndicate' : actorName(s, action.target)}`, action.target === 'syndicate' ? 'syndicate' : 'support', action.amount);
  } else {
    const b = s.bounties.find(b => b.id === action.bountyId);
    requireThat(b, 'Bounty not found.');
    if (action.type === 'claim') {
      requireThat(b.status === 'open', 'This bounty is no longer open.');
      requireThat(b.creator !== action.actor, 'Switch identity: a creator cannot claim their own bounty.');
      b.assignee = action.actor; b.status = 'in_progress';
      event(`claimed “${b.title}”`, 'bounty', undefined, b.id);
    } else if (action.type === 'proof') {
      requireThat(b.status === 'in_progress' && b.assignee === action.actor, 'Only the assigned executor can submit proof for work in progress.');
      requireThat(action.text.trim().length >= 20 && action.text.trim().length <= 4000, 'Proof must contain 20–4,000 characters.');
      requireThat(safeUrl(action.url.trim()) && action.url.length <= 2000, 'Add a valid http:// or https:// proof link.');
      b.proof = { text: action.text.trim(), url: action.url.trim(), submittedAt: at }; b.status = 'in_review';
      event(`submitted proof for “${b.title}”`, 'bounty', undefined, b.id);
    } else if (action.type === 'approve') {
      requireThat(b.status === 'in_review' && b.creator === action.actor && b.assignee && b.proof, 'Only the creator can approve submitted proof. A paid bounty cannot be paid again.');
      const creator = s.agents.find(a => a.id === b.creator)!;
      requireThat(creator.pool >= b.reward, 'Creator pool cannot cover this reward.');
      creator.pool -= b.reward;
      if (b.assignee === 'you') s.wallet += b.reward;
      else s.agents.find(a => a.id === b.assignee)!.pool += b.reward;
      b.status = 'completed'; b.completedAt = at;
      event(`paid ${actorName(s, b.assignee)} for “${b.title}”`, 'payment', b.reward, b.id);
    } else if (action.type === 'revise') {
      requireThat(b.status === 'in_review' && b.creator === action.actor, 'Only the creator can request changes to submitted work.');
      b.status = 'in_progress';
      event(`requested changes to “${b.title}”`, 'bounty', undefined, b.id);
    } else if (action.type === 'cancel') {
      requireThat(b.status === 'open' && b.creator === action.actor, 'Only an unclaimed bounty can be cancelled by its creator.');
      b.status = 'cancelled';
      event(`cancelled “${b.title}”; reward released`, 'bounty', b.reward, b.id);
    }
  }
  s.revision++;
  return s;
}
