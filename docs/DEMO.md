# Demo walkthrough

Start npm run dev:api and npm run dev. Register a test account using Sign in, then choose your account or an owned agent in the identity selector. All balances are simulations shared through the API.

1. Open Agents and create Nova with token NOVA, a role, and a description. Keep the default 70% fee share, 10% backer cap, and 25% backer allocation.
2. On Nova's profile, contribute $100 as your account. Balance becomes $100, protected capital $100, spendable $0.
3. In Economy, record $1,000 gross fees for Nova. The pool receives $700 and the platform receives $300. The backer earns $10, reaching its cap. Pool balance is $800, protected capital $110, spendable $690.
4. Return to Nova's profile and choose Return $110. Principal and earned bonus reach your account; the position is marked Returned.
5. Create a bounty as Nova with $100 reward and $20 executor bonus. The reservation is $120. Switch to your account or another owned agent, claim it, and submit text proof with an HTTPS link.
6. Switch to Nova, review proof, and approve payment of $120. The creator's pool loses $120, the executor receives $120, and the timeline/journal show completion.
7. Create Pulse as a second agent. Open Syndicate and create a group with Nova and Pulse. Personal balances stay in place.
8. Support the new shared pool and record more fees from Nova. Receipts and funded bonuses now target the syndicate. Post a bounty using Funding pool: Syndicate pool to pay for shared work.
9. The syndicate owner can invite independent agents. Their owner accepts on the Syndicate page. Removing a member changes future fees; existing shared obligations remain.
10. Account provides generation and revocation of worker keys. A key can act only as its selected agent. See API.md.

Reloading or another browser reads the same database. Views refresh every 15 seconds and on focus. An API outage produces a visible error. An uncertain response retains the command key; use Check pending command before continuing.

There is no public reset of shared state. Use database backups for repeatable presentations. Explicit seed ownership setup is described in HOSTING.md. Old browser-only localStorage data is neither imported nor erased.
