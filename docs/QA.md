# Verification: shared economy stages

Date: 23 October 2026. Node 24.11.1, local Windows development environment.

## Automated checks

`npm test`: **19 tests pass**. Coverage includes:

- Complete bounty lifecycle, creator/executor permissions, revisions, cancellation, reservations, and single settlement.
- Separate executor bonuses and syndicate-funded rewards.
- Protected contribution principal, funded bonus caps, proportional allocation/cent rounding, redemption, and conservation through balanced journal entries.
- Dynamic agent/syndicate creation, unique symbols, invitation consent, removal, and future fee routing.
- State schema validation, corrupt/unsupported data, and balance/journal consistency.
- SQLite persistence after reopening, explicit local seed ownership, authenticated identities, agent key scope/revocation, and disallowed origins.
- Concurrent replay of the same approval, different-body key reuse, stale revisions, and duplicate payout rejection.
- Vercel relay route restrictions, fixed upstream, cookie/header forwarding, body limits, configuration/outage responses, and production cookie security.
- A relay response lost after the PC commits: retrying the same command returns replayed state and credits fees only once.
- Consistent online database backup, restore, credential persistence, and overwrite refusal.

`npm run build`: web, API, and relay TypeScript pass; Vite production assets build successfully. The existing lazy Three.js chunk remains about 638 kB before gzip and produces the size advisory. Node emits its expected experimental SQLite warning on the tested version.

`npm run backup`: created a consistent timestamped backup under ignored `data/backups/` while the local API was running.

## Browser verification

The existing in-app browser was used against the real local API through Vite's proxy.

- Registered a local QA account, received the $2,500 simulated grant, and verified the authenticated identity selector exposes only that account and its owned agents.
- Created Nova with its own token and parameters. Its pool began at $0.
- Contributed $100: pool $100, protected $100, spendable $0.
- Recorded $1,000 gross fees: $700 to Nova, $300 platform fees, $10 funded backer bonus; pool $800, protected $110, spendable $690.
- Returned $110: account $2,510, active position closed, Nova pool $690.
- Created a $100 bounty with $20 executor bonus, claimed as the account, submitted proof, switched to Nova, and approved. UI showed Completed and $120 paid; account $2,630, Nova pool $570.
- Created Pulse and the Northstar Collective syndicate with both agents. Personal balances stayed in place. The detail route, owner membership controls, and invite selector rendered correctly.
- Contributed $100 to the new group and recorded another $1,000 from Nova. The receipt routed $700 to Northstar, credited $300 to platform fees, and funded $10 in group backer bonuses. Shared balance $800, protected $110, spendable $690; Nova's personal pool remained $570.
- Checked the new pages in the existing narrow browser panel. Dialogs use native modal focus behavior; token, number, and text inputs accepted valid values.

QA entities and balances are retained in the ignored local database as a useful demo scenario. No public reset was introduced. Test credentials are not committed; the owner should create their own account or local seed operator.

## Deployment boundary

Vercel configuration and relay contracts are tested locally. No Vercel account, domain, public tunnel, or deployed environment was configured or tested. The operator must supply those endpoints and private variables, then perform the deployment smoke test in HOSTING.md. No remote was configured and no commit was pushed.

Real token issuance, trading integrations, wallets, payments, and autonomous AI execution remain outside these three stages. The implementation provides the shared simulation and agent API. Earlier browser-only QA is retained in Git history; its localStorage/reset assumptions do not apply to the current app.
