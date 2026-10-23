# Claw Syndicate

A clickable simulation of an AI agent economy: independent pools, a bounty marketplace, agent support, and shared syndicate capital. Built with React 19, TypeScript, and Vite. No backend or blockchain connection is required.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

The development server defaults to http://127.0.0.1:5173. If that port is busy, Vite prints the selected port in the terminal.

```sh
npm test
npm run build
npm run preview
```

The build checks TypeScript and generates static files in `dist/`. Hash routes such as `#/agents/atlas` work without server-side rewrite rules. Fonts and avatars are bundled locally.

## Features

- Four agents: Atlas, Vex, Echo, and Cipher, each with a role, avatar, simulated token, pool, and history.
- A lifecycle work board, searchable agent roster and profiles, bounty market and detail pages, syndicate page, and complete activity ledger.
- Create a bounty → claim it as another agent or human → submit proof with text and a link → review as the creator → pay the executor.
- Request revisions or cancel an unclaimed bounty.
- Support an agent or contribute to the syndicate, with balance updates and illustrative share and bonus calculations.
- Search, status filters, demo identity switching, available balances, a demo guide, and data reset.
- localStorage persistence, validation on load, and cross-tab synchronization. Web Locks serializes changes in supported browsers.

## Economic model

`src/model.ts` contains the domain types and pure `transition` function. Money is stored as integer cents. Creating a bounty reserves its reward without debiting the pool. Approving proof debits the creator and credits the executor exactly once. New bounties and contributions account for existing reservations.

`src/seed.ts` provides four agents, five bounties at different stages, one syndicate, and a starting user balance of 2,500 USDC. Seed pools already include the historical payment for the completed bounty.

`src/storage.ts` validates saved data, while `src/useEconomy.ts` persists transitions. If a storage write fails, the action is not applied. Corrupt data is never overwritten automatically. **Demo guide → Reset demo** restores seed data and backs up the previous snapshot under `claw-syndicate:v1:backup`.

## Local implementation checkpoints

Each checkpoint has its own local commit:

1. **1.1** — React scaffold, configuration, and design tokens.
2. **1.2** — Models, seed data, state machine, and economic tests.
3. **2.1** — Dashboard, directory, agent profiles, and bounty routes.
4. **3.1** — Persistence, validation, and cross-tab synchronization.
5. **3.2** — Bounty creation, proof, review, revisions, and payment controls.
6. **4.1** — Agent support, syndicate contributions, and participant positions.
7. **5.1** — Mobile layout, typography, accessibility, storage tests, and formatting.
8. **5.1.1** — Font import correction following the build check.
9. **5.2** — Demo walkthrough and verification notes.
10. **6.1** — English README.
11. **6.2** — Shared near-black, coral, and neutral-action visual system.
12. **6.3** — Floating navigation, lifecycle work board, and agent roster.
13. **6.4** — Responsive refinements and font dependency cleanup.
14. **6.5** — Redesign documentation and verification notes.
15. **7.1** — Original Blender sculpture, animation, editable scene, and GLB export.
16. **7.2** — Lazy-loaded 3D hero with pause/play, pointer response, and rendered fallback.
17. **7.3** — Model verification, responsive refinements, and authoring documentation.
18. **7.3.1** — Zero-based Blender export timeline for an exact, synchronized 12-second loop.
19. **8.1** — Remove visible model playback controls while retaining motion preferences.
20. **8.2** — Layered ambient background, subtle grain, and model grounding light.

No Git remote is configured. Remote setup, pushes, and deployment are controlled by the owner.

See [docs/DEMO.md](docs/DEMO.md) for the demo walkthrough and [docs/QA.md](docs/QA.md) for verification notes. These supporting documents are currently in Russian.

## Design

The user-supplied Raycast style reference informs the near-black canvas, Inter and Geist Mono typography, neutral primary actions, coral brand mark, and inset panel highlights. The overview is organized around work stages and an agent roster. All existing detail routes and economic actions remain available. Shared design decisions are documented in [DESIGN.md](DESIGN.md), with tokens in `tokens.css` and the visual layer in `src/exchange.css`.

The background uses static coral and cool ambient lighting, faint procedural grain, and a soft pool of light beneath the sculpture. All layers are local CSS or an embedded texture and sit behind interactive content.

### Blender hero

The original **Claw Core** sculpture is authored in Blender 5.2. It replaces the SVG hero with three articulated titanium fingers, luminous coral channels, a faceted shared crystal, and moving gyroscopic rings. Six synchronized animation tracks form a 12-second loop.

The editable source is [assets/claw-core.blend](assets/claw-core.blend). [tools/create_claw_core.py](tools/create_claw_core.py) regenerates the scene, `public/models/claw-core.glb`, and its transparent poster. See [assets/README.md](assets/README.md) for the command.

Three.js loads in a separate chunk when the hero mounts. The model is approximately 816 KiB, with no remote HDR, texture, or decoder requests. The animation runs without visible playback controls; pointer movement adds a small view tilt. Rendering stops when offscreen or in a hidden tab, and reduced-motion preferences disable autoplay. Devices without WebGL display the Blender-rendered poster.

## Demo limitations

Identity switching simulates roles; it is not authentication. Data belongs to one browser and is not shared across users. Autonomous agent execution, real tokens, trading fees, blockchain transactions, withdrawals, and accrued yield are outside this demo. Support bonuses are illustrative projections. Seed proof links on example.com are labeled placeholders.
