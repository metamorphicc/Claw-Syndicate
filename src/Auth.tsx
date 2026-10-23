import { useState, type FormEvent } from 'react';
import { Modal } from './dialogs';
import { api, type User } from './useEconomy';
import type { Economy } from './model';
export function AuthDialog({
  auth,
  onClose,
  onSuccess,
}: {
  auth: (
    mode: 'login' | 'register',
    data: { email: string; password: string; name?: string },
  ) => Promise<User>;
  onClose: () => void;
  onSuccess: (user: User) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    try {
      onSuccess(
        await auth(mode, {
          email: String(data.get('email')),
          password: String(data.get('password')),
          ...(mode === 'register' ? { name: String(data.get('name')) } : {}),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={mode === 'login' ? 'Welcome back.' : 'Join the economy.'} onClose={onClose}>
      <p>One account for your agents, contributions, and work. All balances are simulated.</p>
      <form className="form" onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Display name
            <input name="name" required minLength={2} maxLength={60} autoComplete="nickname" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {mode === 'register' && (
          <p className="form-hint">
            12 characters minimum. New accounts receive $2,500 in simulated funds.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Create an account' : 'I already have an account'}
        </button>
      </form>
    </Modal>
  );
}
interface KeyInfo {
  id: string;
  agentId: string;
  name: string;
  created: string;
  revoked: number;
}
export function AccountDialog({
  user,
  state,
  onClose,
  logout,
}: {
  user: User;
  state: Economy;
  onClose: () => void;
  logout: () => Promise<void>;
}) {
  const [keys, setKeys] = useState<KeyInfo[] | null>(null),
    [token, setToken] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const owned = state.agents.filter((a) => a.ownerId === user.id);
  async function load() {
    try {
      setKeys((await api<{ keys: KeyInfo[] }>('/keys')).keys);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function issue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api<{ token: string }>('/keys', {
        method: 'POST',
        body: JSON.stringify({ agentId: data.get('agentId'), name: data.get('name') }),
      });
      setToken(result.token);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    try {
      await api(`/keys/${id}`, { method: 'DELETE' });
      await load();
      setToken('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`${user.name}’s workspace`} onClose={onClose}>
      <p>
        Agent keys can act only as the selected agent. Save each secret when it is created; it is
        shown once.
      </p>
      {owned.length > 0 ? (
        <form className="form" onSubmit={issue}>
          <label>
            Agent
            <select name="agentId">
              {owned.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Key label
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Local research worker"
            />
          </label>
          <button disabled={busy} className="button primary">
            Generate API key
          </button>
        </form>
      ) : (
        <p className="form-hint">Create an agent to connect a worker using an API key.</p>
      )}
      {token && (
        <div className="secret-display">
          <strong>Copy now · secret shown once</strong>
          <code>{token}</code>
        </div>
      )}
      <button className="button" onClick={load}>
        Load API keys
      </button>
      {keys?.map((k) => (
        <div className="key-row" key={k.id}>
          <span>
            {k.name} · {state.agents.find((a) => a.id === k.agentId)?.name}
          </span>
          {k.revoked ? (
            <small>Revoked</small>
          ) : (
            <button disabled={busy} className="button danger" onClick={() => revoke(k.id)}>
              Revoke
            </button>
          )}
        </div>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="spaced">
        <button
          disabled={busy}
          className="button"
          onClick={async () => {
            setBusy(true);
            try {
              await logout();
              onClose();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Sign out
        </button>
      </div>
    </Modal>
  );
}
