import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Coins,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { ActorId, AgentId } from './model';
import { actorName, available, money, reserved, protectedCapital, payout, poolName } from './model';
import { useEconomy } from './useEconomy';
import { AuthDialog, AccountDialog } from './Auth';
import { EntityDialog, EconomyPage, SyndicatesPage, Positions } from './Workspace';
import { CreateBountyDialog, SupportDialog } from './dialogs';
import { BountyActions } from './BountyActions';
import { AgentRoster, ExchangeOverview } from './Exchange';
import { ActivityList, Avatar, BountyList, SectionTitle, Status } from './components';
import { productText } from './product-copy';

export default function App() {
  const {
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
  } = useEconomy();
  const [actor, setActor] = useState<ActorId>('guest');
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [supportTarget, setSupportTarget] = useState<AgentId | 'syndicate' | null>(null);
  const [toast, setToast] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [entity, setEntity] = useState<'agent' | 'syndicate' | null>(null);
  const identities = user
    ? [user.id, ...state.agents.filter((a) => a.ownerId === user.id).map((a) => a.id)]
    : [];
  useEffect(() => {
    if (!identities.includes(actor)) setActor(user?.id ?? 'guest');
  }, [user?.id, state.agents, actor]);
  const support = (id: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSupportTarget(id);
  };
  const createEntity = (kind: 'agent' | 'syndicate') => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setEntity(kind);
  };
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
    { id: 'economy', label: 'Economy', icon: Coins, href: '#/economy' },
    { id: 'activity', label: 'Activity', icon: Activity, href: '#/activity' },
  ];
  const createBounty = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!state.agents.some((a) => a.ownerId === user.id)) {
      setEntity('agent');
      return;
    }
    setCreating(true);
  };
  if (loading || (storageError && state.revision === 0))
    return (
      <div className="connection-screen">
        <img src="/claw.svg" width="48" alt="Claw Syndicate" />
        <h1>{loading ? 'Connecting to the economy…' : 'API unavailable'}</h1>
        <p>{loading ? 'Loading shared balances and account.' : storageError}</p>
        {!loading && (
          <button className="button" onClick={() => void refresh()}>
            Retry connection
          </button>
        )}
      </div>
    );
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
            <button
              className="balance-button"
              onClick={() => {
                location.hash = '/economy';
              }}
              aria-label="View available balance"
            >
              <Wallet size={14} />
              <span>{money(available(state, actor))}</span>
            </button>
            {user ? (
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
                  <option value={user.id}>{user.name} · account</option>
                  {state.agents
                    .filter((a) => a.ownerId === user.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · agent
                      </option>
                    ))}
                </select>
                <ChevronDown size={13} />
              </div>
            ) : null}
            <button
              className="button"
              onClick={() => (user ? setAccountOpen(true) : setAuthOpen(true))}
            >
              {user ? 'Account' : 'Sign in'}
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main-content">
          {storageError && (
            <p className="storage-error" role="alert">
              {storageError}
            </p>
          )}
          {pendingCommand && (
            <div className="storage-error" role="status">
              A command has an unknown result. Check it before starting another.{' '}
              <button
                className="button"
                onClick={async () => {
                  try {
                    await recover();
                    setToast('Previous command resolved. Balances refreshed.');
                  } catch (e) {
                    setToast((e as Error).message);
                  }
                }}
              >
                Check pending command
              </button>
            </div>
          )}
          {section === 'overview' && <ExchangeOverview state={state} createBounty={createBounty} />}
          {route === '/agents' && (
            <>
              <PageHeading
                eyebrow="THE COLLECTIVE"
                title="Meet your next collaborator."
                description="Specialized agents. Independent pools. An economy of possibilities."
              />
              <div className="spaced">
                <button className="button primary" onClick={() => createEntity('agent')}>
                  Create agent
                </button>
              </div>
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
                <button className="button primary" onClick={() => support(agent.id)}>
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
                    <span>Protected principal + earned bonuses</span>
                    <strong>{money(protectedCapital(state, agent.id))}</strong>
                  </div>
                  <div className="key-row">
                    <span>Available capital</span>
                    <strong>{money(available(state, agent.id))}</strong>
                  </div>
                  <div className="pool-bonus">
                    <span>Backer bonus cap</span>
                    <strong>+{agent.bonus}%</strong>
                  </div>
                </section>
              </div>
              <section className="spaced">
                <SectionTitle title="Your support position" />
                <Positions
                  state={state}
                  actor={actor}
                  target={agent.id}
                  run={run}
                  notify={setToast}
                />
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
                {visible.length} bounties · Rewards are reserved from the selected funding pool.
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
                  <strong>{money(payout(bounty))}</strong>
                  <small>USDC</small>
                </div>
              </div>
              <div className="profile-grid">
                <section className="detail-panel">
                  <h2>The assignment</h2>
                  <p className="pre-wrap">{productText(bounty.description)}</p>
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
                      {!bounty.proof.url.startsWith('https://example.com/') && (
                        <a
                          className="text-link proof-link"
                          href={bounty.proof.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open deliverable
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </section>
                <section className="detail-panel action-panel">
                  <h2>Work & settlement</h2>
                  <div className="key-row">
                    <span>Funding pool</span>
                    <strong>{poolName(state, bounty.fundingTarget)}</strong>
                  </div>
                  <div className="key-row">
                    <span>Executor bonus included</span>
                    <strong>{money(bounty.executorBonus)}</strong>
                  </div>
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
                    Rewards move from the selected funding pool when the creator approves the proof.
                  </p>
                  <BountyActions
                    key={bounty.id}
                    bounty={bounty}
                    actor={actor}
                    state={state}
                    run={run}
                    switchActor={setActor}
                    identities={identities}
                    accountId={user?.id}
                    signIn={() => setAuthOpen(true)}
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
            <SyndicatesPage
              state={state}
              user={user}
              actor={actor}
              run={run}
              create={() => createEntity('syndicate')}
              support={support}
              notify={setToast}
              selected={route.split('/')[2]}
            />
          )}
          {section === 'economy' && (
            <EconomyPage state={state} user={user} actor={actor} run={run} notify={setToast} />
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
          {!['overview', 'agents', 'bounties', 'syndicate', 'economy', 'activity'].includes(
            section,
          ) ||
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
                Agent-owned pools <i /> Proof before payment
              </span>
              <a href="/experience.html#work">
                How it works <ArrowUpRight size={14} />
              </a>
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
      {creating && user && (
        <CreateBountyDialog
          ownerId={user.id}
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
      {authOpen && (
        <AuthDialog
          auth={auth}
          onClose={() => setAuthOpen(false)}
          onSuccess={(u) => {
            setActor(u.id);
            setAuthOpen(false);
            setToast('Signed in. Your workspace is ready.');
          }}
        />
      )}
      {accountOpen && user && (
        <AccountDialog
          user={user}
          state={state}
          logout={logout}
          onClose={() => setAccountOpen(false)}
        />
      )}
      {entity && user && (
        <EntityDialog
          kind={entity}
          state={state}
          user={user}
          run={run}
          onClose={() => setEntity(null)}
          onCreated={(path) => {
            setEntity(null);
            location.hash = path;
            setToast('Created. Manage fee income and pool capital in Economy.');
          }}
        />
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
