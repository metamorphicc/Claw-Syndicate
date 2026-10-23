import { useState, type FormEvent } from 'react';
import type { Action, Economy, Category } from './model';
import {
  actorName,
  available,
  bonusCap,
  getPool,
  money,
  poolName,
  protectedCapital,
  reserved,
  toCents,
} from './model';
import { Modal, type RunAction } from './dialogs';
import { MemberStack, SectionTitle } from './components';
import type { User } from './useEconomy';
export function EntityDialog({
  kind,
  state,
  user,
  run,
  onClose,
  onCreated,
}: {
  kind: 'agent' | 'syndicate';
  state: Economy;
  user: User;
  run: RunAction;
  onClose: () => void;
  onCreated: (route: string) => void;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const eligible = state.agents.filter((a) => a.ownerId === user.id && !a.syndicateId);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const common = {
        actor: user.id,
        name: String(d.get('name')),
        token: String(d.get('token')),
        bonus: Number(d.get('bonus')),
        yieldShareBps: Number(d.get('yieldShare')) * 100,
      };
      const action: Action =
        kind === 'agent'
          ? {
              ...common,
              type: 'createAgent',
              role: String(d.get('role')),
              bio: String(d.get('description')),
              category: d.get('category') as Category,
              feeShareBps: Number(d.get('feeShare')) * 100,
            }
          : {
              ...common,
              type: 'createSyndicate',
              description: String(d.get('description')),
              members: d.getAll('members').map(String),
            };
      const next = await run(action);
      onCreated(
        kind === 'agent'
          ? `/agents/${next.agents.at(-1)!.id}`
          : `/syndicate/${next.syndicates.at(-1)!.id}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={kind === 'agent' ? 'An agent of your own.' : 'Build your collective.'}
      onClose={onClose}
    >
      <p>
        {kind === 'agent'
          ? 'Choose its specialty and simulated token. New agents start with an empty pool.'
          : 'Start with at least two of your independent agents. Invite other owners after creation.'}
      </p>
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <label>
            Name
            <input name="name" required minLength={2} maxLength={40} />
          </label>
          <label>
            Token symbol
            <input
              name="token"
              required
              pattern="\$?[A-Za-z][A-Za-z0-9]{1,9}"
              placeholder="$NOVA"
              maxLength={11}
            />
          </label>
        </div>
        {kind === 'agent' && (
          <div className="form-row">
            <label>
              Role
              <input name="role" required minLength={3} maxLength={80} />
            </label>
            <label>
              Specialty
              <select name="category">
                {['Research', 'Trading', 'Content', 'Development'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          Description
          <textarea name="description" required minLength={20} maxLength={2000} />
        </label>
        {kind === 'syndicate' && (
          <fieldset className="member-picker">
            <legend>Founding members</legend>
            {eligible.length < 2 && (
              <p className="form-hint">Create at least two independent agents first.</p>
            )}
            {eligible.map((a) => (
              <label key={a.id}>
                <input type="checkbox" name="members" value={a.id} />
                {a.name} · {a.role}
              </label>
            ))}
          </fieldset>
        )}
        <div className="form-row">
          <label>
            Backer bonus cap · %
            <input
              name="bonus"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={10}
              required
            />
          </label>
          <label>
            Fee income to backers · %
            <input
              name="yieldShare"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={25}
              required
            />
          </label>
        </div>
        {kind === 'agent' && (
          <label>
            Agent’s share of gross trading fees · %
            <input
              name="feeShare"
              type="number"
              min={65}
              max={75}
              step={1}
              defaultValue={70}
              required
            />
          </label>
        )}
        <p className="form-hint">
          The bonus is a cap per contribution. It accrues only from received simulated fees. A token
          symbol is a local record; no blockchain token is issued.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={busy || (kind === 'syndicate' && eligible.length < 2)}
        >
          {busy ? 'Creating…' : `Create ${kind}`}
        </button>
      </form>
    </Modal>
  );
}
export function Positions({
  state,
  actor,
  target,
  run,
  notify,
}: {
  state: Economy;
  actor: string;
  target: string;
  run: RunAction;
  notify: (s: string) => void;
}) {
  const [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState('');
  const positions = state.contributions.filter((c) => c.actor === actor && c.target === target);
  const active = positions.filter((c) => !c.claimedAt),
    total = active.reduce((n, c) => n + c.amount, 0),
    earned = active.reduce((n, c) => n + c.accruedBonus, 0),
    cap = active.reduce((n, c) => n + bonusCap(c), 0);
  async function redeem(id: string) {
    setPending(id);
    setError('');
    try {
      await run({ type: 'redeem', actor, contributionId: id });
      notify('Principal and earned bonus returned to your balance.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="detail-panel">
      <div className="position-panel">
        <div>
          <span>Protected principal</span>
          <strong>{money(total)}</strong>
        </div>
        <div>
          <span>Earned bonus / cap</span>
          <strong>
            {money(earned)} <small>/ {money(cap)}</small>
          </strong>
        </div>
        <div>
          <span>Current capital share</span>
          <strong>
            {getPool(state, target)!.pool
              ? ((total / getPool(state, target)!.pool) * 100).toFixed(2)
              : '0.00'}
            %
          </strong>
        </div>
        <p>
          Return now: {money(total + earned)}. Unfunded bonus is not included. Capital share
          compares active principal with the current pool balance.
        </p>
      </div>
      {!positions.length && (
        <p className="form-hint">Your first contribution starts your position.</p>
      )}
      {positions.map((c) => (
        <div className="key-row position-row" key={c.id}>
          <span>
            {money(c.amount)} principal + {money(c.accruedBonus)} earned{' '}
            <small>· {new Date(c.at).toLocaleDateString()}</small>
          </span>
          {c.claimedAt ? (
            <small>Returned</small>
          ) : (
            <button className="button" disabled={!!pending} onClick={() => redeem(c.id)}>
              {pending === c.id ? 'Returning…' : `Return ${money(c.amount + c.accruedBonus)}`}
            </button>
          )}
        </div>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function EconomyPage({
  state,
  actor,
  user,
  run,
  notify,
}: {
  state: Economy;
  actor: string;
  user: User | null;
  run: RunAction;
  notify: (s: string) => void;
}) {
  const agents = state.agents.filter(
    (a) => a.ownerId === user?.id && (actor === user?.id || a.id === actor),
  );
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function fees(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setError('');
    setBusy(true);
    try {
      await run({
        type: 'fees',
        actor,
        agentId: String(d.get('agent')),
        gross: toCents(String(d.get('gross'))),
      });
      notify('Simulated fees credited and backer bonuses allocated.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading-copy">
        <div className="eyebrow">CAPITAL IN MOTION</div>
        <h1>Every dollar has a trail.</h1>
        <p>Fees fund work and earned returns. All amounts below are simulated USDC.</p>
      </div>
      <div className="profile-grid spaced">
        <section className="detail-panel">
          <h2>Record trading fees</h2>
          {agents.length ? (
            <form className="form" onSubmit={fees}>
              <label>
                Source agent
                <select name="agent">
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.feeShareBps / 100}% to {poolName(state, a.syndicateId ?? a.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Gross simulated fees · USDC
                <input name="gross" required inputMode="decimal" defaultValue="1000" />
              </label>
              <p className="form-hint">
                The source agent keeps 65–75%; the remainder goes to the platform account. Member
                fees flow into the shared syndicate pool. Only existing fee income can fund bonuses.
              </p>
              <button className="button primary" disabled={busy}>
                {busy ? 'Recording…' : 'Record simulated fees'}
              </button>
            </form>
          ) : (
            <p className="form-hint">Sign in and create an agent to simulate its trading fees.</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="detail-panel">
          <h2>Allocation summary</h2>
          <div className="key-row">
            <span>Total gross fees</span>
            <strong>{money(state.fees.reduce((n, f) => n + f.gross, 0))}</strong>
          </div>
          <div className="key-row">
            <span>Platform fees</span>
            <strong>{money(state.platformBalance)}</strong>
          </div>
          <div className="key-row">
            <span>Bonuses earned by backers</span>
            <strong>{money(state.fees.reduce((n, f) => n + f.yieldAccrued, 0))}</strong>
          </div>
          <p className="form-hint">
            Contributed principal and earned bonuses remain protected. Bounties reserve their reward
            and executor bonus before work starts.
          </p>
        </section>
      </div>
      <section className="spaced">
        <SectionTitle title="Pool obligations" />
        <div className="detail-panel">
          {[...state.agents, ...state.syndicates].map((p) => (
            <div className="capital-row" key={p.id}>
              <a
                href={`#/${state.agents.some((a) => a.id === p.id) ? 'agents' : 'syndicate'}/${p.id}`}
              >
                {p.name} <span className="token">{p.token}</span>
              </a>
              <span>
                Balance <strong>{money(p.pool)}</strong>
              </span>
              <span>
                Protected <strong>{money(protectedCapital(state, p.id))}</strong>
              </span>
              <span>
                Reserved <strong>{money(reserved(state, p.id))}</strong>
              </span>
              <span>
                Spendable <strong>{money(available(state, p.id))}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="spaced">
        <SectionTitle title="Trading fee receipts" />
        <div className="detail-panel">
          {!state.fees.length && <p className="form-hint">No fees recorded yet.</p>}
          {state.fees.slice(0, 50).map((f) => (
            <div className="capital-row" key={f.id}>
              <span>
                {actorName(state, f.agentId)} → {poolName(state, f.target)}
              </span>
              <span>
                Gross <strong>{money(f.gross)}</strong>
              </span>
              <span>
                Pool <strong>{money(f.credited)}</strong>
              </span>
              <span>
                Platform <strong>{money(f.platform)}</strong>
              </span>
              <span>
                Backers <strong>{money(f.yieldAccrued)}</strong>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="spaced">
        <SectionTitle title="Transaction journal" />
        <div className="detail-panel journal-list">
          {[...state.journal]
            .reverse()
            .slice(0, 100)
            .map((tx) => (
              <details key={tx.id}>
                <summary>
                  {tx.memo}
                  <small>{new Date(tx.at).toLocaleString()}</small>
                </summary>
                {tx.entries.length ? (
                  tx.entries.map((e, i) => (
                    <div className="key-row" key={i}>
                      <code>{e.account}</code>
                      <strong>
                        {e.delta >= 0 ? '+' : ''}
                        {money(e.delta)}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="form-hint">No balance change.</p>
                )}
              </details>
            ))}
        </div>
      </section>
    </>
  );
}
export function SyndicatesPage({
  state,
  user,
  actor,
  run,
  create,
  support,
  notify,
  selected,
}: {
  state: Economy;
  user: User | null;
  actor: string;
  run: RunAction;
  create: () => void;
  support: (id: string) => void;
  notify: (s: string) => void;
  selected?: string;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function act(action: Action) {
    setBusy(true);
    setError('');
    try {
      await run(action);
      notify('Syndicate membership updated.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const ownedPending = state.invitations.filter(
    (i) =>
      i.status === 'pending' &&
      state.agents.some((a) => a.id === i.agentId && a.ownerId === user?.id),
  );
  const groups = selected ? state.syndicates.filter((g) => g.id === selected) : state.syndicates;
  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <div className="eyebrow">COLLECTIVE CAPITAL</div>
          <h1>Independent minds. Shared upside.</h1>
          <p>Member fees flow into one pool. Existing personal capital stays with each agent.</p>
        </div>
        <button className="button primary" onClick={create}>
          Create syndicate
        </button>
      </div>
      {ownedPending.map((i) => (
        <div className="detail-panel spaced" key={i.id}>
          <p>
            {actorName(state, i.agentId)} is invited to {poolName(state, i.syndicateId)}.
          </p>
          <div className="form-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                act({ type: 'respondInvite', actor: user!.id, invitationId: i.id, accept: true })
              }
            >
              Accept invitation
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                act({ type: 'respondInvite', actor: user!.id, invitationId: i.id, accept: false })
              }
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {selected && (
        <a className="back-link" href="#/syndicate">
          ← All syndicates
        </a>
      )}
      {!groups.length && <div className="empty">Syndicate not found.</div>}
      {groups.map((g) => (
        <section className="spaced detail-panel" key={g.id}>
          <div className="syndicate-heading">
            <div>
              <MemberStack ids={g.members} />
              <h2>
                <a href={`#/syndicate/${g.id}`}>{g.name}</a>{' '}
                <span className="token">{g.token}</span>
              </h2>
              <p>{g.description}</p>
            </div>
            <div>
              <span className="eyebrow">SHARED POOL</span>
              <strong className="big-value">{money(g.pool)}</strong>
              <button className="button primary" onClick={() => support(g.id)}>
                Contribute to pool
              </button>
            </div>
          </div>
          <div className="key-row">
            <span>Spendable after obligations</span>
            <strong>{money(available(state, g.id))}</strong>
          </div>
          <div className="key-row">
            <span>Backer bonus cap / fee income allocated</span>
            <strong>
              {g.bonus}% / {g.yieldShareBps / 100}%
            </strong>
          </div>
          <div className="spaced">
            {g.members.map((id) => (
              <div className="key-row" key={id}>
                <a href={`#/agents/${id}`}>{actorName(state, id)}</a>
                {g.ownerId === user?.id && (
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() =>
                      act({ type: 'removeMember', actor: user!.id, syndicateId: g.id, agentId: id })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {g.ownerId === user?.id && (
            <form
              className="form spaced"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                void act({
                  type: 'invite',
                  actor: user!.id,
                  syndicateId: g.id,
                  agentId: String(d.get('agent')),
                });
              }}
            >
              <label>
                Invite an independent agent
                <select name="agent" required defaultValue="">
                  <option value="" disabled>
                    Select agent…
                  </option>
                  {state.agents
                    .filter(
                      (a) =>
                        !a.syndicateId &&
                        !state.invitations.some(
                          (i) =>
                            i.agentId === a.id && i.syndicateId === g.id && i.status === 'pending',
                        ),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </label>
              <button className="button" disabled={busy}>
                Send invitation
              </button>
              <p className="form-hint">
                The agent owner must accept. Removing a member changes future fee routing; existing
                positions stay in this pool.
              </p>
            </form>
          )}
          <section className="spaced">
            <SectionTitle title="Your support position" />
            <Positions state={state} actor={actor} target={g.id} run={run} notify={notify} />
          </section>
        </section>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
