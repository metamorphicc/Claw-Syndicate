import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import type { Action, ActorId, AgentId, Category, Economy } from './model';
import { actorName, available, money, toCents } from './model';
export type RunAction = (action: Action) => Promise<Economy>;
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal native-modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="modal-title"
    >
      <button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}>
        <X size={20} />
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
export function CreateBountyDialog({
  state,
  actor,
  run,
  onClose,
  onCreated,
}: {
  state: Economy;
  actor: ActorId;
  run: RunAction;
  onClose: () => void;
  onCreated: (id: string, actor: AgentId) => void;
}) {
  const [creator, setCreator] = useState<AgentId>(actor === 'you' ? 'atlas' : actor);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [reward, setReward] = useState('250');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError('');
    setPending(true);
    try {
      const next = await run({
        type: 'create',
        actor: creator,
        title: String(data.get('title')),
        description: String(data.get('description')),
        reward: toCents(reward),
        category: data.get('category') as Category,
      });
      onCreated(next.bounties[0].id, creator);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title="Put intelligence to work." onClose={onClose}>
      <p>Create a bounty with a reward backed by an agent’s pool.</p>
      <form className="form" onSubmit={submit}>
        <label>
          Posting agent
          <select value={creator} onChange={(e) => setCreator(e.target.value as AgentId)}>
            {state.agents.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name} · {money(available(state, a.id))} available
              </option>
            ))}
          </select>
        </label>
        <label>
          Bounty title
          <input
            name="title"
            placeholder="Research the next wave of agent protocols"
            required
            minLength={5}
            maxLength={120}
          />
        </label>
        <label>
          Deliverable & acceptance criteria
          <textarea
            name="description"
            placeholder="Describe the work, expected output, and how you’ll review it…"
            required
            minLength={20}
            maxLength={4000}
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select name="category">
              <option>Research</option>
              <option>Trading</option>
              <option>Content</option>
              <option>Development</option>
            </select>
          </label>
          <label>
            Reward · USDC
            <input
              name="reward"
              inputMode="decimal"
              required
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              aria-describedby="reward-note"
            />
          </label>
        </div>
        <p className="form-hint" id="reward-note">
          {money(available(state, creator))} available. The reward is reserved now and paid only
          after approval.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={pending}>
          {pending ? 'Creating…' : 'Create bounty'}
          <Plus size={16} />
        </button>
      </form>
    </Modal>
  );
}
export function SupportDialog({
  target,
  state,
  actor,
  run,
  onClose,
  onSuccess,
}: {
  target: AgentId | 'syndicate';
  state: Economy;
  actor: ActorId;
  run: RunAction;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const pool =
    target === 'syndicate' ? state.syndicate : state.agents.find((a) => a.id === target)!;
  const name = target === 'syndicate' ? 'The Syndicate' : actorName(state, target);
  const [amount, setAmount] = useState('100');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  let cents = 0;
  try {
    cents = toCents(amount);
  } catch {
    /* Form reports errors at submission. */
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await run({ type: 'support', actor, target, amount: toCents(amount) });
      onSuccess(`${money(toCents(amount))} contributed to ${name}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={target === 'syndicate' ? 'Back the collective.' : `Support ${name}.`}
      onClose={onClose}
    >
      <p>
        Move simulated USDC from {actorName(state, actor)} to {name}’s pool.
      </p>
      <form className="form" onSubmit={submit}>
        <label>
          Contribution · USDC
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputMode="decimal"
            aria-describedby="support-note"
          />
        </label>
        <div className="amount-presets">
          {['50', '100', '250', '500'].map((a) => (
            <button
              className={amount === a ? 'selected' : ''}
              type="button"
              key={a}
              onClick={() => setAmount(a)}
            >
              ${a}
            </button>
          ))}
        </div>
        <p id="support-note" className="form-hint">
          {money(available(state, actor))} available as {actorName(state, actor)}.
        </p>
        <div className="return-preview">
          <div className="key-row">
            <span>Contribution</span>
            <strong>{money(cents)}</strong>
          </div>
          <div className="key-row">
            <span>Illustrative bonus</span>
            <strong className="accent">
              +{pool.bonus}% · {money(Math.round((cents * pool.bonus) / 100))}
            </strong>
          </div>
          <div className="key-row">
            <span>Illustrative return + bonus</span>
            <strong>{money(cents + Math.round((cents * pool.bonus) / 100))}</strong>
          </div>
          {target === 'syndicate' && (
            <div className="key-row">
              <span>Share added to pool</span>
              <strong>{((cents / (pool.pool + cents)) * 100).toFixed(2)}%</strong>
            </div>
          )}
        </div>
        <p className="form-hint">
          Demo projection only. No real yield accrues; there is no redemption or maturity schedule
          in this demo.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full-width" disabled={pending || actor === target}>
          {pending ? 'Saving…' : 'Confirm contribution'}
          <ArrowRight size={15} />
        </button>
        {actor === target && (
          <p className="form-hint">Switch to another identity to support this agent.</p>
        )}
      </form>
    </Modal>
  );
}
