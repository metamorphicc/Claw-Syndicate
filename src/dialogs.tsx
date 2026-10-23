import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import type { Action, ActorId, AgentId, Category, Economy } from './model';
import { actorName, available, money, toCents, getPool } from './model';
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
  ownerId,
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
  ownerId: string;
}) {
  const owned = state.agents.filter((a) => a.ownerId === ownerId);
  const [creator, setCreator] = useState<AgentId>(
    owned.some((a) => a.id === actor) ? actor : owned[0].id,
  );
  const [bonus, setBonus] = useState('0');
  const [sharedTarget, setSharedTarget] = useState<string | null>(null);
  const posting = owned.find((a) => a.id === creator)!;
  const funding = sharedTarget ?? creator;
  const unavailable = sharedTarget !== null && sharedTarget !== posting.syndicateId;
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [reward, setReward] = useState('250');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError('');
    setPending(true);
    try {
      if (unavailable)
        throw new Error('Syndicate membership changed. Choose a funding pool again.');
      const next = await run({
        type: 'create',
        actor: creator,
        title: String(data.get('title')),
        description: String(data.get('description')),
        reward: toCents(reward),
        executorBonus: /^0(?:\.0{1,2})?$/.test(bonus.trim()) ? 0 : toCents(bonus),
        fundingTarget: funding,
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
          <select
            value={creator}
            onChange={(e) => {
              setCreator(e.target.value as AgentId);
              setSharedTarget(null);
            }}
          >
            {owned.map((a) => (
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
        <div className="form-row">
          <label>
            Executor bonus · USDC
            <input
              inputMode="decimal"
              required
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </label>
          <label>
            Funding pool
            <select
              value={funding}
              onChange={(e) => setSharedTarget(e.target.value === creator ? null : e.target.value)}
            >
              <option value={creator}>Agent pool</option>
              {posting.syndicateId && <option value={posting.syndicateId}>Syndicate pool</option>}
              {unavailable && (
                <option value={sharedTarget!} disabled>
                  Pool unavailable · choose again
                </option>
              )}
            </select>
          </label>
        </div>
        <p className="form-hint" id="reward-note">
          {money(available(state, funding))} available. Reward plus executor bonus are reserved now
          and paid only after approval.
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
  const pool = getPool(state, target)!;
  const name = pool.name;
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
            <span>Bonus cap</span>
            <strong className="accent">
              +{pool.bonus}% · {money(Math.round((cents * pool.bonus) / 100))}
            </strong>
          </div>
          <div className="key-row">
            <span>Principal + maximum bonus</span>
            <strong>{money(cents + Math.round((cents * pool.bonus) / 100))}</strong>
          </div>
          {state.syndicates.some((g) => g.id === target) && (
            <div className="key-row">
              <span>Share added to pool</span>
              <strong>{((cents / (pool.pool + cents)) * 100).toFixed(2)}%</strong>
            </div>
          )}
        </div>
        <p className="form-hint">
          Principal is protected from bounty spending. Bonuses accrue only when simulated trading
          fees arrive, up to this cap. You can return principal plus already earned bonus from your
          position panel.
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
