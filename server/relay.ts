const routeAllowed = (method: string, path: string) =>
  (method === 'GET' && ['/api/health', '/api/state', '/api/me', '/api/keys'].includes(path)) ||
  (method === 'POST' &&
    [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/actions',
      '/api/keys',
    ].includes(path)) ||
  (method === 'DELETE' && /^\/api\/keys\/[a-f0-9-]{36}$/.test(path));
async function limited(stream: ReadableStream<Uint8Array> | null, limit: number) {
  if (!stream) return undefined;
  const reader = stream.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Body too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
export function createRelay(
  config: { upstream?: string; token?: string; origins: string[] },
  send: typeof fetch = fetch,
) {
  return async (request: Request): Promise<Response> => {
    const fail = (status: number, error: string) =>
      Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
    if (!config.upstream || !config.token || config.token.length < 32)
      return fail(503, 'API relay is not configured.');
    let upstream: URL;
    try {
      upstream = new URL(config.upstream);
      if (
        upstream.protocol !== 'https:' ||
        upstream.username ||
        upstream.password ||
        upstream.pathname !== '/' ||
        upstream.search ||
        upstream.hash
      )
        throw new Error();
    } catch {
      return fail(503, 'API_UPSTREAM must be an HTTPS origin.');
    }
    const incoming = new URL(request.url);
    // Vercel rewrites supply relayPath; direct paths are useful for local contract tests.
    const path =
      incoming.pathname === '/api/relay'
        ? `/api/${incoming.searchParams.get('relayPath') ?? ''}`
        : incoming.pathname;
    if (!routeAllowed(request.method, path)) return fail(404, 'API route not found.');
    const origin = request.headers.get('origin');
    if (origin && !config.origins.includes(origin)) return fail(403, 'Origin is not allowed.');
    if (
      !['GET', 'HEAD'].includes(request.method) &&
      !request.headers.has('authorization') &&
      !origin
    )
      return fail(403, 'An allowed Origin is required.');
    const headers = new Headers({ 'X-Claw-Proxy-Token': config.token });
    for (const name of ['content-type', 'authorization', 'idempotency-key', 'if-match']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const session = request.headers
      .get('cookie')
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('claw_session='));
    if (session) headers.set('cookie', session);
    if (origin) headers.set('origin', origin);
    let body: Uint8Array | undefined;
    try {
      body = await limited(request.body, 65536);
    } catch {
      return fail(413, 'Request body is too large.');
    }
    try {
      const response = await send(new URL(path, upstream), {
        method: request.method,
        headers,
        body: body as BodyInit | undefined,
        redirect: 'error',
        signal: AbortSignal.timeout(12000),
      });
      const output = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      for (const cookie of response.headers.getSetCookie()) output.append('Set-Cookie', cookie);
      for (const name of ['retry-after']) {
        const value = response.headers.get(name);
        if (value) output.set(name, value);
      }
      const data = await limited(response.body, 16 * 1024 * 1024);
      return new Response(data as BodyInit | undefined, {
        status: response.status,
        headers: output,
      });
    } catch {
      return fail(502, 'The PC API is unreachable. Check the API process and HTTPS tunnel.');
    }
  };
}
