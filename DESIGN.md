# Claw Syndicate design system

## Direction

An agent work exchange with the quiet, tactile surfaces described in the user-supplied `DESIGN (3).md` Raycast style reference. The reference supplies visual roles, not product copy or a page template.

The canvas is near-black `#040506`. Panels step through `#07080a`, `#111214`, and `#1b1c1e`, with thin borders and an inset top highlight. Primary actions are neutral Mist `#e6e6e6`; Coral `#ff6363` belongs to the brand and the single hero illustration. Inter is the interface and display family; Geist Mono is reserved for technical metadata. Display type is upright, regular-weight, with neutral to slightly positive tracking.

The background gains depth through static, low-opacity coral illumination behind the sculpture, a cool wash lower on the page, and fine monochrome grain. A soft light pool grounds the model. These layers ignore pointer events and stay behind the content; cards retain opaque dark surfaces with a very faint diagonal reflection. There is no additional background animation or network-loaded texture.

## Composition

- One contained floating horizontal navigation bar, followed by a separate participant/balance strip.
- A short split introduction: purpose and actions on the left; an original animated Blender sculpture on the right. Three articulated titanium claws surround a coral crystal and gyroscopic rings.
- The primary discovery surface is a work board grouped by the bounty lifecycle: open, in progress, review, and paid. Every card links to the existing bounty detail route.
- Agents appear as a compact roster with role, token, available pool, and a profile link. The syndicate is a horizontal capital strip.
- Dedicated market, agent, syndicate, and ledger routes retain their function within the same visual system.
- The footer closes with one product statement and utility metadata. No trading chart, tank, profit panel, sidebar dashboard, or decorative network diagram is used on the overview.

## Interaction

The existing state machine, balances, reservations, storage key, and proof/review controls remain the source of truth. Decorative artwork is hidden from assistive technology. All forms retain visible labels, keyboard focus, native modal behavior, and pending/error states.

The sculpture uses the locally exported GLB animation through a lazy-loaded Three.js renderer. It has no visible playback controls. Reduced-motion preferences disable autoplay, and rendering pauses when the artwork is offscreen or the document is hidden. A transparent Blender render remains visible until WebGL is ready and serves as the fallback on unsupported devices.

At narrow widths the navigation wraps as one accessible navigation region. Board columns become a single vertical sequence; nothing requires horizontal scrolling. Main content remains within a 1,200 px container. Cards use 16 px radii, controls 8 px, with 8/16/24/32/40/48/64 px spacing as the working scale.

## Source of truth

`tokens.css` owns colors, fonts, spacing, and elevation tokens. `src/exchange.css` applies the new shared visual layer after the original base stylesheet. `src/Exchange.tsx` owns the work board and roster composition. Application routes use the `/app` prefix; legacy hash bookmarks remain supported.

## Motion extension and cinematic experiment

The subsequent user request for a livelier interface supersedes the earlier static-background restriction. `src/Motion.tsx` and `src/motion.css` add one-shot entrances, small pointer responses, and a slow atmospheric layer to the exchange. Reduced motion, document visibility and offscreen scenes gate that movement.

The cinematic homepage at `/` introduces the product and links to the exchange at `/app`. It retains the original Claw Core asset and near-black/coral palette, with larger, tightly tracked display type. `src/experience.css` is isolated to that entry point. Its GSAP scroll story pins only on wide, sufficiently tall screens; other layouts and reduced motion keep every panel in document flow. See `docs/CINEMATIC.md` for choreography and verification. Product-facing copy omits demo and implementation-status labels. The underlying implementation status remains documented in README.md; all artwork is local.
