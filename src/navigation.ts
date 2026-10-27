export const APP_NAVIGATION_EVENT = 'claw:app-navigation';

export function isAppPath(pathname: string): boolean {
  return pathname === '/app' || pathname.startsWith('/app/');
}

export function readAppRoute(pathname: string): string {
  if (!isAppPath(pathname)) return '/';
  return pathname.slice('/app'.length).replace(/\/+$/, '') || '/';
}

export function appHref(route: string): string {
  if (!route.startsWith('/') || route.startsWith('//'))
    throw new Error('An application route must start with a single slash.');
  const url = new URL(route, 'https://claw.invalid');
  return `/app${url.pathname.replace(/\/+$/, '')}${url.search}${url.hash}`;
}

export function legacyAppHref(hash: string, search = ''): string | null {
  if (!hash.startsWith('#/') || hash.startsWith('#//')) return null;
  const url = new URL(appHref(hash.slice(1)), 'https://claw.invalid');
  if (!url.search) url.search = search;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function navigateApp(route: string): void {
  const href = appHref(route);
  if (`${location.pathname}${location.search}${location.hash}` === href) return;
  history.pushState(null, '', href);
  window.dispatchEvent(new Event(APP_NAVIGATION_EVENT));
}

/** Keep ordinary anchors, modified clicks, new tabs, and browser history working. */
export function installAppNavigation(onNavigate: () => void): () => void {
  const click = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor =
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self'))
      return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || !isAppPath(url.pathname) || url.hash) return;
    event.preventDefault();
    navigateApp(`${readAppRoute(url.pathname)}${url.search}`);
  };
  const legacyHash = () => {
    const destination = legacyAppHref(location.hash, location.search);
    if (!destination) return;
    history.replaceState(null, '', destination);
    window.dispatchEvent(new Event(APP_NAVIGATION_EVENT));
  };
  document.addEventListener('click', click);
  window.addEventListener(APP_NAVIGATION_EVENT, onNavigate);
  window.addEventListener('popstate', onNavigate);
  window.addEventListener('hashchange', legacyHash);
  return () => {
    document.removeEventListener('click', click);
    window.removeEventListener(APP_NAVIGATION_EVENT, onNavigate);
    window.removeEventListener('popstate', onNavigate);
    window.removeEventListener('hashchange', legacyHash);
  };
}
