import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { appHref, isAppPath, legacyAppHref, readAppRoute } from '../src/navigation';
import { routeWebRequest } from '../web-routes';

test('clean application URLs preserve detail routes and old bookmarks without capturing landing anchors', () => {
  assert.equal(appHref('/'), '/app');
  assert.equal(appHref('/agents/cipher'), '/app/agents/cipher');
  assert.equal(appHref('/bounties/b-103?source=mail'), '/app/bounties/b-103?source=mail');
  assert.equal(readAppRoute('/app'), '/');
  assert.equal(readAppRoute('/app/syndicate/group-1'), '/syndicate/group-1');
  assert.equal(readAppRoute('/app/agents/'), '/agents');
  assert.equal(isAppPath('/application'), false);
  assert.equal(isAppPath('/api/state'), false);
  assert.equal(legacyAppHref('#/'), '/app');
  assert.equal(legacyAppHref('#/bounties/b-103'), '/app/bounties/b-103');
  assert.equal(
    legacyAppHref('#/agents/cipher', '?source=bookmark'),
    '/app/agents/cipher?source=bookmark',
  );
  assert.equal(legacyAppHref('#work'), null);
  assert.equal(legacyAppHref('#main'), null);
  assert.equal(legacyAppHref('#//other.example'), null);
  assert.throws(() => appHref('https://other.example'));
});

test('page routing supports direct reloads and legacy redirects while leaving API and assets intact', async () => {
  const server = createServer((req, res) =>
    routeWebRequest(req, res, () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ target: req.url }));
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of [
      '/app',
      '/app/agents/cipher',
      '/app/bounties/b-103',
      '/app/syndicate/group-1',
    ]) {
      const response = await fetch(`${base}${path}?source=direct`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { target: '/app/index.html?source=direct' });
    }
    for (const path of [
      '/',
      '/api/state',
      '/api/me',
      '/assets/app.js',
      '/models/claw-core.glb',
      '/application',
    ]) {
      assert.deepEqual(await (await fetch(`${base}${path}`)).json(), { target: path });
    }
    for (const [path, destination] of [
      ['/experience.html', '/'],
      ['/index.html', '/'],
      ['/app/index.html', '/app'],
      ['/app/', '/app'],
      ['/app/agents/', '/app/agents'],
    ]) {
      const response = await fetch(`${base}${path}?source=old`, { redirect: 'manual' });
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), `${destination}?source=old`);
    }
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    assert.equal(config.trailingSlash, false);
    assert.deepEqual(config.rewrites[0], {
      source: '/api/:path*',
      destination: '/api/relay?relayPath=:path*',
    });
    for (const source of ['/app', '/app/:path*'])
      assert.equal(
        config.rewrites.find((rule: { source: string }) => rule.source === source)?.destination,
        '/app/index.html',
      );
    assert.equal(
      config.redirects.find((rule: { source: string }) => rule.source === '/experience.html')
        ?.destination,
      '/',
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
