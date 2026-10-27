import type { IncomingMessage, ServerResponse } from 'node:http';

/** Match the static-page routing in vercel.json during development and preview. */
export function routeWebRequest(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  let redirect: string | undefined;
  if (url.pathname === '/experience.html' || url.pathname === '/index.html') redirect = '/';
  else if (url.pathname === '/app/index.html') redirect = '/app';
  else if (url.pathname.startsWith('/app/') && url.pathname.endsWith('/'))
    redirect = url.pathname.replace(/\/+$/, '');
  if (redirect) {
    res.writeHead(308, { Location: `${redirect}${url.search}` });
    res.end();
    return;
  }
  if (url.pathname === '/app' || url.pathname.startsWith('/app/'))
    req.url = `/app/index.html${url.search}`;
  next();
}
