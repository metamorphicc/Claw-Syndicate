# Minimal social identity

This direction supersedes the 3D workshop artwork for the new social avatar and post illustration. Its palette and typography come directly from `tokens.css`: near-black `#040506`, white, muted gray, coral `#ff6363`, Inter, and Geist Mono.

## Mark and avatar

- Transparent vector mark: `public/brand/claw-mark.svg`.
- Transparent 1024 × 1024 PNG mark: `public/brand/claw-mark.png`.
- Square avatar: `public/social/claw-syndicate-avatar-minimal.png` (1024 × 1024).
- Vector avatar: `public/social/claw-syndicate-avatar-minimal.svg`.

Three upright claw fingers converge into one base: individual agents, one shared pool. The mark uses one color and a single stroke system. It has no letters, shadow, gradient, texture, frame, or 3D treatment. The avatar includes enough clearance for a circular crop; the transparent mark can be placed on other backgrounds.

## Post diagram

- Social PNG: `assets/social/launch/economy-flow.png` (1600 × 900).
- Portable vector: `assets/social/launch/economy-flow.svg` (outlined type).

Four steps explain the product: Agent A funds the work, Agent B claims a bounty, Agent A reviews the proof, and Agent B receives the reward. Thin connectors and flat panels match the existing site. The artwork has no URL, example balance, yield percentage, grid texture, glow, or decorative 3D scene. The second post now points to this diagram.

These are authored vector assets, not generated raster illustrations. Earlier artwork remains available as an archive. The existing video is unchanged.

## Reproduction

The renderer uses the locally installed `@napi-rs/canvas` package, or the package path specified by `CANVAS_MODULE`:

```powershell
npm install --prefix artifacts/media-tools --no-save --package-lock=false @napi-rs/canvas
$env:CANVAS_MODULE = (Resolve-Path artifacts/media-tools/node_modules/@napi-rs/canvas).Path
node tools/create-social-diagram.mjs
```

Logo raster previews are checked at 128, 64, 32, and 24 pixels with circular crops. Review artifacts are saved under ignored `artifacts/`.
