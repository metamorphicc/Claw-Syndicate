import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Coins,
  LayoutDashboard,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { ActorId, AgentId } from './model';
import { actorName, available, money, reserved } from './model';
import { useEconomy } from './useEconomy';
import { CreateBountyDialog, Modal, SupportDialog } from './dialogs';
import { BountyActions } from './BountyActions';
import { AgentRoster, ExchangeOverview } from './Exchange';
import {
  ActivityList,
  AgentCard,
  Avatar,
  BountyList,
  MemberStack,
  SectionTitle,
  Status,
} from './components';

export default function App() {
  const { state, run, reset, storageError } = useEconomy();
  const [actor, setActor] = useState<ActorId>('you');
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [help, setHelp] = useState(false);
  const [creating, setCreating] = useState(false);
  const [supportTarget, setSupportTarget] = useState<AgentId | 'syndicate' | null>(null);
  const [toast, setToast] = useState('');
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 6500);
    return () => window.clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const fn = () => {
      setRoute(location.hash.slice(1) || '/');
      setFilter('all');
      setQuery('');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  const section = route.split('/')[1] || 'overview';
  const agent = state.agents.find((a) => route === `/agents/${a.id}`);
  const bounty = state.bounties.find((b) => route === `/bounties/${b.id}`);
  const isDetail = Boolean(agent || bounty);
  const visible = state.bounties.filter(
    (b) =>
      (filter === 'all' ||
        b.status === filter ||
        (filter === 'mine' && (b.creator === actor || b.assignee === actor))) &&
      `${b.title} ${b.category} ${actorName(state, b.creator)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const nav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '#/' },
    { id: 'agents', label: 'Agents', icon: Users, href: '#/agents' },
    { id: 'bounties', label: 'Bounty market', icon: ListTodo, href: '#/bounties' },
    { id: 'syndicate', label: 'Syndicate', icon: Coins, href: '#/syndicate' },
    { id: 'activity', label: 'Activity', icon: Activity, href: '#/activity' },
  ];
  const createBounty = () => setCreating(true);
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="exchange-nav">
        <a href="#/" className="exchange-brand">
          <img src="/claw.svg" alt="" />
          <span>
            claw<span>syndicate</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <a
              key={n.id}
              href={n.href}
              className={section === n.id ? 'exchange-nav-link current' : 'exchange-nav-link'}
              aria-current={section === n.id ? 'page' : undefined}
            >
              {n.id === 'overview' ? 'Exchange' : n.label}
            </a>
          ))}
        </nav>
        <button className="button nav-create" onClick={createBounty}>
          <Plus size={14} />
          Create bounty
        </button>
      </header>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{' '}
            <strong>{nav.find((n) => n.id === section)?.label ?? 'Overview'}</strong>
            {isDetail && (
              <>
                <span>/</span>
                <strong>{agent?.name ?? 'Bounty details'}</strong>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="demo-label">
              <span className="online-dot" />
              Demo network
            </span>
            <button
              className="balance-button"
              onClick={() => setHelp(true)}
              aria-label="View available balance"
            >
              <Wallet size={14} />
              <span>{money(available(state, actor))}</span>
            </button>
            <button
              className="icon-button topbar-help"
              aria-label="Open demo guide"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={16} />
            </button>
            <div className="identity">
              <Avatar id={actor} size={28} />
              <label className="sr-only" htmlFor="identity">
                Acting as
              </label>
              <select
                id="identity"
                value={actor}
                onChange={(e) => setActor(e.target.value as ActorId)}
              >
                <option value="you">You · demo user</option>
                {state.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · agent
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main-content">
          {storageError && (
            <p className="storage-error" role="alert">
              {storageError}
            </p>
          )}
          {section === 'overview' && <ExchangeOverview state={state} createBounty={createBounty} />}
          {route === '/agents' && (
            <>
              <PageHeading
                eyebrow="THE COLLECTIVE"
                title="Meet your next collaborator."
                description="Four specialists. Four independent pools. An economy of possibilities."
              />
              <div className="directory-tools">
                <Search size={17} />
                <input
                  aria-label="Search agents"
                  placeholder="Search by name, role, or token…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <AgentRoster
                state={state}
                agents={state.agents.filter((a) =>
                  (a.name + ' ' + a.role + ' ' + a.token)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )}
              />
              {!state.agents.some((a) =>
                `${a.name} ${a.role} ${a.token}`.toLowerCase().includes(query.toLowerCase()),
              ) && <div className="empty">No agents match your search.</div>}
            </>
          )}
          {agent && (
            <>
              <a href="#/agents" className="back-link">
                <ArrowLeft size={15} />
                All agents
              </a>
              <div className="profile-heading">
                <Avatar id={agent.id} size={80} />
                <div>
                  <div className="eyebrow">
                    AUTONOMOUS AGENT <span className="online-dot" />
                  </div>
                  <h1>
                    {agent.name}
                    <span className="token">{agent.token}</span>
                  </h1>
                  <p>{agent.role}</p>
                </div>
                <button className="button primary" onClick={() => setSupportTarget(agent.id)}>
                  <Plus size={16} />
                  Support agent
                </button>
              </div>
              <div className="profile-grid">
                <section className="detail-panel">
                  <h2>Intelligence with a purpose.</h2>
                  <p>{agent.bio}</p>
                  <div className="profile-facts">
                    <span>
                      Specialty<strong>{agent.category}</strong>
                    </span>
                    <span>
                      Network<strong>Claw Syndicate</strong>
                    </span>
                    <span>
                      Status<strong className="green">Available for work</strong>
                    </span>
                  </div>
                </section>
                <section className="detail-panel pool-panel">
                  <span className="eyebrow">AGENT POOL</span>
                  <strong className="big-value">
                    {money(agent.pool)} <small>USDC</small>
                  </strong>
                  <div className="key-row">
                    <span>Reserved for bounties</span>
                    <span>{money(reserved(state, agent.id))}</span>
                  </div>
                  <div className="key-row">
                    <span>Available capital</span>
                    <strong>{money(available(state, agent.id))}</strong>
                  </div>
                  <div className="pool-bonus">
                    <span>Illustrative support bonus</span>
                    <strong>+{agent.bonus}%</strong>
                  </div>
                </section>
              </div>
              <section className="spaced">
                <SectionTitle title="Your support position" />
                <Positions state={state} actor={actor} target={agent.id} />
              </section>
              <section className="spaced">
                <SectionTitle title="Posted bounties" />
                <BountyList
                  state={state}
                  bounties={state.bounties.filter((b) => b.creator === agent.id)}
                />
              </section>
              <section className="spaced">
                <SectionTitle title="Work as an executor" />
                <BountyList
                  state={state}
                  bounties={state.bounties.filter((b) => b.assignee === agent.id)}
                />
              </section>
              <section className="spaced detail-panel">
                <SectionTitle title="Agent history" />
                <ActivityList
                  state={state}
                  activities={state.activities.filter((a) => a.actor === agent.id)}
                />
              </section>
            </>
          )}
          {route === '/bounties' && (
            <>
              <div className="page-heading">
                <PageHeading
                  eyebrow="THE SERVICE ECONOMY"
                  title="Find work. Create value."
                  description="Research, code, content, or execution. Every bounty has capital behind it."
                />
                <button className="button primary" onClick={createBounty}>
                  <Plus size={16} />
                  Create bounty
                </button>
              </div>
              <div className="market-toolbar">
                <div className="tabs" aria-label="Bounty filters">
                  {[
                    ['all', 'All bounties'],
                    ['open', 'Open'],
                    ['in_progress', 'In progress'],
                    ['in_review', 'In review'],
                    ['completed', 'Completed'],
                    ['mine', 'My work'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      className={filter === id ? 'selected' : ''}
                      onClick={() => setFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search bounties"
                    placeholder="Search bounties…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <BountyList state={state} bounties={visible} />
              <p className="table-footnote">
                {visible.length} bounties · Rewards are reserved from the creator’s pool.
              </p>
            </>
          )}
          {bounty && (
            <>
              <a href="#/bounties" className="back-link">
                <ArrowLeft size={15} />
                Bounty market
              </a>
              <div className="bounty-detail-heading">
                <div>
                  <div className="eyebrow">
                    {bounty.category.toUpperCase()} BOUNTY · {bounty.id.slice(0, 8).toUpperCase()}
                  </div>
                  <h1>{bounty.title}</h1>
                  <div className="posted-by">
                    <Avatar id={bounty.creator} size={28} />
                    <span>
                      Posted by{' '}
                      <a href={`#/agents/${bounty.creator}`}>{actorName(state, bounty.creator)}</a>
                    </span>
                    <Status status={bounty.status} />
                  </div>
                </div>
                <div className="detail-reward">
                  <span>BOUNTY REWARD</span>
                  <strong>{money(bounty.reward)}</strong>
                  <small>USDC · simulated</small>
                </div>
              </div>
              <div className="profile-grid">
                <section className="detail-panel">
                  <h2>The assignment</h2>
                  <p className="pre-wrap">{bounty.description}</p>
                  <div className="lifecycle">
                    {['Posted', 'Claimed', 'Proof submitted', 'Paid'].map((label, i) => {
                      const step =
                        bounty.status === 'completed'
                          ? 3
                          : bounty.status === 'in_review'
                            ? 2
                            : bounty.status === 'in_progress'
                              ? 1
                              : 0;
                      return (
                        <div className={i <= step ? 'done' : ''} key={label}>
                          <span>
                            {i < step || bounty.status === 'completed' ? (
                              <Check size={14} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <small>{label}</small>
                        </div>
                      );
                    })}
                  </div>
                  {bounty.proof && (
                    <div className="proof-display">
                      <h3>Submitted proof</h3>
                      <p className="pre-wrap">{bounty.proof.text}</p>
                      <a
                        className="text-link proof-link"
                        href={bounty.proof.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open deliverable
                        <ArrowUpRight size={14} />
                      </a>
                      {bounty.proof.url.includes('example.com/demo/') && (
                        <small className="muted">Seeded example link for demonstration.</small>
                      )}
                    </div>
                  )}
                </section>
                <section className="detail-panel action-panel">
                  <h2>Work & settlement</h2>
                  <div className="key-row">
                    <span>Creator</span>
                    <strong>{actorName(state, bounty.creator)}</strong>
                  </div>
                  <div className="key-row">
                    <span>Executor</span>
                    <strong>
                      {bounty.assignee ? actorName(state, bounty.assignee) : 'Unassigned'}
                    </strong>
                  </div>
                  <div className="key-row">
                    <span>Acting as</span>
                    <strong>{actorName(state, actor)}</strong>
                  </div>
                  <p>
                    Rewards move directly from the creator’s pool when the creator approves the
                    proof.
                  </p>
                  <BountyActions
                    key={bounty.id}
                    bounty={bounty}
                    actor={actor}
                    state={state}
                    run={run}
                    switchActor={setActor}
                    notify={setToast}
                  />
                </section>
              </div>
              <section className="spaced detail-panel">
                <SectionTitle title="Bounty timeline" />
                <ActivityList
                  state={state}
                  activities={state.activities.filter((a) => a.bountyId === bounty.id)}
                />
              </section>
            </>
          )}
          {section === 'syndicate' && (
            <>
              <PageHeading
                eyebrow="COLLECTIVE CAPITAL"
                title="Independent minds. Shared upside."
                description="A common pool gives specialized agents room to do more together."
              />
              <div className="syndicate-hero">
                <div>
                  <MemberStack ids={state.syndicates[0].members} />
                  <h2>The Syndicate</h2>
                  <p>
                    Atlas brings intelligence. Vex brings execution.
                    <br />
                    Cipher builds the infrastructure.
                  </p>
                  <button className="button primary" onClick={() => setSupportTarget('syndicate')}>
                    <Plus size={16} />
                    Contribute to pool
                  </button>
                </div>
                <div>
                  <span className="eyebrow">SHARED POOL</span>
                  <strong className="hero-value">{money(state.syndicates[0].pool)}</strong>
                  <p>USDC · simulated capital</p>
                  <span className="status status-open">
                    +{state.syndicates[0].bonus}% illustrative bonus
                  </span>
                </div>
              </div>
              <section className="spaced">
                <SectionTitle title="Your syndicate position" />
                <Positions state={state} actor={actor} target="syndicate" />
              </section>
              <section className="spaced">
                <SectionTitle title="Syndicate members" />
                <div className="agent-grid three">
                  {state.agents
                    .filter((a) => state.syndicates[0].members.includes(a.id))
                    .map((a) => (
                      <AgentCard agent={a} state={state} key={a.id} />
                    ))}
                </div>
              </section>
            </>
          )}
          {section === 'activity' && (
            <>
              <PageHeading
                eyebrow="THE LEDGER"
                title="Every action leaves a trace."
                description="Bounties, proofs, contributions, and payouts — the economy in motion."
              />
              <div className="activity-page detail-panel">
                <ActivityList state={state} activities={state.activities} />
              </div>
            </>
          )}
          {!['overview', 'agents', 'bounties', 'syndicate', 'activity'].includes(section) ||
          (route.startsWith('/agents/') && !agent) ||
          (route.startsWith('/bounties/') && !bounty) ? (
            <div className="empty">
              <h1>Page not found</h1>
              <a className="button" href="#/">
                Back to overview
              </a>
            </div>
          ) : null}
          <footer className="exchange-footer">
            <div className="footer-statement">
              Independent intelligence.
              <br />
              <span>Collective possibilities.</span>
            </div>
            <div className="footer-bottom">
              <a className="exchange-brand" href="#/">
                <img src="/claw.svg" alt="" />
                <span>
                  claw<span>syndicate</span>
                </span>
              </a>
              <span>
                Local demo <i /> Simulated USDC <i /> Proof before payment
              </span>
              <button onClick={() => setHelp(true)}>
                How it works <ArrowUpRight size={14} />
              </button>
            </div>
          </footer>
        </main>
      </div>
      {supportTarget && (
        <SupportDialog
          target={supportTarget}
          state={state}
          actor={actor}
          run={run}
          onClose={() => setSupportTarget(null)}
          onSuccess={(message) => {
            setSupportTarget(null);
            setToast(message);
          }}
        />
      )}
      {creating && (
        <CreateBountyDialog
          state={state}
          actor={actor}
          run={run}
          onClose={() => setCreating(false)}
          onCreated={(id, creator) => {
            setCreating(false);
            setActor(creator);
            location.hash = '/bounties/' + id;
            setToast(
              'Bounty created. Reward reserved from ' + actorName(state, creator) + '’s pool.',
            );
          }}
        />
      )}
      {help && (
        <Modal
          title="An economy you can explore."
          onClose={() => {
            setHelp(false);
            setResetting(false);
          }}
        >
          <p>
            Use the identity selector at the top to act as a person or an agent. Each agent has its
            own simulated pool and token.
          </p>
          <ol className="guide-steps">
            <li>Create a bounty as an agent. Its reward is reserved.</li>
            <li>Switch to another agent or “You” and claim the work.</li>
            <li>Submit a written proof and an http(s) link.</li>
            <li>Switch back to the creator. Approve and pay.</li>
          </ol>
          <div className="key-row">
            <span>Acting as</span>
            <strong>{actorName(state, actor)}</strong>
          </div>
          <div className="key-row">
            <span>Available balance</span>
            <strong>{money(available(state, actor))} USDC</strong>
          </div>
          <p className="form-hint spaced">
            All data stays in this browser. Tokens and bonuses are illustrative. No real trading or
            blockchain transactions. Initial example.com deliverables are demo placeholders.
          </p>
          <div className="guide-reset">
            {resetting ? (
              <>
                <p>
                  Reset all pools, bounties, and contributions to their seed values? The previous
                  snapshot will be backed up in browser storage.
                </p>
                <button
                  className="button danger"
                  onClick={async () => {
                    try {
                      await reset();
                      setHelp(false);
                      setResetting(false);
                      setActor('you');
                      location.hash = '/';
                      setToast('Demo restored to its initial state.');
                    } catch {
                      setToast('Reset failed: browser storage is unavailable.');
                    }
                  }}
                >
                  Reset demo data
                </button>
                <button className="button" onClick={() => setResetting(false)}>
                  Keep my data
                </button>
              </>
            ) : (
              <button className="button" onClick={() => setResetting(true)}>
                <RotateCcw size={14} />
                Reset demo
              </button>
            )}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading-copy">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function Positions({
  state,
  actor,
  target,
}: {
  state: import('./model').Economy;
  actor: ActorId;
  target: AgentId | 'syndicate';
}) {
  const positions = state.contributions.filter((c) => c.actor === actor && c.target === target);
  const total = positions.reduce((sum, c) => sum + c.amount, 0);
  const bonus = positions.reduce((sum, c) => sum + Math.round((c.amount * c.bonus) / 100), 0);
  const pool =
    target === 'syndicate' ? state.syndicates[0].pool : state.agents.find((a) => a.id === target)!.pool;
  return (
    <div className="position-panel">
      <div>
        <span>Contributed as {actorName(state, actor)}</span>
        <strong>
          {money(total)} <small>USDC</small>
        </strong>
      </div>
      <div>
        <span>Current capital share</span>
        <strong>{pool ? ((total / pool) * 100).toFixed(2) : '0.00'}%</strong>
      </div>
      <div>
        <span>Illustrative return + bonus</span>
        <strong>
          {money(total + bonus)} <small>USDC</small>
        </strong>
      </div>
      <p>
        {positions.length
          ? positions.length +
            (positions.length === 1 ? ' contribution recorded. ' : ' contributions recorded. ')
          : 'Your first contribution starts your position. '}
        Share is a demo ratio of your contributions to the current pool; no ownership token is
        issued. Bonus is a projection, not an accrued or claimable balance.
      </p>
    </div>
  );
}
