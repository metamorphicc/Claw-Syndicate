import { useEffect, useRef, useState } from 'react';
import type { Action, Economy } from './model';
import { createSeed } from './seed';
export type User = { id: string; name: string };
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response
    .json()
    .catch(() => ({ error: 'The API returned an invalid response.' }));
  if (!response.ok) throw new HttpError(response.status, body.error ?? 'Request failed.');
  return body as T;
}
export function useEconomy() {
  const [state, setState] = useState<Economy>(createSeed);
  const [user, setUser] = useState<User | null>(null);
  const authEpoch = useRef(0),
    loadedUser = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setError] = useState('');
  const ref = useRef(state),
    busy = useRef(false),
    alive = useRef(true);
  const [pendingCommand, setPendingCommand] = useState(false);
  const uncertain = useRef<{ body: string; key: string; revision: number } | null>(null);
  const pendingKey = (id: string) => 'claw:pending:' + id;
  function clearPending() {
    uncertain.current = null;
    setPendingCommand(false);
    if (user)
      try {
        sessionStorage.removeItem(pendingKey(user.id));
      } catch {
        /* A retained key is safe to replay. */
      }
  }
  useEffect(() => {
    if (loadedUser.current === user?.id) return;
    loadedUser.current = user?.id ?? null;
    uncertain.current = null;
    setPendingCommand(false);
    if (!user) return;
    try {
      const raw = sessionStorage.getItem(pendingKey(user.id));
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          typeof saved.body === 'string' &&
          typeof saved.key === 'string' &&
          Number.isSafeInteger(saved.revision)
        ) {
          uncertain.current = saved;
          setPendingCommand(true);
        }
      }
    } catch {
      setError('Pending command storage is unavailable.');
    }
  }, [user?.id]);
  function replace(next: Economy) {
    if (next.revision >= ref.current.revision) {
      ref.current = next;
      setState(next);
    }
  }
  async function refresh() {
    const epoch = authEpoch.current;
    try {
      const [data, me] = await Promise.all([
        api<{ state: Economy }>('/state'),
        api<{ user: User | null }>('/me'),
      ]);
      if (!alive.current) return;
      replace(data.state);
      if (epoch === authEpoch.current) setUser(me.user);
      setError('');
    } catch (error) {
      if (alive.current) setError(`API unavailable. ${(error as Error).message}`);
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    return () => {
      alive.current = false;
      clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, []);
  async function auth(
    mode: 'login' | 'register',
    data: { email: string; password: string; name?: string },
  ) {
    authEpoch.current++;
    const result = await api<{ user: User; state: Economy }>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    replace(result.state);
    authEpoch.current++;
    loadedUser.current = null;
    setUser(result.user);
    setError('');
    return result.user;
  }
  async function logout() {
    authEpoch.current++;
    await api('/auth/logout', { method: 'POST', body: '{}' });
    authEpoch.current++;
    setUser(null);
    uncertain.current = null;
    setPendingCommand(false);
  }
  async function recover() {
    const pending = uncertain.current;
    if (!pending) return;
    if (busy.current) throw new Error('Another command is being saved.');
    busy.current = true;
    try {
      const result = await api<{ state: Economy }>('/actions', {
        method: 'POST',
        headers: { 'Idempotency-Key': pending.key, 'If-Match': String(pending.revision) },
        body: pending.body,
      });
      replace(result.state);
      clearPending();
      return result.state;
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) {
        clearPending();
        if (error.status === 401) setUser(null);
        await refresh();
      } else setPendingCommand(true);
      throw error;
    } finally {
      busy.current = false;
    }
  }
  async function run(action: Action) {
    if (!user) throw new Error('Sign in to continue.');
    if (busy.current) throw new Error('Another command is being saved. Please retry.');
    const body = JSON.stringify(action);
    if (uncertain.current && uncertain.current.body !== body)
      throw new Error(
        'Resolve the previous command using Check pending command before starting another.',
      );
    busy.current = true;
    const pending =
      uncertain.current?.body === body
        ? uncertain.current
        : { body, key: crypto.randomUUID(), revision: ref.current.revision };
    try {
      sessionStorage.setItem(pendingKey(user.id), JSON.stringify(pending));
    } catch {
      busy.current = false;
      throw new Error('Browser session storage is unavailable. Command was not sent.');
    }
    uncertain.current = pending;
    try {
      const result = await api<{ state: Economy }>('/actions', {
        method: 'POST',
        headers: { 'Idempotency-Key': pending.key, 'If-Match': String(pending.revision) },
        body,
      });
      replace(result.state);
      clearPending();
      setError('');
      return result.state;
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) {
        clearPending();
        if (error.status === 401) setUser(null);
        if (error.status === 409) await refresh();
      } else setPendingCommand(true);
      throw error;
    } finally {
      busy.current = false;
    }
  }
  return {
    state,
    user,
    run,
    auth,
    logout,
    refresh,
    loading,
    storageError,
    pendingCommand,
    recover,
  };
}
