import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { ClawScene } from './claw-scene';

export default function ClawModel() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ClawScene | null>(null);
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const initiallyPaused = useRef(paused);
  initiallyPaused.current = paused;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import('./claw-scene')
      .then((module) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = module.createClawScene(
            host.current,
            initiallyPaused.current,
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
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      if (preference.matches) setPaused(true);
    };
    preference.addEventListener('change', changed);
    return () => preference.removeEventListener('change', changed);
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
        {ready && !failed && (
          <button
            className="model-motion-button"
            aria-label={paused ? 'Play 3D animation' : 'Pause 3D animation'}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        )}
      </div>
      <figcaption className="model-caption">
        <span>THREE INDEPENDENT MINDS.</span>
        <span>ONE SHARED CORE.</span>
      </figcaption>
    </figure>
  );
}
