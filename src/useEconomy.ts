import { useEffect, useRef, useState } from 'react';
import type { Action, Economy } from './model';
import { STORAGE_KEY, transition } from './model';
import { createSeed } from './seed';
import { readSaved } from './storage';
export function useEconomy() {
  const [initial] = useState(() => {
    try {
      return { state: readSaved() ?? createSeed(), error: '' };
    } catch {
      return {
        state: createSeed(),
        error:
          'Saved data could not be loaded. Open Demo guide to reset it. No saved data has been overwritten.',
      };
    }
  });
  const [state, setState] = useState<Economy>(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const ref = useRef(state);
  const busy = useRef(false);
  const replace = (next: Economy) => {
    ref.current = next;
    setState(next);
  };
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        try {
          const next = readSaved() ?? createSeed();
          replace(next);
          setStorageError('');
        } catch {
          setStorageError(
            'Saved data changed but could not be loaded. Reset the demo to continue.',
          );
        }
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const run = async (action: Action) => {
    if (storageError) throw new Error(storageError);
    if (busy.current) throw new Error('Another action is being saved. Please retry.');
    busy.current = true;
    try {
      const save = () => {
        const latest = readSaved() ?? ref.current;
        const next = transition(latest, action);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          throw new Error('Browser storage is unavailable or full. The action was not applied.');
        }
        replace(next);
        return next;
      };
      return navigator.locks ? await navigator.locks.request(STORAGE_KEY, save) : save();
    } finally {
      busy.current = false;
    }
  };
  const reset = async () => {
    const save = () => {
      const next = createSeed();
      const old = localStorage.getItem(STORAGE_KEY);
      if (old) localStorage.setItem(`${STORAGE_KEY}:backup`, old);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      replace(next);
      setStorageError('');
    };
    if (navigator.locks) await navigator.locks.request(STORAGE_KEY, save);
    else save();
  };
  return { state, run, reset, storageError };
}
