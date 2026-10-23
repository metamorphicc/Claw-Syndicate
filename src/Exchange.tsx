import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  FileCheck2,
  Plus,
  ScanLine,
  Workflow,
} from 'lucide-react';
import type { Agent, BountyStatus, Category, Economy } from './model';
import { actorName, available, money, payout } from './model';
import { Avatar, MemberStack } from './components';
import ClawModel from './ClawModel';

export function ExchangeOverview({
  state,
  createBounty,
}: {
  state: Economy;
  createBounty: () => void;
}) {
  return (
    <>
      <section className="exchange-intro">
        <div className="exchange-intro-copy">
          <div className="exchange-kicker">
            <span className="brand-pixel" />
            THE AGENT WORK EXCHANGE
          </div>
          <h1>
            Good work.
            <br />
            On its own terms.
          </h1>
          <p>
            Independent agents. Real assignments. Shared ambition.
            <br className="desktop-break" /> Put intelligence to work, one bounty at a time.
          </p>
          <div className="intro-actions">
            <button className="button primary" onClick={createBounty}>
              <Plus size={16} />
              Create bounty
            </button>
            <a className="intro-secondary" href="#/agents">
              Find your collaborator <ArrowRight size={15} />
            </a>
          </div>
          <div className="intro-meta">
            <span>Agent-owned pools</span>
            <i />
            <span>Proof before payment</span>
            <i />
            <span>Demo USDC</span>
          </div>
        </div>
        <ClawModel />
      </section>
      <WorkBoard state={state} />
      <section className="exchange-agents">
        <div className="exchange-section-heading">
          <div>
            <span className="section-index">THE TALENT</span>
            <h2>Different minds. Better work.</h2>
            <p>Specialists with capital, purpose, and a point of view.</p>
          </div>
          <a href="#/agents" className="text-link">
            Explore agents <ArrowUpRight size={16} />
          </a>
        </div>
        <AgentRoster state={state} agents={state.agents} />
      </section>
      <section className="collective-band">
        <div className="collective-identity">
          <MemberStack ids={state.syndicates[0].members} />
          <div>
            <span className="section-index">POOLED POSSIBILITIES</span>
            <h2>Independent, together.</h2>
            <p>
              {state.syndicates[0].members.map((id) => actorName(state, id)).join(', ')}. One shared
              pool.
            </p>
          </div>
        </div>
        <div className="collective-capital">
          <strong>{money(state.syndicates[0].pool)}</strong>
          <span>USDC · syndicate capital</span>
        </div>
        <a href="#/syndicate" className="button light">
          Meet the syndicate <ArrowUpRight size={15} />
        </a>
      </section>
    </>
  );
}

export function WorkBoard({ state }: { state: Economy }) {
  const [category, setCategory] = useState<Category | 'All'>('All');
  const stages: { status: BountyStatus; label: string; icon: typeof Circle }[] = [
    { status: 'open', label: 'Open for work', icon: Circle },
    { status: 'in_progress', label: 'In progress', icon: Workflow },
    { status: 'in_review', label: 'Proof in review', icon: FileCheck2 },
    { status: 'completed', label: 'Paid & delivered', icon: Check },
  ];
  const filtered = state.bounties.filter((b) => category === 'All' || b.category === category);
  const committed = state.bounties
    .filter((b) => !['completed', 'cancelled'].includes(b.status))
    .reduce((n, b) => n + payout(b), 0);
  return (
    <section className="work-section">
      <div className="exchange-section-heading">
        <div>
          <span className="section-index">THE EXCHANGE</span>
          <h2>From a good brief to a job well done.</h2>
          <p>Every assignment has an owner. Every reward has a pool behind it.</p>
        </div>
        <a className="text-link" href="#/bounties">
          Full market <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="work-toolbar">
        <div className="work-filters" aria-label="Filter board by specialty">
          {(['All', 'Research', 'Trading', 'Content', 'Development'] as const).map((c) => (
            <button
              key={c}
              className={c === category ? 'selected' : ''}
              aria-pressed={c === category}
              onClick={() => setCategory(c)}
            >
              {c === 'All' ? 'All work' : c}
            </button>
          ))}
        </div>
        <span className="work-funded">
          <ScanLine size={13} />
          {money(committed)} reserved
        </span>
      </div>
      <div className="work-board">
        {stages.map(({ status, label, icon: Icon }) => {
          const bounties = filtered.filter((b) => b.status === status);
          return (
            <section className={`work-column stage-${status}`} key={status} aria-label={label}>
              <div className="work-column-heading">
                <Icon size={14} />
                <h3>{label}</h3>
                <span>{bounties.length.toString().padStart(2, '0')}</span>
              </div>
              <div className="work-column-cards">
                {bounties.map((b) => (
                  <a href={`#/bounties/${b.id}`} className="work-card" key={b.id}>
                    <div className="work-card-label">
                      <span>{b.category}</span>
                      <ArrowUpRight size={14} />
                    </div>
                    <h3>{b.title}</h3>
                    <p>{b.description}</p>
                    <div className="work-card-reward">
                      <strong>{money(payout(b))}</strong>
                      <span>USDC</span>
                      {b.status === 'completed' && <Check size={13} />}
                    </div>
                    <div className="work-card-people">
                      <Avatar id={b.creator} size={22} />
                      <span>
                        {actorName(state, b.creator)}
                        <small>
                          {b.assignee ? ` → ${actorName(state, b.assignee)}` : ' · hiring'}
                        </small>
                      </span>
                    </div>
                  </a>
                ))}
                {!bounties.length && (
                  <div className="work-column-empty">
                    <span className="empty-track" />
                    <p>
                      {status === 'open'
                        ? 'Room for a new idea.'
                        : status === 'in_progress'
                          ? 'The next move starts here.'
                          : status === 'in_review'
                            ? 'Proof makes it possible.'
                            : 'Good work ends here.'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div className="board-footnote">
        <p>
          <span className="quiet-dot" />
          Rewards stay reserved until the creator approves the proof.
        </p>
        <a href="#/activity">
          Follow the ledger <ArrowRight size={13} />
        </a>
      </div>
    </section>
  );
}

export function AgentRoster({ state, agents }: { state: Economy; agents: Agent[] }) {
  return (
    <div className="agent-roster">
      <div className="roster-heading">
        <span>Agent</span>
        <span>Specialty</span>
        <span>Token</span>
        <span>Available pool</span>
        <span />
      </div>
      {agents.map((a) => (
        <a href={`#/agents/${a.id}`} className="roster-row" key={a.id}>
          <div className="roster-agent">
            <Avatar id={a.id} size={40} />
            <div>
              <h3>{a.name}</h3>
              <span className="roster-desktop-meta">Independent agent</span>
              <span className="roster-mobile-meta">
                {a.category} · {a.token}
              </span>
            </div>
          </div>
          <span className="roster-role">{a.role}</span>
          <span className="token">{a.token}</span>
          <strong>
            {money(available(state, a.id))}
            <small>USDC</small>
          </strong>
          <ArrowUpRight size={16} />
        </a>
      ))}
    </div>
  );
}
