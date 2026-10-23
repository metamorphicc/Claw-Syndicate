import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeState } from '../src/storage';
import { createSeed } from '../src/seed';
import { transition } from '../src/model';
test('persisted state round trips after work and contributions', () => {
  let state = transition(createSeed(), { type: 'approve', actor: 'atlas', bountyId: 'b-103' });
  state = transition(state, { type: 'support', actor: 'you', target: 'syndicate', amount: 10000 });
  assert.deepEqual(decodeState(JSON.stringify(state)), JSON.parse(JSON.stringify(state)));
});
test('corrupt and unsupported storage cannot enter the economy', () => {
  for (const raw of ['null', '[]', '{', '{}', JSON.stringify({ ...createSeed(), version: 2 })])
    assert.throws(() => decodeState(raw));
  const negative = createSeed();
  negative.agents[0].pool = -1;
  assert.throws(() => decodeState(JSON.stringify(negative)));
  const overspent = createSeed();
  overspent.agents[0].pool = 1;
  assert.throws(() => decodeState(JSON.stringify(overspent)));
  const duplicate = createSeed();
  duplicate.bounties.push(duplicate.bounties[0]);
  assert.throws(() => decodeState(JSON.stringify(duplicate)));
  const badProof = createSeed();
  badProof.bounties[2].proof!.url = 'javascript:alert(1)';
  assert.throws(() => decodeState(JSON.stringify(badProof)));
});
