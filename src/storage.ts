import type { Economy } from './model';
import { STORAGE_KEY, reserved } from './model';
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const balance = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
export function decodeState(raw: string): Economy {
  const s: unknown = JSON.parse(raw);
  if (
    !record(s) ||
    s.version !== 1 ||
    !balance(s.revision) ||
    !balance(s.wallet) ||
    !Array.isArray(s.agents) ||
    s.agents.length !== 4 ||
    !Array.isArray(s.bounties) ||
    !Array.isArray(s.activities) ||
    !Array.isArray(s.contributions) ||
    !record(s.syndicate)
  )
    throw new Error('Saved demo data is invalid. Reset the demo from the guide to start again.');
  const agentIds = ['atlas', 'vex', 'echo', 'cipher'];
  const actor = (v: unknown) => text(v) && (v === 'you' || agentIds.includes(v));
  const agent = (v: unknown) => text(v) && agentIds.includes(v);
  const categories = ['Research', 'Trading', 'Content', 'Development'];
  if (
    !s.agents.every(
      (a) =>
        record(a) &&
        agent(a.id) &&
        text(a.name) &&
        text(a.role) &&
        text(a.token) &&
        text(a.bio) &&
        balance(a.pool) &&
        balance(a.bonus) &&
        text(a.category) &&
        categories.includes(a.category),
    ) ||
    new Set(s.agents.map((a) => a.id)).size !== 4
  )
    throw new Error('Saved agent data is invalid.');
  if (
    !balance(s.syndicate.pool) ||
    !balance(s.syndicate.bonus) ||
    !Array.isArray(s.syndicate.members) ||
    !s.syndicate.members.every(agent)
  )
    throw new Error('Saved syndicate data is invalid.');
  if (
    !s.bounties.every(
      (b) =>
        record(b) &&
        text(b.id) &&
        text(b.title) &&
        text(b.description) &&
        agent(b.creator) &&
        balance(b.reward) &&
        b.reward > 0 &&
        text(b.category) &&
        categories.includes(b.category) &&
        text(b.status) &&
        ['open', 'in_progress', 'in_review', 'completed', 'cancelled'].includes(b.status) &&
        date(b.createdAt) &&
        (b.assignee === undefined || (actor(b.assignee) && b.assignee !== b.creator)) &&
        (!['in_progress', 'in_review', 'completed'].includes(b.status) || actor(b.assignee)) &&
        (!['in_review', 'completed'].includes(b.status) || record(b.proof)) &&
        (b.proof === undefined ||
          (record(b.proof) &&
            text(b.proof.text) &&
            text(b.proof.url) &&
            /^https?:\/\//i.test(b.proof.url) &&
            date(b.proof.submittedAt))),
    )
  )
    throw new Error('Saved bounty data is invalid.');
  if (new Set(s.bounties.map((b) => b.id)).size !== s.bounties.length)
    throw new Error('Duplicate saved bounty IDs.');
  if (
    !s.activities.every(
      (a) =>
        record(a) &&
        text(a.id) &&
        actor(a.actor) &&
        text(a.text) &&
        text(a.kind) &&
        ['bounty', 'payment', 'support', 'syndicate'].includes(a.kind) &&
        date(a.at) &&
        (a.amount === undefined || balance(a.amount)) &&
        (a.bountyId === undefined || text(a.bountyId)),
    )
  )
    throw new Error('Saved ledger data is invalid.');
  if (
    !s.contributions.every(
      (c) =>
        record(c) &&
        text(c.id) &&
        actor(c.actor) &&
        (agent(c.target) || c.target === 'syndicate') &&
        balance(c.amount) &&
        c.amount > 0 &&
        balance(c.bonus) &&
        date(c.at),
    )
  )
    throw new Error('Saved contribution data is invalid.');
  const state = s as unknown as Economy;
  if (state.agents.some((a) => reserved(state, a.id) > a.pool))
    throw new Error('Saved rewards exceed their pool balance.');
  return state;
}
export function readSaved(): Economy | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? decodeState(raw) : null;
}
