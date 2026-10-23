import test from 'node:test';
import assert from 'node:assert/strict';
import { transition, available, reserved, toCents } from '../src/model';
import { createSeed } from '../src/seed';
const total = (s: ReturnType<typeof createSeed>) =>
  s.wallet + s.syndicate.pool + s.agents.reduce((n, a) => n + a.pool, 0);
test('complete lifecycle reserves funds, preserves capital and pays once', () => {
  let s = createSeed();
  const before = total(s);
  const pool = s.agents[0].pool;
  s = transition(
    s,
    {
      type: 'create',
      actor: 'atlas',
      title: 'Lifecycle report',
      description: 'A sufficiently detailed research deliverable.',
      reward: 10000,
      category: 'Research',
    },
    undefined,
    'test',
  );
  assert.equal(s.agents[0].pool, pool);
  assert.equal(reserved(s, 'atlas'), 47000);
  s = transition(s, { type: 'claim', actor: 'you', bountyId: 'test' });
  s = transition(s, {
    type: 'proof',
    actor: 'you',
    bountyId: 'test',
    text: 'Completed research with all required sources.',
    url: 'https://example.com/proof',
  });
  s = transition(s, { type: 'approve', actor: 'atlas', bountyId: 'test' });
  assert.equal(s.wallet, 260000);
  assert.equal(s.agents[0].pool, pool - 10000);
  assert.equal(total(s), before);
  assert.throws(() => transition(s, { type: 'approve', actor: 'atlas', bountyId: 'test' }));
});
test('agents pay other agents, with strict creator and executor permissions', () => {
  const s = createSeed();
  assert.throws(() => transition(s, { type: 'claim', actor: 'atlas', bountyId: 'b-101' }));
  assert.throws(() => transition(s, { type: 'approve', actor: 'echo', bountyId: 'b-103' }));
  const paid = transition(s, { type: 'approve', actor: 'atlas', bountyId: 'b-103' });
  assert.equal(paid.agents[2].pool, s.agents[2].pool + 12000);
  assert.equal(total(paid), total(s));
  assert.equal(s.bounties[2].status, 'in_review');
});
test('overspending reserved rewards and duplicate claims are rejected', () => {
  let s = createSeed();
  assert.throws(() =>
    transition(s, {
      type: 'create',
      actor: 'atlas',
      title: 'Too expensive',
      description: 'A sufficiently detailed research deliverable.',
      reward: s.agents[0].pool,
      category: 'Research',
    }),
  );
  assert.throws(() =>
    transition(s, {
      type: 'support',
      actor: 'atlas',
      target: 'syndicate',
      amount: s.agents[0].pool,
    }),
  );
  s = transition(s, { type: 'claim', actor: 'vex', bountyId: 'b-101' });
  assert.throws(() => transition(s, { type: 'claim', actor: 'you', bountyId: 'b-101' }));
  assert.throws(() => transition(s, { type: 'cancel', actor: 'atlas', bountyId: 'b-101' }));
});
test('cancellation releases reservations, revision allows resubmission', () => {
  const s = createSeed();
  const cancelled = transition(s, { type: 'cancel', actor: 'atlas', bountyId: 'b-101' });
  assert.equal(available(cancelled, 'atlas'), available(s, 'atlas') + 25000);
  const revised = transition(s, { type: 'revise', actor: 'atlas', bountyId: 'b-103' });
  assert.equal(revised.bounties[2].status, 'in_progress');
  assert.throws(() =>
    transition(revised, {
      type: 'proof',
      actor: 'you',
      bountyId: 'b-103',
      text: 'Completed work with sufficient details.',
      url: 'https://example.com',
    }),
  );
  assert.equal(
    transition(revised, {
      type: 'proof',
      actor: 'echo',
      bountyId: 'b-103',
      text: 'Updated work with sufficient details.',
      url: 'https://example.com',
    }).bounties[2].status,
    'in_review',
  );
});
test('support moves existing capital and snapshots the simulated bonus', () => {
  const s = createSeed();
  for (const target of ['syndicate', 'vex'] as const) {
    const next = transition(s, { type: 'support', actor: 'you', target, amount: 10000 });
    assert.equal(total(next), total(s));
    assert.equal(next.wallet, s.wallet - 10000);
    assert.equal(next.contributions[0].amount, 10000);
  }
  assert.throws(() =>
    transition(s, { type: 'support', actor: 'vex', target: 'vex', amount: 10000 }),
  );
});
test('money and proof inputs reject invalid or unsafe values', () => {
  assert.equal(toCents('10.25'), 1025);
  for (const value of ['-1', '0', 'NaN', 'Infinity', '1.001', '1e3', ''])
    assert.throws(() => toCents(value));
  for (const amount of [NaN, Infinity, -1, 0, 1.5])
    assert.throws(() =>
      transition(createSeed(), { type: 'support', actor: 'you', target: 'syndicate', amount }),
    );
  const s = transition(createSeed(), { type: 'claim', actor: 'you', bountyId: 'b-101' });
  assert.throws(() =>
    transition(s, {
      type: 'proof',
      actor: 'you',
      bountyId: 'b-101',
      text: 'Completed research with all required sources.',
      url: 'javascript:alert(1)',
    }),
  );
});
