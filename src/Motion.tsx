import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { APP_NAVIGATION_EVENT } from './navigation';

const surfaces = '.work-card, .roster-row, .bounty-row, .agent-card, .collective-band';
const entrances =
  '[data-reveal], .work-column, .exchange-section-heading, .agent-roster, .collective-band, .work-card, .roster-row, .bounty-row, .agent-card';

/** One observer and one pointer delegate for the whole app, including newly mounted routes. */
export function MotionShell({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = host.current!;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 640px)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const seen = new WeakSet<Element>();
    let active: HTMLElement | null = null;
    let frame = 0;
    let routeFrame = 0;
    let viewAnimation: Animation | undefined;
    let lastX = 0;
    let lastY = 0;
    const resetSurface = () => {
      if (!active) return;
      active.removeAttribute('data-pointer-active');
      for (const key of ['--pointer-x', '--pointer-y', '--tilt-x', '--tilt-y'])
        active.style.removeProperty(key);
      active = null;
    };
    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (element.matches('[data-motion-scene]')) {
            element.dataset.sceneVisible = String(entry.isIntersecting);
          } else if (entry.isIntersecting) {
            element.dataset.revealed = 'true';
            intersection.unobserve(element);
          }
        }
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.06 },
    );
    const scan = () => {
      root.querySelectorAll<HTMLElement>(`${entrances}, [data-motion-scene]`).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (element.matches('[data-motion-scene]')) {
          intersection.observe(element);
        } else if (!preference.matches && desktop.matches) {
          if (element.matches(surfaces) && element.parentElement) {
            const index = [...element.parentElement.children].indexOf(element);
            element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`);
          }
          element.dataset.revealed = 'false';
          intersection.observe(element);
        }
      });
    };
    const syncPreference = () => {
      root.dataset.motion = preference.matches ? 'reduced' : 'full';
      if (preference.matches || !desktop.matches) {
        root.querySelectorAll<HTMLElement>('[data-revealed="false"]').forEach((element) => {
          element.dataset.revealed = 'true';
          intersection.unobserve(element);
        });
        resetSurface();
        viewAnimation?.cancel();
      }
    };
    const syncVisibility = () => {
      root.dataset.motionPaused = String(document.hidden);
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || !pointer.matches || event.pointerType === 'touch') return;
      const candidate =
        event.target instanceof Element ? event.target.closest<HTMLElement>(surfaces) : null;
      if (candidate !== active) {
        resetSurface();
        active = candidate;
      }
      if (!active) return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!active) return;
        const box = active.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (lastX - box.left) / Math.max(box.width, 1)));
        const y = Math.max(0, Math.min(1, (lastY - box.top) / Math.max(box.height, 1)));
        active.style.setProperty('--pointer-x', `${x * 100}%`);
        active.style.setProperty('--pointer-y', `${y * 100}%`);
        active.style.setProperty('--tilt-x', `${(0.5 - y) * 8}deg`);
        active.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
        active.dataset.pointerActive = 'true';
      });
    };
    const route = () => {
      resetSurface();
      if (routeFrame) cancelAnimationFrame(routeFrame);
      routeFrame = requestAnimationFrame(() => {
        routeFrame = 0;
        if (preference.matches) return;
        viewAnimation?.cancel();
        viewAnimation = root.querySelector('.main-content')?.animate(
          [
            { opacity: 0, transform: 'translateY(24px) scale(0.995)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        );
      });
    };
    // Observe insertions only: pointer CSS changes never retrigger this observer.
    const mutations = new MutationObserver(scan);
    syncPreference();
    syncVisibility();
    scan();
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener('change', syncPreference);
    desktop.addEventListener('change', syncPreference);
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', resetSurface);
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener(APP_NAVIGATION_EVENT, route);
    window.addEventListener('popstate', route);
    return () => {
      intersection.disconnect();
      mutations.disconnect();
      preference.removeEventListener('change', syncPreference);
      desktop.removeEventListener('change', syncPreference);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', resetSurface);
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener(APP_NAVIGATION_EVENT, route);
      window.removeEventListener('popstate', route);
      if (frame) cancelAnimationFrame(frame);
      if (routeFrame) cancelAnimationFrame(routeFrame);
      viewAnimation?.cancel();
      resetSurface();
    };
  }, []);
  return (
    <div ref={host} className="motion-root">
      {children}
    </div>
  );
}
