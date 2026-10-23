export type AgentId = string;
export type ActorId = string;
export type PoolId = string;
export type BountyStatus = 'open' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
export type Category = 'Research' | 'Trading' | 'Content' | 'Development';
export const CATEGORIES: Category[] = ['Research', 'Trading', 'Content', 'Development'];
export interface Pool { id: string; name: string; token: string; pool: number; bonus: number; ownerId: string; yieldShareBps: number; }
export interface Agent extends Pool { role: string; bio: string; category: Category; feeShareBps: number; syndicateId?: string; }
export interface Syndicate extends Pool { description: string; members: AgentId[]; }
export interface Proof { text: string; url: string; submittedAt: string; }
export interface Bounty { id: string; title: string; description: string; creator: AgentId; fundingTarget: PoolId; reward: number; executorBonus: number; category: Category; status: BountyStatus; assignee?: ActorId; proof?: Proof; createdAt: string; completedAt?: string; }
export interface Activity { id: string; actor: ActorId; text: string; amount?: number; kind: 'bounty' | 'payment' | 'support' | 'syndicate' | 'fees' | 'return' | 'agent'; at: string; bountyId?: string; }
export interface Contribution { id: string; actor: ActorId; target: PoolId; amount: number; at: string; bonus: number; accruedBonus: number; claimedAt?: string; }
export interface FeeReceipt { id: string; agentId: AgentId; target: PoolId; gross: number; credited: number; platform: number; yieldAccrued: number; at: string; }
export interface Journal { id: string; actor: ActorId; kind: string; memo: string; at: string; entries: { account: string; delta: number }[]; }
export interface Invitation { id: string; syndicateId: string; agentId: string; status: 'pending' | 'accepted' | 'declined'; }
export interface Economy { version: 2; revision: number; agents: Agent[]; syndicates: Syndicate[]; users: { id: string; name: string; balance: number }[]; bounties: Bounty[]; activities: Activity[]; contributions: Contribution[]; wallet: number; platformBalance: number; fees: FeeReceipt[]; journal: Journal[]; invitations: Invitation[]; }
export type Action =
  | { type: 'create'; actor: ActorId; title: string; description: string; reward: number; executorBonus?: number; fundingTarget?: PoolId; category: Category }
  | { type: 'claim' | 'approve' | 'revise' | 'cancel'; actor: ActorId; bountyId: string }
  | { type: 'proof'; actor: ActorId; bountyId: string; text: string; url: string }
  | { type: 'support'; actor: ActorId; target: PoolId; amount: number }
  | { type: 'redeem'; actor: ActorId; contributionId: string }
  | { type: 'fees'; actor: ActorId; agentId: AgentId; gross: number }
  | { type: 'createAgent'; actor: ActorId; name: string; role: string; bio: string; token: string; category: Category; bonus: number; feeShareBps: number; yieldShareBps: number }
  | { type: 'createSyndicate'; actor: ActorId; name: string; description: string; token: string; members: AgentId[]; bonus: number; yieldShareBps: number }
  | { type: 'invite'; actor: ActorId; syndicateId: string; agentId: AgentId }
  | { type: 'respondInvite'; actor: ActorId; invitationId: string; accept: boolean }
  | { type: 'removeMember'; actor: ActorId; syndicateId: string; agentId: AgentId };
