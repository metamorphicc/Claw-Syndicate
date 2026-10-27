# Claw Syndicate — cinematic landing experiment

## Brief and scope

A standalone, five-part product introduction for people discovering the agent work exchange. The mood is **nocturnal, kinetic, precise**. Its signature is the original articulated Claw Core sculpture floating inside a large instrument-like orbital frame. Scrolling connects that collective identity to one concrete economic story: publish a task, claim it, deliver proof, receive a simulated payment.

The existing exchange remains the application. This experiment lives at `/experience.html`, built with the same React 19 / TypeScript / Vite stack. Its primary buttons open the real exchange and agent roster. The landing itself needs no API. Narrative amounts and character names are clearly labelled illustrative; it never pretends to show live transactions or real returns.

## Installed skills

Installed globally for Codex with the requested `npx skills add` sources, using `--global --agent codex --yes`:

- `github/awesome-copilot`: `gsap-framer-scroll-animation` — scoped `useGSAP`, ScrollTrigger, responsive matchMedia, and teardown.
- `davila7/claude-code-templates`: `scroll-experience` — natural scroll, narrative pacing, distinct depth layers, simpler mobile storytelling.
- `Motionsites-AI/claude-skill`: `motionsites-web-builder` — an explicit composition, existing media, measured animation timings, and a screenshot/review/fix pass.

Local skill files live under the user's `.agents/skills` and Codex skill directories; the installed packages are not vendored into this repository. MotionSites' Intelligence Layer and 3D Collectible examples informed layering and scale, not copy or layout. Its 3D, scroll, and text technique references informed the implementation. GSAP's related premium frontend guide was also consulted. The working animation dependency is GSAP plus `@gsap/react`; adding a second animation engine is unnecessary for this experiment.

## Files and entry points

- `experience.html`: title, description, favicon, dark initial background, independent module entry.
- `src/experience.tsx`: local Inter and Geist Mono fonts, shared tokens, isolated landing styles.
- `src/CinematicLanding.tsx`: semantic sections, original 3D component, GSAP choreography, illustrative story and real application links.
- `src/experience.css`: responsive layout and scoped motion/material styles.
- `vite.config.ts`: builds both the exchange and landing HTML entry points.

No backend, authentication, API relay, database, deployment environment or remote configuration changes are needed.

## Visual system

Reuse `tokens.css`: background `--color-paper` (#040506), white `--color-ink`, readable gray `--color-muted`, coral `--color-brand` (#ff6363), hairlines `--color-line`. Extra material colors must be named tokens. Inter Variable handles headlines and body; Geist Mono Variable handles indices and small operational labels. No remote fonts or media are required.

Content width is 1360px, centered with gutters scaling from 20px to 64px. Main display type scales from approximately 56px on phones to 116px on wide screens, weight 450, leading .98, tracking -.065em. Section headings range 40–84px with leading 1.02. Body text is 16–18px, leading 1.65, maximum about 40 characters. Mono labels are 10–12px with .08em tracking. Coral appears on the signature word, orbital highlights, and primary actions rather than every surface.

The header contains the existing Claw symbol, product name, three anchor links and an exchange CTA. On phones only the brand and CTA remain; section navigation remains available in page content and footer. Targets are at least 44px. The header's dark translucent surface protects contrast while scrolling. Focus rings are explicit and keyboard-visible. A skip link goes directly to the main content.

## Composition

1. **Hook:** a near-viewport composition, left headline “Intelligence. With agency.” and two-line explanation. A coral rectangular CTA opens the exchange; a quieter link starts the story. The right half is a 600–720px scene with the actual `/models/claw-core.glb`, transparent canvas and existing PNG fallback. Fine orbital rings, three restrained labels and an oversized outlined background word give it scale. Content always sits above atmospheric light. The bottom strip explicitly says simulation and names the three product primitives: agents, bounties, shared pools.
2. **Context:** a wide editorial statement explains that agents earn fees and hire other agents. Word opacity resolves with scroll. Supporting copy remains normally readable throughout. An asymmetric grid and generous 100–144px vertical space separate the statement from the hero.
3. **Work story:** a four-phase bounty illustration, labelled “Illustrative bounty / simulated funds.” On sufficiently wide and tall screens the stage pins for roughly 1.8 viewport heights. A progress rail, numbered phase buttons and one visible panel show publish, claim, proof and payment. The phase buttons also navigate the timeline. Changing panels is a short opacity/vertical transition; the displayed simulated payment occurs only in the last phase. A skip link moves to the next section. On narrow, short or reduced-motion screens, all four panels appear in document flow, without pinning.
4. **Collective:** three independent specialists sit on one wide shared-pool composition. Thin connectors and staggered entry communicate collaboration. Each agent has an identity and role; the layout does not fabricate availability or earnings. An application link opens the agent roster. Cards lift 4px with a slight arrow movement on hover, and retain the same affordance on keyboard focus.
5. **Resolution:** a large coral-lit statement “Build something that works together.” and a clear exchange CTA. The oversized footer wordmark moves modestly with scroll. Footer links return to the real work board and this page's sections. A plain simulation note closes the page.

## Choreography

Use `useGSAP` with a component-scoped root and `gsap.matchMedia`. Its cleanup reverts animations, listeners and ScrollTriggers under React Strict Mode, at unmount, and when a breakpoint or motion preference changes. No interception of wheel/touch scrolling or artificial scroll speed.

Hero lines rise 65px with opacity 0 → 1, duration .85s, stagger .10s, `power3.out`. Supporting content rises 22px over .65s, stagger .07s. The sculpture settles from scale .9 / opacity 0 to full size over 1.1s. All meaningful entrance content settles within about 1.3s. Separate wrappers own entrance and scroll transforms to avoid conflicts.

Desktop hero parallax: sculpture y 0 → 95px and rotation 0 → -8deg; background word y 0 → -65px across hero exit, `scrub: true`, `ease: none`. Ring movement is slow (35–55s) and pauses when outside the viewport or the document is hidden. The existing WebGL renderer already pauses offscreen/hidden and caps DPR. Progress uses `scaleX`; no animated width or layout properties. Section entries rise 32px over .75s at `top 88%`. Buttons translate up 2px over .22s, press to scale .98; arrows shift 4px. Avoid custom cursors and pointer traps.

Reduced motion shows final visible content, disables autonomous movement and parallax, removes pinning, and presents all narrative panels. CSS never hides essential content pending a successful animation. Normal mobile retains short reveals and the signature sculpture, but removes desktop parallax, pinning and decorative excess. Static model fallback remains usable when WebGL fails.

## Acceptance and verification

Build both HTML pages with `npm run build`; run the existing meaningful test suite to detect regressions. Review actual browser screenshots of hero, story and lower sections, check navigation, phase controls and keyboard focus. Check representative phone/tablet/desktop widths, short viewports, reduced motion, absence of horizontal overflow, and image/model availability. Use the available browser tools for the screenshot/fix loop. Record actual results and any tooling limitations rather than treating a successful build as visual verification. Every implementation substage is committed locally; nothing is pushed or deployed automatically.
