import { z } from 'zod';
const id = z.string().min(1).max(150);
const cents = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const amount = cents.min(1).max(100_000_000);
const category = z.enum(['Research', 'Trading', 'Content', 'Development']);
const date = z.iso.datetime();
const text = z.string().trim().min(1).max(4000);
const percent = z.number().int().min(0).max(100);
const bps = z.number().int().min(0).max(10000);
const pool = {
  id,
  name: text,
  token: text,
  pool: cents,
  bonus: percent,
  ownerId: id,
  yieldShareBps: bps,
};
const proof = z.object({
  text,
  url: z.url().refine((v) => /^https?:\/\//i.test(v)),
  submittedAt: date,
});
export const stateSchema = z.object({
  version: z.literal(2),
  revision: cents,
  wallet: cents,
  platformBalance: cents,
  agents: z.array(
    z.object({
      ...pool,
      role: text,
      bio: text,
      category,
      feeShareBps: bps,
      syndicateId: id.optional(),
    }),
  ),
  syndicates: z.array(z.object({ ...pool, description: text, members: z.array(id) })).min(1),
  users: z.array(z.object({ id, name: text, balance: cents })),
  bounties: z
    .array(
      z.object({
        id,
        title: text,
        description: text,
        creator: id,
        fundingTarget: id,
        reward: amount,
        executorBonus: cents,
        category,
        status: z.enum(['open', 'in_progress', 'in_review', 'completed', 'cancelled']),
        assignee: id.optional(),
        proof: proof.optional(),
        createdAt: date,
        completedAt: date.optional(),
      }),
    )
    .superRefine((bs, ctx) => {
      if (new Set(bs.map((b) => b.id)).size !== bs.length)
        ctx.addIssue({ code: 'custom', message: 'Duplicate bounty ID' });
      for (const b of bs) {
        if (['in_progress', 'in_review', 'completed'].includes(b.status) && !b.assignee)
          ctx.addIssue({ code: 'custom', message: 'Missing executor' });
        if (['in_review', 'completed'].includes(b.status) && !b.proof)
          ctx.addIssue({ code: 'custom', message: 'Missing proof' });
      }
    }),
  activities: z.array(
    z.object({
      id,
      actor: id,
      text,
      amount: cents.optional(),
      kind: z.enum(['bounty', 'payment', 'support', 'syndicate', 'fees', 'return', 'agent']),
      at: date,
      bountyId: id.optional(),
    }),
  ),
  contributions: z.array(
    z.object({
      id,
      actor: id,
      target: id,
      amount,
      at: date,
      bonus: percent,
      accruedBonus: cents,
      claimedAt: date.optional(),
    }),
  ),
  fees: z.array(
    z.object({
      id,
      agentId: id,
      target: id,
      gross: amount,
      credited: cents,
      platform: cents,
      yieldAccrued: cents,
      at: date,
    }),
  ),
  journal: z.array(
    z.object({
      id,
      actor: id,
      kind: text,
      memo: text,
      at: date,
      entries: z.array(
        z.object({
          account: id,
          delta: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
        }),
      ),
    }),
  ),
  invitations: z.array(
    z.object({
      id,
      syndicateId: id,
      agentId: id,
      status: z.enum(['pending', 'accepted', 'declined']),
    }),
  ),
});
const base = { actor: id };
export const actionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...base,
    type: z.literal('create'),
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(20).max(4000),
    reward: amount,
    executorBonus: cents.max(100_000_000).optional(),
    fundingTarget: id.optional(),
    category,
  }),
  ...(['claim', 'approve', 'revise', 'cancel'] as const).map((type) =>
    z.strictObject({ ...base, type: z.literal(type), bountyId: id }),
  ),
  z.strictObject({
    ...base,
    type: z.literal('proof'),
    bountyId: id,
    text: z.string().trim().min(20).max(4000),
    url: z
      .string()
      .max(2000)
      .url()
      .refine((v) => /^https?:\/\//i.test(v)),
  }),
  z.strictObject({ ...base, type: z.literal('support'), target: id, amount }),
  z.strictObject({ ...base, type: z.literal('redeem'), contributionId: id }),
  z.strictObject({ ...base, type: z.literal('fees'), agentId: id, gross: amount }),
  z.strictObject({
    ...base,
    type: z.literal('createAgent'),
    name: z.string().trim().min(2).max(40),
    role: z.string().trim().min(3).max(80),
    bio: z.string().trim().min(20).max(2000),
    token: z.string().regex(/^\$?[A-Za-z][A-Za-z0-9]{1,9}$/),
    category,
    bonus: percent,
    feeShareBps: z.number().int().min(6500).max(7500),
    yieldShareBps: bps,
  }),
  z.strictObject({
    ...base,
    type: z.literal('createSyndicate'),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().min(20).max(2000),
    token: z.string().regex(/^\$?[A-Za-z][A-Za-z0-9]{1,9}$/),
    members: z.array(id).min(2).max(50),
    bonus: percent,
    yieldShareBps: bps,
  }),
  ...(['invite', 'removeMember'] as const).map((type) =>
    z.strictObject({ ...base, type: z.literal(type), syndicateId: id, agentId: id }),
  ),
  z.strictObject({
    ...base,
    type: z.literal('respondInvite'),
    invitationId: id,
    accept: z.boolean(),
  }),
]);
