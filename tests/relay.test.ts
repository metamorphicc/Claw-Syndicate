import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelay } from '../server/relay';
const origin = 'https://claw.example.com',
  token = 'test-proxy-secret-at-least-32-characters';
test('Vercel relay uses fixed upstream, keeps session cookies, preserves commands and rejects cross-origin traffic', async () => {
  let calls = 0;
  const relay = createRelay(
    { upstream: 'https://pc.example.com', token, origins: [origin] },
    (async (url, options) => {
      calls++;
      assert.equal(String(url), 'https://pc.example.com/api/actions');
      const headers = new Headers(options?.headers);
      assert.equal(headers.get('x-claw-proxy-token'), token);
      assert.equal(headers.get('cookie'), 'claw_session=test');
      assert.equal(headers.get('if-match'), '4');
      assert.equal(headers.get('idempotency-key'), 'command-123');
      assert.equal(headers.get('origin'), origin);
      return Response.json(
        { state: { revision: 5 } },
        { headers: { 'Set-Cookie': 'claw_session=new; HttpOnly; Secure; SameSite=Lax; Path=/' } },
      );
    }) as typeof fetch,
  );
  const request = new Request(`${origin}/api/relay?relayPath=actions`, {
    method: 'POST',
    headers: {
      origin,
      cookie: 'other=private; claw_session=test',
      'if-match': '4',
      'idempotency-key': 'command-123',
      'x-claw-proxy-token': 'attacker',
    },
    body: '{}',
  });
  const response = await relay(request);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const evil = await relay(
    new Request(`${origin}/api/actions`, {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: '{}',
    }),
  );
  assert.equal(evil.status, 403);
  const arbitrary = await relay(new Request(`${origin}/api/relay?relayPath=https://evil.example`));
  assert.equal(arbitrary.status, 404);
  assert.equal(calls, 1);
  const huge = await relay(
    new Request(`${origin}/api/actions`, {
      method: 'POST',
      headers: { origin },
      body: 'a'.repeat(65537),
    }),
  );
  assert.equal(huge.status, 413);
});
test('relay reports missing configuration and offline PC without leaking upstream errors', async () => {
  assert.equal(
    (await createRelay({ origins: [] })(new Request(`${origin}/api/state`))).status,
    503,
  );
  const relay = createRelay(
    { upstream: 'https://pc.example.com', token, origins: [origin] },
    (async () => {
      throw new Error('private network details');
    }) as typeof fetch,
  );
  const response = await relay(new Request(`${origin}/api/state`));
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('private network'));
});
import { Store } from '../server/store';
import { buildApi } from '../server/app';
test('a lost relay response after commit is safely replayed through the production API contract', async () => {
  const store = new Store(':memory:');
  const owner = await store.register(
    'relay@example.com',
    'Relay owner',
    'Relay-test-password',
    true,
  );
  const app = buildApi({ store, origins: [origin], secureCookies: true, proxyToken: token });
  let drop = false;
  const relay = createRelay(
    { upstream: 'https://pc.example.com', token, origins: [origin] },
    (async (url, options) => {
      const result = await app.inject({
        method: options!.method as 'GET' | 'POST',
        url: new URL(String(url)).pathname,
        headers: Object.fromEntries(new Headers(options!.headers)),
        payload: options!.body ? Buffer.from(options!.body as Uint8Array) : undefined,
      });
      if (drop && result.statusCode === 200) {
        drop = false;
        throw new Error('Connection lost after commit');
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(result.headers)) {
        if (value !== undefined) {
          for (const entry of Array.isArray(value) ? value : [String(value)])
            headers.append(key, entry);
        }
      }
      return new Response(result.body, { status: result.statusCode, headers });
    }) as typeof fetch,
  );
  try {
    const login = await relay(
      new Request(`${origin}/api/auth/login`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'relay@example.com', password: 'Relay-test-password' }),
      }),
    );
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    assert.match(login.headers.get('set-cookie')!, /Secure/);
    const body = JSON.stringify({ type: 'fees', actor: owner.id, agentId: 'atlas', gross: 10000 }),
      key = crypto.randomUUID(),
      revision = store.state().revision;
    const command = () =>
      new Request(`${origin}/api/actions`, {
        method: 'POST',
        headers: {
          origin,
          cookie,
          'content-type': 'application/json',
          'idempotency-key': key,
          'if-match': String(revision),
        },
        body,
      });
    drop = true;
    assert.equal((await relay(command())).status, 502);
    assert.equal(store.state().fees.length, 1);
    const retry = await relay(command());
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).replayed, true);
    assert.equal(store.state().fees.length, 1);
    assert.equal(store.state().platformBalance, 3000);
    assert.equal((await app.inject({ url: '/api/state' })).statusCode, 403);
  } finally {
    await app.close();
  }
});
