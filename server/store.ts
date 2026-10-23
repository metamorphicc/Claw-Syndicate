import { DatabaseSync } from 'node:sqlite';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSeed } from '../src/seed';
import {
  assertInvariants,
  initializeJournal,
  transition,
  type Action,
  type Economy,
} from '../src/model';
import { decodeState } from '../src/storage';
const scrypt = promisify(scryptCallback);
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Principal = { userId: string; agentId?: string };
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}
export async function checkPassword(password: string, stored: string) {
  const [salt, value] = stored.split(':');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(hash, Buffer.from(value, 'hex'));
}
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS economy(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,body TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS agent_keys(id TEXT PRIMARY KEY,hash TEXT UNIQUE NOT NULL,agent_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,created TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
   CREATE TABLE IF NOT EXISTS commands(principal TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,PRIMARY KEY(principal,key));`);
    if (!this.db.prepare('SELECT id FROM economy WHERE id=1').get()) {
      const state = createSeed();
      state.wallet = 0;
      state.agents.forEach((a) => (a.ownerId = 'system'));
      state.syndicates.forEach((g) => (g.ownerId = 'system'));
      initializeJournal(state);
      this.save(state);
    }
    assertInvariants(this.state());
  }
  state(): Economy {
    return decodeState(String(this.db.prepare('SELECT body FROM economy WHERE id=1').get()!.body));
  }
  save(s: Economy) {
    assertInvariants(s);
    this.db
      .prepare(
        'INSERT INTO economy(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body',
      )
      .run(JSON.stringify(s));
    const insert = this.db.prepare('INSERT OR IGNORE INTO ledger(id,body) VALUES(?,?)');
    for (const tx of s.journal) insert.run(tx.id, JSON.stringify(tx));
  }
  atomic<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  async register(email: string, name: string, password: string, claimSeed = false) {
    const hash = await hashPassword(password);
    return this.atomic(() => {
      if (this.db.prepare('SELECT id FROM users WHERE email=?').get(email))
        throw new ApiError(409, 'An account with this email already exists.');
      const id = `user_${randomUUID()}`;
      this.db
        .prepare('INSERT INTO users(id,email,name,password) VALUES(?,?,?,?)')
        .run(id, email, name, hash);
      const state = this.state();
      state.users.push({ id, name, balance: 250000 });
      state.revision++;
      const at = new Date().toISOString();
      state.journal.push({
        id: randomUUID(),
        actor: id,
        kind: 'grant',
        memo: 'Initial simulated wallet grant',
        at,
        entries: [
          { account: `wallet:${id}`, delta: 250000 },
          { account: 'external:simulation-grants', delta: -250000 },
        ],
      });
      if (claimSeed) {
        state.agents.filter((a) => a.ownerId === 'system').forEach((a) => (a.ownerId = id));
        state.syndicates.filter((g) => g.ownerId === 'system').forEach((g) => (g.ownerId = id));
        state.journal.push({
          id: randomUUID(),
          actor: id,
          kind: 'ownership',
          memo: 'Local administrator assigned seed ownership',
          at,
          entries: [],
        });
      }
      this.save(state);
      return { id, name };
    });
  }
  async login(email: string, password: string) {
    const row = this.db.prepare('SELECT * FROM users WHERE email=?').get(email) as
      { id: string; name: string; password: string } | undefined;
    // Also spend the password KDF on unknown accounts.
    const dummy = '0'.repeat(32) + ':' + '0'.repeat(128);
    const valid = await checkPassword(password, row?.password ?? dummy);
    if (!row || !valid) throw new ApiError(401, 'Invalid email or password.');
    return { id: row.id, name: row.name };
  }
  session(userId: string) {
    const token = randomBytes(32).toString('base64url');
    this.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    this.db
      .prepare('INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)')
      .run(digest(token), userId, Date.now() + 7 * 86400000);
    return token;
  }
  authenticate(cookie?: string, bearer?: string): Principal | undefined {
    if (bearer) {
      const row = this.db
        .prepare('SELECT user_id,agent_id FROM agent_keys WHERE hash=? AND revoked=0')
        .get(digest(bearer));
      return row ? { userId: String(row.user_id), agentId: String(row.agent_id) } : undefined;
    }
    if (cookie) {
      const row = this.db
        .prepare('SELECT user_id FROM sessions WHERE hash=? AND expires>?')
        .get(digest(cookie), Date.now());
      return row ? { userId: String(row.user_id) } : undefined;
    }
  }
  me(p?: Principal) {
    if (!p) return null;
    const row = this.db.prepare('SELECT id,name FROM users WHERE id=?').get(p.userId);
    return row ? { id: String(row.id), name: String(row.name) } : null;
  }
  authorize(s: Economy, p: Principal, actor: string) {
    if (p.agentId) {
      if (actor !== p.agentId) throw new ApiError(403, 'API key is scoped to one agent.');
    } else if (
      actor !== p.userId &&
      !s.agents.some((a) => a.id === actor && a.ownerId === p.userId)
    )
      throw new ApiError(403, 'This identity is not owned by your account.');
  }
  execute(p: Principal, key: string, revision: number, action: Action) {
    return this.atomic(() => {
      const state = this.state();
      this.authorize(state, p, action.actor);
      const principal = p.agentId ? `agent:${p.agentId}` : `user:${p.userId}`;
      const fingerprint = digest(JSON.stringify(action));
      const prior = this.db
        .prepare('SELECT fingerprint FROM commands WHERE principal=? AND key=?')
        .get(principal, key);
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          throw new ApiError(409, 'Idempotency key already used for a different command.');
        return { state, replayed: true };
      }
      if (revision !== state.revision)
        throw new ApiError(
          409,
          'State changed. Refresh and review the current balances before retrying.',
        );
      let next: Economy;
      try {
        next = transition(state, action);
      } catch (error) {
        throw new ApiError(400, (error as Error).message);
      }
      this.save(next);
      this.db
        .prepare('INSERT INTO commands(principal,key,fingerprint) VALUES(?,?,?)')
        .run(principal, key, fingerprint);
      return { state: next, replayed: false };
    });
  }
  keys(userId: string) {
    return this.db
      .prepare(
        'SELECT id,agent_id AS agentId,name,created,revoked FROM agent_keys WHERE user_id=? ORDER BY created DESC',
      )
      .all(userId);
  }
  issueKey(userId: string, agentId: string, name: string) {
    if (!this.state().agents.some((a) => a.id === agentId && a.ownerId === userId))
      throw new ApiError(403, 'Only the agent owner can issue a key.');
    const token = `claw_${randomBytes(32).toString('base64url')}`;
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO agent_keys(id,hash,agent_id,user_id,name,created) VALUES(?,?,?,?,?,?)')
      .run(id, digest(token), agentId, userId, name, new Date().toISOString());
    return { id, token };
  }
  revokeKey(userId: string, id: string) {
    const result = this.db
      .prepare('UPDATE agent_keys SET revoked=1 WHERE id=? AND user_id=?')
      .run(id, userId);
    if (!result.changes) throw new ApiError(404, 'API key not found.');
  }
  close() {
    this.db.close();
  }
}
