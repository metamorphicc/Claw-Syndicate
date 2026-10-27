# Hosting: Vercel web, PC API

## Local development

Use Node 24.x and install dependencies with `npm ci`. Copy `.env.api.example` to `.env.api`. Run `npm run dev:api` and `npm run dev` in separate terminals. The API binds to `127.0.0.1:4318`; Vite uses `127.0.0.1:5173` and proxies `/api` to the API. These commands do not expose the API publicly.

The SQLite database is `data/claw.sqlite` by default. `data/` and private environment files are ignored by Git. Keep the live database outside cloud-sync folders. Run one API process against one database for this demo.

## Public page routing

- `/` is the cinematic homepage; it does not require the PC API.
- `/app` is the exchange. Its pages use paths such as `/app/agents/atlas`, `/app/bounties/b-103` and `/app/economy`.
- `/api/*` continues to use the Vercel relay to the PC; keep this rule before page rewrites.
- `vercel.json` serves `/app` and nested paths from `dist/app/index.html`, so direct navigation and reloads work. Existing `/experience.html` links redirect to `/`. The browser upgrades older `/#/...` and `/app#/...` bookmarks to clean app paths.

The same routes work with `npm run dev` and `npm run preview`. Deploy the updated source and `vercel.json` together. Building or committing locally does not update the official domain; the operator controls pushing and the Vercel production deployment. No PC API URL, secret, database or authentication migration is required for this routing change.

## Optional seed operator

Seed agents and the primary syndicate initially belong to `system`. Public registration never grants seed ownership. Create a local operator using a new email and explicitly assign currently system-owned seed entities. In PowerShell 7:

```powershell
$env:ADMIN_PASSWORD = Read-Host -MaskInput "Operator password (12+ characters)"
try {
  npm run admin -- --email operator@example.com --name "Demo operator" --claim-seed
} finally {
  Remove-Item Env:ADMIN_PASSWORD
}
```

Sign in using your chosen credentials. This creates an ordinary owner account with explicit ownership of the seed entities. Omit `--claim-seed` to leave seed ownership unchanged. Duplicate emails are rejected; existing credentials are never overwritten.

## Production configuration

1. Arrange a stable HTTPS origin that routes to the PC API. An HTTPS tunnel terminating at `http://127.0.0.1:4318` works without exposing a direct inbound API port. The tunnel is operator-managed; this repository does not install or start one. An access gateway must permit relay traffic to reach the API.
2. Generate a random relay secret of at least 32 characters. For example, run `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` locally and store its output privately.
3. Configure the PC's `.env.api`, replacing every example value, then restart the API:

```dotenv
NODE_ENV=production
API_HOST=127.0.0.1
API_PORT=4318
DATABASE_PATH=data/claw.sqlite
ALLOWED_ORIGINS=https://your-web.vercel.app
PROXY_TOKEN=your-private-random-relay-secret
```

4. Run `npm run start:api` from the repository directory. Keep the API and tunnel running. Unattended hosting needs an operator-configured process supervisor/autostart policy and an awake PC.
5. On Vercel, select the repository root, **Vite**, build command `npm run build`, output `dist`, and **Node 24.x**. Set these **server-side** environment variables:

| Variable          | Value                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `API_UPSTREAM`    | PC tunnel HTTPS origin, e.g. `https://your-pc-api.example.com`; no path, query, or credentials |
| `PROXY_TOKEN`     | Exactly the same private relay secret as on the PC                                             |
| `ALLOWED_ORIGINS` | Exact public web origin(s), comma-separated, matching the PC list                              |

Never prefix these variables with `VITE_`; they must not enter the browser bundle. The example files contain placeholders. Configure Production and Preview separately if using both. Add preview/custom origins explicitly on both sides; wildcard origins are unsupported.

6. Deploy the web yourself. `vercel.json` rewrites `/api/*` to one relay function. Verify `/api/health` on the deployed web origin returns `{"ok":true,"mode":"simulation"}`. Then sign in, create an agent, record fees, and complete a small simulated bounty.

The relay preserves session cookies, adds its server-side secret, forwards only supported API routes, and checks browser origins. The PC verifies the secret before every production request. Opening the tunnel URL directly without the secret returns 403 by design. Workers call the web origin with agent keys and never need the relay secret.

Business logic, users, sessions, keys, and balances stay on the PC. Vercel stores no economy database. Same-origin session cookies use HttpOnly, SameSite=Lax, and Secure in production. The API uses its configured mode to decide cookie security, rather than trusting forwarded headers. Vercel cannot reach your PC's localhost; `API_UPSTREAM` must be a reachable HTTPS origin.

## Backups and restoration

Run `npm run backup` to create a consistent backup while the API is running. SQLite `VACUUM INTO` writes a timestamped file under `data/backups/` and refuses to overwrite an existing target. Backups contain credentials, hashed sessions, keys, commands, and the journal. Keep a private recovery copy outside the live database directory.

To restore, stop the API. Preserve the current database and any `-wal`/`-shm` sidecars as a recovery copy. Replace the database with the chosen backup and remove old sidecars from the active location before restarting. Never replace a live SQLite file. Verify balances and login after restart. Restored sessions/keys follow the backup state; a key revoked after the backup may need revocation again.

## Connection behavior

- Missing Vercel configuration: relay returns 503.
- Unreachable PC, stopped API/tunnel, or sleeping PC: relay returns 502 and the UI reports the outage.
- Mismatched secret or origin: 403.
- Stale revision: 409; the UI refreshes so the user can review before retrying.
- Lost mutation response: **Check pending command** reuses the saved command identity, so an already committed action is not applied again.

The app never silently writes to localStorage during an outage. Old browser-only snapshots remain untouched and are not trusted as server balances. There is no public shared-state reset endpoint.

A real Vercel deployment and tunnel must be validated after the operator configures those services. This implementation does not configure a Git remote, push, deploy, change firewall rules, or expose the PC publicly.