export const STORAGE_KEY = 'claw-syndicate:v2';
export const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 100 ? 2 : 0 }).format(n / 100);
export const actorName = (s: Economy, id: string) => id === 'you' ? 'You' : s.agents.find(a => a.id === id)?.name ?? s.users.find(u => u.id === id)?.name ?? id;
export const getPool = (s: Economy, id: string): Pool | undefined => s.agents.find(a => a.id === id) ?? s.syndicates.find(g => g.id === id);
export const poolName = (s: Economy, id: string) => getPool(s, id)?.name ?? id;
export const isAgent = (s: Economy, id: string) => s.agents.some(a => a.id === id);
export const payout = (b: Bounty) => b.reward + b.executorBonus;
export const reserved = (s: Economy, id: string) => s.bounties.filter(b => b.fundingTarget === id && !['completed', 'cancelled'].includes(b.status)).reduce((n, b) => n + payout(b), 0);
export const protectedCapital = (s: Economy, id: string) => s.contributions.filter(c => c.target === id && !c.claimedAt).reduce((n, c) => n + c.amount + c.accruedBonus, 0);
export const available = (s: Economy, id: string) => id === 'you' ? s.wallet : getPool(s, id) ? getPool(s, id)!.pool - reserved(s, id) - protectedCapital(s, id) : s.users.find(u => u.id === id)?.balance ?? 0;
export const toCents = (value: string) => { if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Use an amount with up to two decimal places.'); const n = Math.round(Number(value) * 100); if (!Number.isSafeInteger(n) || n <= 0 || n > 100_000_000) throw new Error('Amount must be between $0.01 and $1,000,000.'); return n; };
export const requireThat: (v: unknown, message: string) => asserts v = (v, message) => { if (!v) throw new Error(message); };
const amount = (n: number) => Number.isSafeInteger(n) && n > 0 && n <= 100_000_000;
const percent = (n: number) => Number.isInteger(n) && n >= 0 && n <= 100;
const bps = (n: number) => Number.isInteger(n) && n >= 0 && n <= 10000;
const text = (v: string, min: number, max: number) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const safeUrl = (url: string) => { try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } };
const portion = (n: number, p: number) => Number(BigInt(n) * BigInt(p) / 10000n);
export const bonusCap = (c: Contribution) => portion(c.amount, c.bonus * 100);
const account = (s: Economy, id: string) => getPool(s, id) ? `pool:${id}` : `wallet:${id}`;
function change(s: Economy, id: string, delta: number) { const pool = getPool(s, id); if (pool) pool.pool += delta; else if (id === 'you') s.wallet += delta; else { const user = s.users.find(u => u.id === id); requireThat(user, 'Recipient account does not exist.'); user.balance += delta; } }

export function initializeJournal(s: Economy): Economy {
  const entries = [{ account: 'wallet:you', delta: s.wallet }, ...s.users.map(u => ({ account: `wallet:${u.id}`, delta: u.balance })), ...[...s.agents, ...s.syndicates].map(p => ({ account: `pool:${p.id}`, delta: p.pool })), { account: 'platform:fees', delta: s.platformBalance }];
  entries.push({ account: 'external:opening', delta: -entries.reduce((n, e) => n + e.delta, 0) });
  s.journal = [{ id: 'opening', actor: 'system', kind: 'opening', memo: 'Opening simulation balances', at: new Date().toISOString(), entries }];
  return s;
}
export function assertInvariants(s: Economy) {
  const pools = [...s.agents, ...s.syndicates];
  requireThat(Number.isSafeInteger(s.wallet) && s.wallet >= 0 && Number.isSafeInteger(s.platformBalance) && s.platformBalance >= 0, 'Invalid wallet balance.');
  requireThat(new Set([...pools.map(p => p.id), ...s.users.map(u => u.id), 'you']).size === pools.length + s.users.length + 1, 'Duplicate account identity.');
  requireThat(new Set(pools.map(p => p.token.toUpperCase())).size === pools.length, 'Token symbols must be unique.');
  for (const p of pools) requireThat(Number.isSafeInteger(p.pool) && available(s, p.id) >= 0, 'Pool cannot spend protected principal, accrued bonuses, or reserved bounty rewards.');
  for (const u of s.users) requireThat(Number.isSafeInteger(u.balance) && u.balance >= 0, 'Negative user balance.');
  for (const c of s.contributions) requireThat(c.accruedBonus >= 0 && c.accruedBonus <= bonusCap(c) && getPool(s, c.target), 'Invalid contribution liability.');
  for (const g of s.syndicates) { requireThat(new Set(g.members).size === g.members.length, 'Duplicate syndicate member.'); for (const id of g.members) requireThat(s.agents.find(a => a.id === id)?.syndicateId === g.id, 'Syndicate membership is inconsistent.'); }
  for (const a of s.agents) if (a.syndicateId) requireThat(s.syndicates.find(g => g.id === a.syndicateId)?.members.includes(a.id), 'Agent membership is inconsistent.');
  const balances = new Map<string, number>();
  for (const tx of s.journal) { requireThat(tx.entries.every(e => Number.isSafeInteger(e.delta)) && tx.entries.reduce((n, e) => n + e.delta, 0) === 0, 'Unbalanced ledger transaction.'); for (const e of tx.entries) balances.set(e.account, (balances.get(e.account) ?? 0) + e.delta); }
  for (const [key, value] of [['wallet:you', s.wallet], ['platform:fees', s.platformBalance], ...s.users.map(u => [`wallet:${u.id}`, u.balance]), ...pools.map(p => [`pool:${p.id}`, p.pool])] as [string, number][]) requireThat((balances.get(key) ?? 0) === value, 'Ledger and account balances disagree.');
}

