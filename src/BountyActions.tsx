import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, FileCheck2 } from 'lucide-react';
import type { ActorId, Bounty, Economy } from './model';
import { actorName, money } from './model';
import type { RunAction } from './dialogs';
export function BountyActions({ bounty: b, actor, state, run, switchActor, notify }: { bounty: Bounty; actor: ActorId; state: Economy; run: RunAction; switchActor: (id: ActorId) => void; notify: (text: string) => void }) {
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const [proof, setProof] = useState(b.proof?.text ?? ''); const [url, setUrl] = useState(b.proof?.url ?? '');
  async function execute(type: 'claim' | 'approve' | 'revise' | 'cancel' | 'proof') {
    setError(''); setPending(true);
    try { await run(type === 'proof' ? { type, actor, bountyId: b.id, text: proof, url } : { type, actor, bountyId: b.id }); notify(type === 'approve' ? `${money(b.reward)} paid to ${actorName(state, b.assignee!)}. Bounty completed.` : type === 'claim' ? 'Bounty claimed. You can now submit your proof.' : type === 'proof' ? 'Proof submitted. Switch to the creator to review it.' : type === 'revise' ? 'Changes requested. The executor can submit a revised proof.' : 'Bounty cancelled. Reserved funds released.'); } catch (err) { setError((err as Error).message); } finally { setPending(false); }
  }
  function submit(e: FormEvent) { e.preventDefault(); void execute('proof'); }
  const switchButton = (id: ActorId, text: string) => <button className="button full-width" onClick={() => { switchActor(id); setError(''); }}>{text}<ArrowRight size={14} /></button>;
  return <div className="bounty-actions">
    {b.status === 'open' && (actor !== b.creator ? <button disabled={pending} className="button primary full-width" onClick={() => execute('claim')}>{pending ? 'Claiming…' : `Claim as ${actorName(state, actor)}`}<ArrowRight size={15} /></button> : <><p className="form-hint">You posted this bounty. Switch identity to take it as an executor.</p>{switchButton('you', 'Switch to demo user')}<button disabled={pending} className="button danger full-width" onClick={() => execute('cancel')}>Cancel unclaimed bounty</button></>)}
    {b.status === 'in_progress' && (actor === b.assignee ? <form className="form" onSubmit={submit}><label>Proof of completed work<textarea required minLength={20} maxLength={4000} value={proof} onChange={e => setProof(e.target.value)} placeholder="Explain what you delivered and how it meets the criteria…" /></label><label>Deliverable link<input required type="url" maxLength={2000} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/your-work" /></label><button className="button primary full-width" disabled={pending}>{pending ? 'Submitting…' : 'Submit proof'}<FileCheck2 size={15} /></button></form> : <><p className="form-hint">{actorName(state, b.assignee!)} is working on this bounty.</p>{switchButton(b.assignee!, `Switch to ${actorName(state, b.assignee!)} to submit`)}</>)}
    {b.status === 'in_review' && (actor === b.creator ? <><p className="form-hint">Review the proof. Approval transfers {money(b.reward)} from your pool to {actorName(state, b.assignee!)}.</p><button className="button primary full-width" disabled={pending} onClick={() => execute('approve')}>{pending ? 'Settling…' : `Approve & pay ${money(b.reward)}`}<Check size={16} /></button><button className="button full-width" disabled={pending} onClick={() => execute('revise')}>Request changes</button></> : <><p className="form-hint">Proof submitted. Waiting for {actorName(state, b.creator)} to review.</p>{switchButton(b.creator, `Switch to ${actorName(state, b.creator)} to review`)}</>)}
    {b.status === 'completed' && <div className="settlement-success"><Check size={25} /><strong>Work approved. Reward paid.</strong><p>{money(b.reward)} transferred to {actorName(state, b.assignee!)}.</p><small>{b.completedAt && new Date(b.completedAt).toLocaleString()}</small></div>}
    {b.status === 'cancelled' && <p className="form-hint">This bounty was cancelled before it was claimed. Reserved funds were released.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
