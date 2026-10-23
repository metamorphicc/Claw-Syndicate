import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Radio,
  Zap,
} from 'lucide-react';
import type { ActorId, Activity, Agent, AgentId, Bounty, BountyStatus, Economy } from './model';
import { actorName, money } from './model';

export function Avatar({ id, size = 44 }: { id: ActorId; size?: number }) {
  const paths: Record<ActorId, React.ReactNode> = {
    atlas: (
      <>
        <path d="M17 35 24 17l7 18M20 29h8" />
        <path d="M13 18v16m22-16v16" opacity=".4" />
      </>
    ),
    vex: (
      <>
        <path d="m13 19 11 16 11-16M17 19l7 10 7-10" />
        <path d="M16 37h16" opacity=".4" />
      </>
    ),
    echo: (
      <>
        <path d="M32 17H17v18h15M17 26h12" />
        <path d="M35 21v11" opacity=".4" />
      </>
    ),
    cipher: (
      <>
        <path d="m19 18-8 8 8 8m10-16 8 8-8 8m-3-19-4 22" />
      </>
    ),
    you: (
      <>
        <circle cx="24" cy="21" r="5" />
        <path d="M14 36c0-11 20-11 20 0" />
      </>
    ),
  };
  return (
    <span className={`avatar tone-${id}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths[id]}
      </svg>
    </span>
  );
}
export const statusNames: Record<BountyStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
export function Status({ status }: { status: BountyStatus }) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {statusNames[status]}
    </span>
  );
}
export function AgentCard({ agent, state }: { agent: Agent; state: Economy }) {
  const completed = state.bounties.filter(
    (b) => b.assignee === agent.id && b.status === 'completed',
  ).length;
  const active = state.bounties.filter(
    (b) => b.creator === agent.id && !['completed', 'cancelled'].includes(b.status),
  ).length;
  return (
    <a className="agent-card" href={`#/agents/${agent.id}`}>
      <div className="agent-card-top">
        <Avatar id={agent.id} size={50} />
        <span className="token">{agent.token}</span>
      </div>
      <div className="agent-name">
        <h3>{agent.name}</h3>
        <span className="online-dot" title="Demo agent available" />
      </div>
      <p className="agent-role">{agent.role}</p>
      <div className="card-pool">
        <span>Agent pool</span>
        <strong>
          {money(agent.pool)}
          <small> USDC</small>
        </strong>
      </div>
      <div className="agent-card-bottom">
        <span>
          <span className="mini-dot" />
          {active} active {active === 1 ? 'bounty' : 'bounties'}
        </span>
        <span>
          {completed} done <ArrowUpRight size={14} />
        </span>
      </div>
    </a>
  );
}
export function BountyList({
  bounties,
  state,
  compact = false,
}: {
  bounties: Bounty[];
  state: Economy;
  compact?: boolean;
}) {
  return (
    <div className={`bounty-table ${compact ? 'compact' : ''}`}>
      <div className="table-head">
        <span>Bounty / posted by</span>
        <span>Category</span>
        <span>Status</span>
        <span>Reward</span>
        <span />
      </div>
      {bounties.length ? (
        bounties.map((b) => (
          <a className="bounty-row" href={`#/bounties/${b.id}`} key={b.id}>
            <div className="bounty-cell">
              <span className={`task-icon category-${b.category.toLowerCase()}`}>
                {b.category === 'Research' ? (
                  <Radio size={19} />
                ) : b.category === 'Development' ? (
                  <Zap size={19} />
                ) : b.category === 'Content' ? (
                  <FileCheck2 size={19} />
                ) : (
                  <ArrowUpRight size={19} />
                )}
              </span>
              <div>
                <h3>{b.title}</h3>
                <p>
                  <span className={`tiny-avatar tone-${b.creator}`}>
                    {actorName(state, b.creator)[0]}
                  </span>
                  {actorName(state, b.creator)}
                  <span className="dot-separator">·</span>
                  {b.assignee
                    ? `Assigned to ${actorName(state, b.assignee)}`
                    : 'Open to agents & humans'}
                </p>
              </div>
            </div>
            <span className="category-cell">{b.category}</span>
            <Status status={b.status} />
            <strong className="reward">
              {money(b.reward)}
              <small>USDC</small>
            </strong>
            <ChevronRight size={16} className="row-arrow" />
          </a>
        ))
      ) : (
        <div className="empty">
          <Radio size={25} />
          <h3>No bounties here yet</h3>
          <p>Try another filter or create the first one.</p>
        </div>
      )}
    </div>
  );
}
export function ActivityList({ activities, state }: { activities: Activity[]; state: Economy }) {
  return (
    <div className="activity-list">
      {activities.length ? (
        activities.map((a, i) => (
          <div className="activity-item" key={a.id}>
            <span className={`event-icon ${a.kind === 'payment' ? 'event-payment' : ''}`}>
              {a.kind === 'payment' ? (
                <Check size={13} />
              ) : a.kind === 'support' || a.kind === 'syndicate' ? (
                <ArrowDownLeft size={14} />
              ) : (
                <Zap size={13} />
              )}
            </span>
            <div>
              <p>
                <strong>{actorName(state, a.actor)}</strong>{' '}
                {a.bountyId ? <a href={`#/bounties/${a.bountyId}`}>{a.text}</a> : a.text}
              </p>
              <span>
                {i === 0
                  ? 'Latest event'
                  : new Date(a.at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                {a.amount ? (
                  <>
                    {' '}
                    <span className="dot-separator">·</span> <b>{money(a.amount)} USDC</b>
                  </>
                ) : null}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="muted">Activity will appear here.</p>
      )}
    </div>
  );
}
export function NetworkArt() {
  return (
    <div className="network-art" aria-hidden="true">
      <svg className="network-lines" viewBox="0 0 450 250">
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".8" className="grid-dot" />
          </pattern>
        </defs>
        <rect width="450" height="250" fill="url(#dots)" />
        <g className="connections" fill="none">
          <path d="M225 125 100 62 80 185 225 125 345 64 365 188 225 125M100 62 345 64M80 185 365 188" />
          <circle cx="225" cy="125" r="74" strokeDasharray="3 7" />
        </g>
        <g className="flow-dots">
          <circle cx="162" cy="93" r="3" />
          <circle cx="294" cy="159" r="3" />
          <circle cx="221" cy="63" r="3" />
        </g>
      </svg>
      <div className="network-center">
        <img src="/claw.svg" alt="" />
        <span>SYNDICATE</span>
      </div>
      <div className="network-node node-atlas">
        <Avatar id="atlas" size={48} />
        <span>ATLAS</span>
      </div>
      <div className="network-node node-vex">
        <Avatar id="vex" size={44} />
        <span>VEX</span>
      </div>
      <div className="network-node node-echo">
        <Avatar id="echo" size={44} />
        <span>ECHO</span>
      </div>
      <div className="network-node node-cipher">
        <Avatar id="cipher" size={44} />
        <span>CIPHER</span>
      </div>
      <span className="network-label">
        <span className="online-dot" /> Autonomous collaboration
      </span>
    </div>
  );
}
export function SectionTitle({
  title,
  description,
  href,
  link,
}: {
  title: string;
  description?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <a className="text-link" href={href}>
          {link ?? 'View all'}
          <ArrowRight size={15} />
        </a>
      )}
    </div>
  );
}
export function StatStrip({ state }: { state: Economy }) {
  const active = state.bounties.filter((b) => !['completed', 'cancelled'].includes(b.status));
  const paid = state.bounties
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.reward, 0);
  return (
    <div className="stats-strip">
      <div>
        <span>
          <CircleDollarSign size={15} />
          Total capital in pools
        </span>
        <strong>
          {money(state.agents.reduce((n, a) => n + a.pool, 0) + state.syndicates[0].pool)}
          <small>USDC</small>
        </strong>
        <p>Across agents & syndicate</p>
      </div>
      <div>
        <span>
          <Radio size={15} />
          Active agents
        </span>
        <strong>
          {state.agents.length.toString().padStart(2, '0')}
          <i className="online-dot" />
        </strong>
        <p>Ready to put intelligence to work</p>
      </div>
      <div>
        <span>
          <Clock3 size={15} />
          Active bounties
        </span>
        <strong>
          {active.length.toString().padStart(2, '0')}
          <small>{money(active.reduce((n, b) => n + b.reward, 0))} reserved</small>
        </strong>
        <p>From open to awaiting approval</p>
      </div>
      <div>
        <span>
          <ArrowUpRight size={15} />
          Bounties paid
        </span>
        <strong>
          {money(paid)}
          <small>USDC</small>
        </strong>
        <p>Work delivered. Capital distributed.</p>
      </div>
    </div>
  );
}
export function MemberStack({ ids }: { ids: AgentId[] }) {
  return (
    <div className="member-stack">
      {ids.map((id) => (
        <Avatar key={id} id={id} size={28} />
      ))}
    </div>
  );
}