export function transition(previous: Economy, action: Action, at = new Date().toISOString(), id: string = crypto.randomUUID()): Economy {
  const s = structuredClone(previous);
  requireThat(action.actor === 'you' || isAgent(s, action.actor) || s.users.some(u => u.id === action.actor), 'Unknown identity.');
  const event = (memo: string, kind: Activity['kind'], n?: number, bountyId?: string, entries: Journal['entries'] = []) => { s.activities.unshift({ id, actor: action.actor, text: memo, kind, amount: n, at, bountyId }); s.journal.push({ id, actor: action.actor, memo, kind, at, entries }); };
  const transfer = (from: string, to: string, n: number) => { change(s, from, -n); change(s, to, n); return [{ account: account(s, from), delta: -n }, { account: account(s, to), delta: n }]; };
  if (action.type === 'create') {
    const creator = s.agents.find(a => a.id === action.actor); requireThat(creator, 'Create bounties as an agent.');
    requireThat(text(action.title, 5, 120) && text(action.description, 20, 4000), 'Use a 5–120 character title and 20–4,000 character description.');
    requireThat(CATEGORIES.includes(action.category) && amount(action.reward), 'Invalid bounty category or reward.');
    const executorBonus = action.executorBonus ?? 0;
    requireThat(Number.isSafeInteger(executorBonus) && executorBonus >= 0 && executorBonus <= 100_000_000, 'Invalid executor bonus.');
    const fundingTarget = action.fundingTarget ?? creator.id;
    requireThat(fundingTarget === creator.id || fundingTarget === creator.syndicateId, 'This agent cannot spend from that pool.');
    requireThat(available(s, fundingTarget) >= action.reward + executorBonus, 'Not enough available capital after protected deposits and bounty reservations.');
    s.bounties.unshift({ id, creator: creator.id, fundingTarget, title: action.title.trim(), description: action.description.trim(), reward: action.reward, executorBonus, category: action.category, status: 'open', createdAt: at });
    event(`posted “${action.title.trim()}”`, 'bounty', action.reward + executorBonus, id);
  } else if (action.type === 'support') {
    requireThat(amount(action.amount) && action.actor !== action.target, 'Invalid contribution or self-support.');
    const pool = getPool(s, action.target); requireThat(pool, 'Pool not found.');
    requireThat(available(s, action.actor) >= action.amount, 'Insufficient spendable balance.');
    const entries = transfer(action.actor, action.target, action.amount);
    s.contributions.unshift({ id, actor: action.actor, target: action.target, amount: action.amount, at, bonus: pool.bonus, accruedBonus: 0 });
    event(`supported ${pool.name}; principal protected`, 'support', action.amount, undefined, entries);
  } else if (action.type === 'redeem') {
    const c = s.contributions.find(c => c.id === action.contributionId);
    requireThat(c && c.actor === action.actor && !c.claimedAt, 'Only the contributor can redeem an active position, once.');
    const n = c.amount + c.accruedBonus; c.claimedAt = at;
    event(`received principal and earned bonus from ${poolName(s, c.target)}`, 'return', n, undefined, transfer(c.target, c.actor, n));
  } else if (action.type === 'fees') {
    const a = s.agents.find(a => a.id === action.agentId); requireThat(a && (a.ownerId === action.actor || a.id === action.actor), 'Only this agent or its owner can record simulated fees.');
    requireThat(amount(action.gross), 'Invalid gross fee amount.');
    const pool = getPool(s, a.syndicateId ?? a.id)!;
    const credited = portion(action.gross, a.feeShareBps), platform = action.gross - credited;
    pool.pool += credited; s.platformBalance += platform;
    const positions = s.contributions.filter(c => c.target === pool.id && !c.claimedAt && c.accruedBonus < bonusCap(c)).sort((a,b) => a.id.localeCompare(b.id));
    let budget = portion(credited, pool.yieldShareBps), yieldAccrued = 0;
    // Capped proportional allocation in integer cents. No interest is minted.
    while (budget > 0 && positions.some(c => c.accruedBonus < bonusCap(c))) {
      const active = positions.filter(c => c.accruedBonus < bonusCap(c));
      const weight = active.reduce((n,c) => n + BigInt(c.amount), 0n);
      let distributed = 0;
      for (const c of active) { const n = Math.min(bonusCap(c) - c.accruedBonus, Number(BigInt(budget) * BigInt(c.amount) / weight)); c.accruedBonus += n; distributed += n; }
      if (!distributed) { for (const c of active) { if (distributed >= budget) break; c.accruedBonus++; distributed++; } }
      budget -= distributed; yieldAccrued += distributed;
    }
    s.fees.unshift({ id, agentId: a.id, target: pool.id, gross: action.gross, credited, platform, yieldAccrued, at });
    event(`recorded simulated trading fees for ${a.name}; ${money(yieldAccrued)} allocated to backers`, 'fees', credited, undefined, [{ account: 'external:simulated-fees', delta: -action.gross }, { account: `pool:${pool.id}`, delta: credited }, { account: 'platform:fees', delta: platform }]);
  } else if (action.type === 'createAgent') {
    requireThat(!isAgent(s, action.actor), 'A human account must own a new agent.');
    requireThat(text(action.name, 2, 40) && text(action.role, 3, 80) && text(action.bio, 20, 2000), 'Check the agent name, role, and description.');
    requireThat(/^\$?[A-Za-z][A-Za-z0-9]{1,9}$/.test(action.token) && CATEGORIES.includes(action.category), 'Use a 2–10 character token symbol and valid specialty.');
    requireThat(percent(action.bonus) && Number.isInteger(action.feeShareBps) && action.feeShareBps >= 6500 && action.feeShareBps <= 7500 && bps(action.yieldShareBps), 'Invalid bonus or fee allocation. Agent fee share must be 65–75%.');
    s.agents.push({ id: `agent_${id}`, name: action.name.trim(), role: action.role.trim(), bio: action.bio.trim(), token: `$${action.token.replace(/^\$/, '').toUpperCase()}`, pool: 0, bonus: action.bonus, ownerId: action.actor, category: action.category, feeShareBps: action.feeShareBps, yieldShareBps: action.yieldShareBps });
    event(`created agent ${action.name.trim()}`, 'agent');
  } else if (action.type === 'createSyndicate') {
    requireThat(!isAgent(s, action.actor) && text(action.name, 2, 60) && text(action.description, 20, 2000), 'Check syndicate name, description, and owner identity.');
    requireThat(/^\$?[A-Za-z][A-Za-z0-9]{1,9}$/.test(action.token) && percent(action.bonus) && bps(action.yieldShareBps), 'Invalid syndicate token or bonus rules.');
    requireThat(action.members.length >= 2 && new Set(action.members).size === action.members.length, 'Choose at least two distinct agents.');
    const members = action.members.map(id => s.agents.find(a => a.id === id));
    requireThat(members.every(a => a && a.ownerId === action.actor && !a.syndicateId), 'Initial members must be your own independent agents. Invite other owners after creation.');
    const group: Syndicate = { id: `syndicate_${id}`, name: action.name.trim(), description: action.description.trim(), token: `$${action.token.replace(/^\$/, '').toUpperCase()}`, pool: 0, ownerId: action.actor, bonus: action.bonus, yieldShareBps: action.yieldShareBps, members: action.members };
    s.syndicates.push(group); members.forEach(a => { a!.syndicateId = group.id; });
    event(`formed ${group.name}; future member fees route to the shared pool`, 'syndicate');
  } else if (action.type === 'invite' || action.type === 'removeMember') {
    const g = s.syndicates.find(g => g.id === action.syndicateId); const a = s.agents.find(a => a.id === action.agentId);
    requireThat(g && a && g.ownerId === action.actor, 'Only the syndicate owner can manage members.');
    if (action.type === 'invite') { requireThat(!a.syndicateId && !s.invitations.some(i => i.agentId === a.id && i.syndicateId === g.id && i.status === 'pending'), 'Agent already has a syndicate or pending invitation.'); s.invitations.push({ id, agentId: a.id, syndicateId: g.id, status: 'pending' }); event(`invited ${a.name} to ${g.name}`, 'syndicate'); }
    else { requireThat(a.syndicateId === g.id, 'Agent is not a member.'); delete a.syndicateId; g.members = g.members.filter(id => id !== a.id); event(`removed ${a.name} from ${g.name}; future fees go to its own pool`, 'syndicate'); }
  } else if (action.type === 'respondInvite') {
    const invitation = s.invitations.find(i => i.id === action.invitationId); const a = s.agents.find(a => a.id === invitation?.agentId);
    requireThat(invitation?.status === 'pending' && a && (action.actor === a.ownerId || action.actor === a.id), 'Only the invited agent or its owner can respond.');
    if (action.accept) { requireThat(!a.syndicateId, 'Agent has already joined a syndicate.'); const g = s.syndicates.find(g => g.id === invitation.syndicateId)!; g.members.push(a.id); a.syndicateId = g.id; }
    invitation.status = action.accept ? 'accepted' : 'declined'; event(`${action.accept ? 'accepted' : 'declined'} syndicate invitation for ${a.name}`, 'syndicate');
  } else {
    const b = s.bounties.find(b => b.id === action.bountyId); requireThat(b, 'Bounty not found.');
    if (action.type === 'claim') { requireThat(b.status === 'open' && b.creator !== action.actor, 'Only another participant can claim an open bounty.'); b.assignee = action.actor; b.status = 'in_progress'; event(`claimed “${b.title}”`, 'bounty', undefined, b.id); }
    else if (action.type === 'proof') { requireThat(b.status === 'in_progress' && b.assignee === action.actor, 'Only the assigned executor can submit proof.'); requireThat(text(action.text, 20, 4000) && safeUrl(action.url.trim()) && action.url.length <= 2000, 'Provide 20–4,000 characters and an http(s) deliverable link.'); b.proof = { text: action.text.trim(), url: action.url.trim(), submittedAt: at }; b.status = 'in_review'; event(`submitted proof for “${b.title}”`, 'bounty', undefined, b.id); }
    else if (action.type === 'approve') { requireThat(b.status === 'in_review' && b.creator === action.actor && b.assignee && b.proof, 'Only the creator can approve unpaid, submitted work.'); const n = payout(b); requireThat(getPool(s, b.fundingTarget)!.pool >= n, 'Pool cannot cover the reward.'); b.status = 'completed'; b.completedAt = at; event(`paid ${actorName(s, b.assignee)} for “${b.title}”, including ${money(b.executorBonus)} bonus`, 'payment', n, b.id, transfer(b.fundingTarget, b.assignee, n)); }
    else if (action.type === 'revise') { requireThat(b.status === 'in_review' && b.creator === action.actor, 'Only the creator can request revisions.'); b.status = 'in_progress'; event(`requested changes to “${b.title}”`, 'bounty', undefined, b.id); }
    else if (action.type === 'cancel') { requireThat(b.status === 'open' && b.creator === action.actor, 'Only the creator can cancel an unclaimed bounty.'); b.status = 'cancelled'; event(`cancelled “${b.title}”; reservation released`, 'bounty', payout(b), b.id); }
  }
  s.revision++; assertInvariants(s); return s;
}
