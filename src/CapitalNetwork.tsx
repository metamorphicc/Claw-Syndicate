import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const members = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Research & intelligence',
    x: '13%',
    y: '22.22%',
    path: 'M220 100 C350 100 320 225 410 225',
  },
  {
    id: 'vex',
    name: 'Vex',
    role: 'Trading & execution',
    x: '13%',
    y: '77.78%',
    path: 'M220 350 C350 350 320 225 410 225',
  },
  {
    id: 'cipher',
    name: 'Cipher',
    role: 'Engineering & automation',
    x: '87%',
    y: '50%',
    path: 'M780 225 C700 225 670 225 590 225',
  },
];

/** An explorable relationship diagram, independent of financial state or the PC API. */
export default function CapitalNetwork() {
  const [selected, setSelected] = useState(0);
  const [signal, setSignal] = useState(0);
  const choose = (index: number) => {
    setSelected(index);
    setSignal((value) => value + 1);
  };
  return (
    <div className="cx-network" data-kinetic-scene>
      <div className="cx-network-heading">
        <span className="cx-caption">INDEPENDENT MINDS / ONE SHARED POOL</span>
        <span className="cx-caption">SELECT AN AGENT TO FOLLOW THE CONNECTION</span>
      </div>
      <div className="cx-network-stage">
        <svg className="cx-network-lines" viewBox="0 0 1000 450" fill="none" aria-hidden="true">
          <circle className="cx-network-orbit" cx="500" cy="225" r="128" />
          <circle className="cx-network-orbit cx-network-orbit-inner" cx="500" cy="225" r="104" />
          {members.map((member, i) => (
            <g key={member.id} data-selected={selected === i} className="cx-network-link">
              <path className="cx-network-wire" d={member.path} pathLength="100" />
              <path className="cx-network-stream" d={member.path} pathLength="100" />
              <path
                className="cx-network-stream cx-network-stream-second"
                d={member.path}
                pathLength="100"
              />
            </g>
          ))}
        </svg>
        {members.map((member, i) => (
          <button
            className="cx-network-node"
            key={member.id}
            style={{ left: member.x, top: member.y }}
            aria-pressed={selected === i}
            aria-label={`Follow ${member.name}'s connection`}
            onPointerEnter={() => {
              if (selected !== i) choose(i);
            }}
            onFocus={() => {
              if (selected !== i) choose(i);
            }}
            onClick={() => choose(i)}
          >
            <span className="cx-network-glyph" aria-hidden="true">
              {member.name[0]}
            </span>
            <span>
              <strong>{member.name}</strong>
              <small>{member.role}</small>
            </span>
            <span className="cx-network-indicator" aria-hidden="true" />
          </button>
        ))}
        <a
          href="/app/syndicate"
          className="cx-network-core"
          aria-label="Explore the shared syndicate pool"
        >
          <span className="cx-network-ripple" key={signal} aria-hidden="true" />
          <img src="/brand/claw-mark.svg" width="58" height="58" alt="" />
          <strong>THE SYNDICATE</strong>
          <span>
            SHARED POOL <ArrowUpRight size={11} aria-hidden="true" />
          </span>
        </a>
      </div>
      <div className="cx-network-status">
        <p aria-live="polite">
          <span>{members[selected].name}</span>
          <ArrowRight size={16} aria-hidden="true" />
          The Syndicate
        </p>
        <a href={`/app/agents/${members[selected].id}`} className="cx-text-link">
          Meet {members[selected].name}
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
