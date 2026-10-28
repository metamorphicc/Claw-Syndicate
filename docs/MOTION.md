# Kinetic motion pass

## Intent and ownership

The homepage now has three signature moments: a living, pointer-responsive Claw Core; oversized kinetic typography; and an explorable capital network. Bounty stages have choreographed transitions through depth. The exchange gains staggered content entries, softer route arrivals, and stronger hover response.

This pass uses the installed GSAP scroll animation, scroll-experience, and MotionSites skills. The collectible and technology references informed transform layering and timing. The existing stack, local Blender model, fonts, and black/white/coral palette remain the foundation. No new animation library or remote media was added.

- `src/CinematicLanding.tsx`: scroll choreography and narrative state, scoped with GSAP `matchMedia`.
- `src/useLandingInteractions.ts`: magnetic button contents, sculpture depth, agent-art tilt, and animation visibility. Inner layers keep pointer, entrance, and scroll transforms independent.
- `src/CapitalNetwork.tsx`: selected syndicate member and connection replay. Nodes are keyboard-accessible buttons with pressed state. Profile links and the central syndicate link open real app routes.
- `src/kinetic.css`: typography loops, ambient movement, network streams, card transitions, and responsive fallbacks.
- `src/claw-scene.ts`: one lazy WebGL renderer with the original GLB. Frame-rate-independent damping, slow yaw, float, and lighting add life without another canvas.
- `src/Motion.tsx` and `src/motion.css`: exchange entries and interactions. Independent CSS `translate` prevents entrance motion from overwriting hover tilt.

## Choreography

| Moment | Behaviour |
| --- | --- |
| Title | Characters rise from 115%, rotate from −75° at their baseline, and fade in over 0.9 s with 22 ms stagger. The accessible H1 remains one sentence. |
| Core | Pointer depth eases over 1.1 s. The separate scroll layer shifts 150 px, rotates −12°, and scales to 1.13 with 0.8 s scrub smoothing. |
| Orbit labels | Three labels drift on 6 s cycles; rings rotate in 18 and 26 s. |
| Type strip | Two identical groups form a seamless 26 s loop. Scroll adds separate horizontal drift and bounded ±6° velocity skew. Skew eases back when input stops. |
| Bounty stage | At least 960 px wide and 780 px tall, the narrative pins for 2.2 viewport heights. Cards enter and exit through depth with opposing rotations. Five content layers arrive over 0.65 s with stagger. |
| Phase controls | Native smooth scrolling selects each stage. Only the active pinned panel is exposed to assistive technology. The progress rail eases over 0.55 s. |
| Approval | The check draws over 0.7 s and transfer lines carry a moving highlight. These graphics explain a lifecycle; they are not blockchain indicators. |
| Collective | Cards rise and rotate over 1.15 s with 160 ms stagger. Pointer tilt affects their inner artwork; glyph rings counter-rotate. |
| Capital network | Nodes settle over 0.95 s with a small spring; the centre settles over 1.2 s. Wires draw with scroll. Dash segments travel along normalized SVG paths in 4 s. Selection changes the active connection and emits one ripple. |
| Footer | Letters rise over 1.05 s with 45 ms stagger. Hover fills and lifts individual letters. Ambient light breathes on a 7 s cycle. |
| Exchange | Card/row delays are capped at 220 ms. Routes arrive over 620 ms. Card tilt reaches ±4° with an 8 px lift. Primary buttons gain a short sheen. |

## Input, accessibility, and performance

Wheel and touch input stay native. No scrolling library, wheel interception, custom cursor, or delayed navigation is used. Anchors and explicit phase controls use native smooth scrolling. Pointer effects require a fine pointer and hover. Focus rings and normal link behaviour are retained.

Narrow and short screens show all four narrative panels without pinning or inert content. The phone network becomes a compact selectable layout. The model and kinetic strip remain on phones. Reduced motion skips GSAP choreography, stops CSS loops, removes pinning, and preserves all copy and controls.

One IntersectionObserver manages landing CSS scenes. Offscreen scenes pause their loops; document visibility pauses ambient CSS motion. WebGL stops rendering offscreen and while hidden, resets delta on resume, and caps device pixel ratio. `quickTo` reuses pointer tweens. Contexts, observers, listeners, and animation frame requests are cleaned up under Strict Mode and on unmount.

The network illustrates the existing syndicate members Atlas, Vex, and Cipher. It does not invent balances, query a live ledger, or initiate a contribution. Selecting a node only follows a relationship. Economic state, authentication, API endpoints, ownership, payouts, and deployment configuration are unchanged.

## Validation

- Production build passed, including TypeScript and the native relay check. Vite retains the existing lazy Three.js chunk size advisory.
- All 22 existing tests passed, including ownership, atomic/idempotent settlement, persistence, relay, and clean URL contracts.
- Browser checks covered phase controls and final payment stage, hiding inactive panels from assistive technology, network selection and profile-link updates, specialty filtering in the exchange, and app navigation.
- Requested viewports: 320 × 740, 375 × 812, 768 × 1024, 1440 × 650, and 1440 × 900. Document and client widths matched. Headline characters were not clipped horizontally. Narrow/short layouts exposed all four panels, with no pinning or `aria-hidden` panels.
- Exchange checks used the loopback-only in-memory capture fixture. No operator database or `.env.api` was read. The temporary fixture was stopped after review.
- Screenshots are under ignored `artifacts/kinetic/`.
- A separate built-preview pass reported no browser console entries. The final SVG wires settled at dash offset zero, active streams ran, and the offscreen hero's CSS loops were paused. Review caught a late/incomplete wire reveal; the final version fixes the dash length and finishes drawing before the network becomes the main viewport content.
- Reduced-motion branches and cleanup were reviewed in source. Browser tooling does not expose preference emulation, so no OS-level reduced-motion or physical-device GPU profiling result is claimed.

Implementation substages are committed locally. Nothing is pushed or deployed automatically.
