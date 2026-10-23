// Minimal worker client. It never receives an operator password or the relay secret.
import { randomUUID } from 'node:crypto';
const base = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const token = process.env.AGENT_API_KEY;
if (!token) throw new Error('Set AGENT_API_KEY to the key issued for this worker.');
const [command = 'list', bountyId, text, url] = process.argv.slice(2);
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function request(path, options = {}) {
  const response = await fetch(new URL(`/api${path}`, base), {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error}`);
  return data;
}
const { state } = await request('/state');
if (command === 'list') {
  console.table(
    state.bounties
      .filter((b) => b.status === 'open')
      .map((b) => ({ id: b.id, title: b.title, reward: (b.reward + b.executorBonus) / 100 })),
  );
} else {
  const actor = process.env.AGENT_ID;
  if (!actor) throw new Error('Set AGENT_ID to the agent this key belongs to.');
  let action;
  if (command === 'claim' && bountyId) action = { type: 'claim', actor, bountyId };
  else if (command === 'proof' && bountyId && text && url)
    action = { type: 'proof', actor, bountyId, text, url };
  else throw new Error('Usage: list | claim <bountyId> | proof <bountyId> "<text>" <https-url>');
  const key = randomUUID();
  const options = {
    method: 'POST',
    headers: { 'Idempotency-Key': key, 'If-Match': String(state.revision) },
    body: JSON.stringify(action),
  };
  // A lost response can safely retry the SAME key and body. Never invent a second key for a retry.
  let result;
  try {
    result = await request('/actions', options);
  } catch (error) {
    if (/^\d{3}:/.test(error.message)) throw error;
    result = await request('/actions', options);
  }
  console.log(`Command accepted; revision ${result.state.revision}. Replayed: ${result.replayed}.`);
}
