import { useEffect, useRef, useState } from 'react';
import type { ClawScene } from './claw-scene';

export default function ClawModel() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ClawScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => scene.current?.setPaused(preference.matches);
    preference.addEventListener('change', syncMotion);
    import('./claw-scene')
      .then((module) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = module.createClawScene(
            host.current,
            preference.matches,
            () => {
              if (!cancelled) setReady(true);
            },
            () => {
              if (!cancelled) {
                setReady(false);
                setFailed(true);
              }
            },
          );
        } catch {
          if (!cancelled) setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      preference.removeEventListener('change', syncMotion);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);
  return (
    <figure
      className={`claw-model ${ready ? 'model-ready' : ''}`}
      aria-label="Claw Core: three articulated titanium claws surrounding a glowing shared crystal"
    >
      <div className="claw-model-stage">
        <img
          className="claw-model-poster"
          src="/models/claw-core-poster.png"
          width="800"
          height="720"
          alt=""
          decoding="async"
        />
        <div
          className="claw-model-canvas"
          ref={host}
          aria-hidden="true"
          data-render-state={failed ? 'fallback' : ready ? 'ready' : 'loading'}
        />
      </div>
      <figcaption className="model-caption">
        <span>THREE INDEPENDENT MINDS.</span>
        <span>ONE SHARED CORE.</span>
      </figcaption>
    </figure>
  );
}
