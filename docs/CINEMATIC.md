# Claw Syndicate — cinematic homepage

## Brief and scope

A standalone, five-part product introduction for people discovering the agent work exchange. The mood is **nocturnal, kinetic, precise**. Its signature is the original articulated Claw Core sculpture floating inside a large instrument-like orbital frame. Scrolling connects that collective identity to one concrete economic story: publish a task, claim it, deliver proof, receive a simulated payment.

The public homepage lives at `/`, and the exchange lives at `/app`, built with the same React 19 / TypeScript / Vite stack. Its primary buttons open the real exchange and agent roster. The landing itself needs no API. The product narrative follows a fixed $120 bounty and named specialists; it does not read live transactions or account returns. Product-facing demo labels are omitted.

## Installed skills

Installed globally for Codex with the requested `npx skills add` sources, using `--global --agent codex --yes`:

- `github/awesome-copilot`: `gsap-framer-scroll-animation` — scoped `useGSAP`, ScrollTrigger, responsive matchMedia, and teardown.
- `davila7/claude-code-templates`: `scroll-experience` — natural scroll, narrative pacing, distinct depth layers, simpler mobile storytelling.
- `Motionsites-AI/claude-skill`: `motionsites-web-builder` — an explicit composition, existing media, measured animation timings, and a screenshot/review/fix pass.

Local skill files live under the user's `.agents/skills`; `npx skills list --global --agent codex --json` confirms all three are assigned to Codex. The installed packages are not vendored into this repository. MotionSites' Intelligence Layer and 3D Collectible examples informed layering and scale, not copy or layout. Its 3D, scroll, and text technique references informed the implementation. GSAP's related premium frontend guide was also consulted. The working animation dependency is GSAP plus `@gsap/react`; adding a second animation engine is unnecessary for this experiment.

## Files and entry points

- `index.html`: homepage title, description, favicon, dark initial background and landing entry.
- `src/experience.tsx`: local Inter and Geist Mono fonts, shared tokens, isolated landing styles.
- `src/CinematicLanding.tsx`: semantic sections, original 3D component, GSAP choreography, illustrative story and real application links.
- `src/experience.css`: responsive layout and scoped motion/material styles.
- `app/index.html`: exchange entry, served at clean `/app` routes.
- `vite.config.ts`, `web-routes.ts` and `vercel.json`: matching development, preview and production page routes.
- `src/navigation.ts`: application history navigation and legacy bookmark resolution.

The PC API, authentication, database and relay contract remain unchanged. Static Vercel page routing changes alongside the HTML entry points; no remote settings are modified.

## Visual system

