import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/** Pointer motion owns inner layers; scroll and entrance motion keep their own wrappers. */
export function useLandingInteractions(root: RefObject<HTMLDivElement | null>) {
  useGSAP(
    () => {
      const host = root.current!;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting);
            });
          },
          { rootMargin: '80px', threshold: 0 },
        );
        host
          .querySelectorAll('[data-kinetic-scene]')
          .forEach((element) => observer.observe(element));
        const sync = () => {
          host.dataset.motionPaused = String(document.hidden);
        };
        sync();
        document.addEventListener('visibilitychange', sync);
        gsap.from('.cx-char', {
          yPercent: 115,
          rotationX: -75,
          opacity: 0,
          transformOrigin: '50% 100%',
          stagger: 0.022,
          duration: 0.9,
          delay: 0.14,
          ease: 'power4.out',
        });
        return () => {
          observer.disconnect();
          document.removeEventListener('visibilitychange', sync);
          delete host.dataset.motionPaused;
          host
            .querySelectorAll('[data-motion-visible]')
            .forEach((element) => element.removeAttribute('data-motion-visible'));
        };
      });
      media.add(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const dispose: Array<() => void> = [];
          host.querySelectorAll<HTMLElement>('.cx-button, .cx-nav-cta').forEach((button) => {
            const layers = [...button.children];
            const x = layers.map((layer) =>
              gsap.quickTo(layer, 'x', { duration: 0.55, ease: 'power3.out' }),
            );
            const y = layers.map((layer) =>
              gsap.quickTo(layer, 'y', { duration: 0.55, ease: 'power3.out' }),
            );
            const move = (event: PointerEvent) => {
              const box = button.getBoundingClientRect();
              const dx = (event.clientX - box.left - box.width / 2) * 0.13;
              const dy = (event.clientY - box.top - box.height / 2) * 0.23;
              x.forEach((set) => set(dx));
              y.forEach((set) => set(dy));
            };
            const leave = () => {
              x.forEach((set) => set(0));
              y.forEach((set) => set(0));
            };
            button.addEventListener('pointermove', move);
            button.addEventListener('pointerleave', leave);
            dispose.push(() => {
              button.removeEventListener('pointermove', move);
              button.removeEventListener('pointerleave', leave);
            });
          });
          const sculpture = host.querySelector<HTMLElement>('.cx-sculpture')!;
          const depth = host.querySelector('.cx-sculpture-depth')!;
          const turnX = gsap.quickTo(depth, 'rotationX', { duration: 1.1, ease: 'power3.out' });
          const turnY = gsap.quickTo(depth, 'rotationY', { duration: 1.1, ease: 'power3.out' });
          const shiftX = gsap.quickTo(depth, 'x', { duration: 1.1, ease: 'power3.out' });
          const moveScene = (event: PointerEvent) => {
            const box = sculpture.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width - 0.5;
            const y = (event.clientY - box.top) / box.height - 0.5;
            turnX(-y * 13);
            turnY(x * 17);
            shiftX(x * 22);
          };
          const leaveScene = () => {
            turnX(0);
            turnY(0);
            shiftX(0);
          };
          sculpture.addEventListener('pointermove', moveScene);
          sculpture.addEventListener('pointerleave', leaveScene);
          dispose.push(() => {
            sculpture.removeEventListener('pointermove', moveScene);
            sculpture.removeEventListener('pointerleave', leaveScene);
          });
          host.querySelectorAll<HTMLElement>('.cx-agent').forEach((card) => {
            const art = card.querySelector('.cx-agent-art')!;
            const rx = gsap.quickTo(art, 'rotationX', { duration: 0.7, ease: 'power3.out' });
            const ry = gsap.quickTo(art, 'rotationY', { duration: 0.7, ease: 'power3.out' });
            const move = (event: PointerEvent) => {
              const box = card.getBoundingClientRect();
              rx((0.5 - (event.clientY - box.top) / box.height) * 17);
              ry(((event.clientX - box.left) / box.width - 0.5) * 22);
            };
            const leave = () => {
              rx(0);
              ry(0);
            };
            card.addEventListener('pointermove', move);
            card.addEventListener('pointerleave', leave);
            dispose.push(() => {
              card.removeEventListener('pointermove', move);
              card.removeEventListener('pointerleave', leave);
            });
          });
          return () => dispose.forEach((fn) => fn());
        },
      );
      return () => media.revert();
    },
    { scope: root },
  );
}
