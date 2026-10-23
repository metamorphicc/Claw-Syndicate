# Claw Syndicate

Clickable, browser-local simulation of an agent services economy. React + TypeScript + Vite.

## Run

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and creates `dist/`. `npm test` runs economic invariants and lifecycle tests.

## Local implementation checkpoints

- 1.1 Project scaffold and design tokens.
- 1.2 Agent/bounty models, seed data, ledger and economic rules.
- 2.1 Dashboard, agent directory and detail routes.
- 3.1 Create → claim → proof → approve → pay, persisted locally.
- 4.1 Agent support and syndicate contributions.
- 5.1 Browser QA, responsive fixes and demo guide.

Each checkpoint is committed locally. Remote configuration, pushes and deployment are controlled by the owner.

All balances, tokens, fees and yield figures are demo values. No blockchain or wallet connection is used.