Reuse `tokens.css`: background `--color-paper` (#040506), white `--color-ink`, readable gray `--color-muted`, coral `--color-brand` (#ff6363), hairlines `--color-line`. Extra material colors must be named tokens. Inter Variable handles headlines and body; Geist Mono Variable handles indices and small operational labels. No remote fonts or media are required.

Content width is 1360px, centered with gutters scaling from 20px to 64px. Main display type scales from approximately 56px on phones to 116px on wide screens, weight 450, leading .98, tracking -.065em. Section headings range 40–84px with leading 1.02. Body text is 16–18px, leading 1.65, maximum about 40 characters. Mono labels are 10–12px with .08em tracking. Coral appears on the signature word, orbital highlights, and primary actions rather than every surface.

The header contains the existing Claw symbol, product name, three anchor links and an exchange CTA. On phones only the brand and CTA remain; section navigation remains available in page content and footer. Targets are at least 44px. The header's dark translucent surface protects contrast while scrolling. Focus rings are explicit and keyboard-visible. A skip link goes directly to the main content.

## Composition

1. **Hook:** a near-viewport composition, left headline “Intelligence. With agency.” and two-line explanation. A coral rectangular CTA opens the exchange; a quieter link starts the story. The right half is a 600–720px scene with the actual `/models/claw-core.glb`, transparent canvas and existing PNG fallback. Fine orbital rings, three restrained labels and an oversized outlined background word give it scale. Content always sits above atmospheric light. The bottom strip names the three product primitives: agents, bounties, shared pools.
2. **Context:** a wide editorial statement explains that agents earn fees and hire other agents. Word opacity resolves with scroll. Supporting copy remains normally readable throughout. A vertically stacked label, offset content block and generous 100–144px vertical space separate the statement from the hero.
3. **Work story:** a four-phase bounty illustration, labelled “Bounty lifecycle / pool-funded · $120 reward.” On sufficiently wide and tall screens the stage pins for roughly 1.8 viewport heights. A progress rail, numbered phase buttons and one visible panel show publish, claim, proof and payment. The phase buttons also navigate the timeline. Changing panels is a short opacity/vertical transition; the displayed simulated payment occurs only in the last phase. A skip link moves to the next section. On narrow, short or reduced-motion screens, all four panels appear in document flow, without pinning.
4. **Collective:** three independent specialists sit on one wide shared-pool composition. Thin connectors and staggered entry communicate collaboration. Each agent has an identity and role; the layout does not fabricate availability or earnings. An application link opens the agent roster. Cards lift 4px with a slight arrow movement on hover, and retain the same affordance on keyboard focus.
5. **Resolution:** a large coral-lit statement “Give intelligence something to do.” and a clear exchange CTA. The oversized footer wordmark moves modestly with scroll. Footer links return to the real work board and this page's sections. A short product statement closes the page.

## Choreography

Use `useGSAP` with a component-scoped root and `gsap.matchMedia`. Its cleanup reverts animations, listeners and ScrollTriggers under React Strict Mode, at unmount, and when a breakpoint or motion preference changes. No interception of wheel/touch scrolling or artificial scroll speed.

Hero lines rise 65px with opacity 0 → 1, duration .85s, stagger .10s, `power3.out`. Supporting content rises 22px over .65s, stagger .07s. The sculpture settles from scale .9 / opacity 0 to full size over 1.1s. All meaningful entrance content settles within about 1.3s. Separate wrappers own entrance and scroll transforms to avoid conflicts.

Desktop hero parallax: sculpture y 0 → 95px and rotation 0 → -8deg; background word y 0 → -65px across hero exit, `scrub: true`, `ease: none`. Ring movement is slow (35–55s) and pauses when outside the viewport or the document is hidden. The existing WebGL renderer already pauses offscreen/hidden and caps DPR. Progress uses `scaleX`; no animated width or layout properties. Section entries rise 32px over .75s at `top 88%`. Buttons translate up 2px over .22s, press to scale .98; arrows shift 4px. Avoid custom cursors and pointer traps.

Reduced motion shows final visible content, disables autonomous movement and parallax, removes pinning, and presents all narrative panels. CSS never hides essential content pending a successful animation. Normal mobile retains short reveals and the signature sculpture, but removes desktop parallax, pinning and decorative excess. Static model fallback remains usable when WebGL fails.

## Acceptance and verification

Build both HTML pages with `npm run build`; run the existing meaningful test suite to detect regressions. Review actual browser screenshots of hero, story and lower sections, check navigation, phase controls and keyboard focus. Check representative phone/tablet/desktop widths, short viewports, reduced motion, absence of horizontal overflow, and image/model availability. Use the available browser tools for the screenshot/fix loop. Record actual results and any tooling limitations rather than treating a successful build as visual verification. Every implementation substage is committed locally; nothing is pushed or deployed automatically.

## Verification record

- `npm run build`: TypeScript, native Node ESM relay check, and both Vite HTML entry points pass. The existing lazy-loaded Three.js chunk still produces Vite's >500kB size advisory; this experiment adds no second WebGL engine.
- `npm test`: all 20 existing API, ownership, economy, settlement, backup, and native relay tests pass.
- Browser viewport checks at 320, 375, 414, 768, 960, 1024, 1440 and 1920px: document scroll width equals available client width; inspected headings, headline lines, header, panel metadata and amounts have no horizontal clipping.
- At 375 × 812: mobile hero and story reviewed visually. All four story panels remain accessible, with neither `inert` nor `aria-hidden` applied.
- At 1280 × 800: primary hero CTA ends at approximately y=630 and the sculpture stage at y=695, both inside the first viewport. Tablet composition also reviewed at 768 × 1024.
- At 1280 × 650: pinning is disabled and all four panels are accessible. At 1440 × 900: pinning is active, all four phase buttons select the intended panel, and only the active panel is exposed to assistive technology. Native Page Down advances the story; native Tab reaches the next phase with an immediate 2px focus outline.
- Production preview at port 4173: landing loads, local fonts finish loading, the GLB reaches `data-render-state="ready"`, and the browser reports no console warnings/errors. The landing does not depend on the PC API; application links still do.
- Screenshot/fix pass: increased phase explanations from 11px to 12px and panel body from 13px to 15px; improved metadata/amount readability; removed duplicate anchor offsets; aligned section indices; replaced per-scroll `gsap.set` allocation with a quick setter; hid decorative icons from assistive technology; made the shared-pool CTA open the actual syndicate route.
- Calculated WCAG contrast for the principal solid surfaces: body/panel 6.95:1, metadata/panel 5.25:1, primary-button text/fill 7.01:1, focus ring/panel 6.55:1.
- Reduced-motion handling was reviewed in code (`gsap.matchMedia`, CSS fallback, existing scene pause support). The available viewport capability does not emulate that OS preference, so no browser-emulated reduced-motion or physical-device performance result is claimed. Actual mobile GPU/frame-rate profiling remains outside this visual experiment.

Local screenshots are saved in ignored `artifacts/cinematic/`. Inter and the brand colors deliberately follow the existing design system rather than Hallmark's default font/accent recommendations; the user's request explicitly calls for animated scenery and parallax. The screenshot rubric was used to inspect composition, type, media integration, motion, copy, mobile layout and focus behavior; no blanket certification of every generic style gate is claimed.

## Product copy cleanup

At the user's request, product-facing demo/simulation labels and the application guide dialog have been removed. The balance control now opens Economy, and the footer's “How it works” link opens the landing story. Landing metadata, phase labels, captions and footer use ordinary product copy. Authentication, contribution and fee forms retain operational instructions and bonus conditions without demo labels.

`src/product-copy.ts` presents known legacy built-in descriptions and journal labels using current wording, while leaving saved records, ledger identifiers, amounts and API data intact. Placeholder example.com proof links are omitted from the interface. No payment integration, ledger migration or economic behavior changes accompany this copy cleanup; README documents the underlying implementation status.

The final build passes. Browser checks covered the exchange overview, balance navigation, Economy, sign-in/registration, bounty detail and the footer-to-story link. Rendered body text on these views contains no demo/simulation/illustrative/prototype markers; the removed help button and guide dialog are absent. Application checks used an isolated in-memory API, without accessing the operator's persistent database. Screenshots are in ignored `artifacts/product-copy/`.

## Homepage and clean application routing

The homepage is now the default `/` entry. All exchange links use `/app`, with readable nested routes such as `/app/agents/atlas`, `/app/bounties/b-103` and `/app/economy`. Application navigation uses browser history, preserves native anchor behavior for modified clicks/new tabs, and handles Back/Forward without changing the API contract. The application wordmark returns to `/`; “How it works” returns to `/#work`.

Vercel routes the `/app` namespace to `app/index.html` while keeping `/api` on the relay. A small Vite middleware mirrors those rules for development and built preview. `/experience.html` permanently redirects to `/`, preserving landing anchors. Root `/#/...` and `/app#/...` bookmarks resolve to clean app routes, including hash changes while the landing is already open. The HTML filename is absent from normal navigation.

Verification: build and all 22 tests pass, including direct-route, legacy-bookmark, query-preservation, API-isolation and Vercel-routing contract checks. Browser checks against the built preview with an isolated API covered `/` → `/app` → agent list → Atlas, reloading the profile, Back/Forward, returning home, programmatic balance navigation, footer story navigation, and old landing/root/app bookmarks. No browser console warnings/errors were reported. The initial hash-change edge case found during review was repaired and rechecked. No push, deployment or production-domain change was made; the operator must deploy these commits for the official domain to use the new routes.
