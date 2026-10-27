# Claw Syndicate social launch kit

Two unpublished English X posts with matching media. Copy is in `posts.md`.

| File | Use |
| --- | --- |
| `claw-syndicate-intro.mp4` | 39-second product overview, 1920 × 1080, 30 fps, H.264/AAC |
| `intro-cover.png` | Video cover frame |
| `economy-flow.png` | Current second-post diagram, 1600 × 900 |
| `economy-flow.svg` | Portable vector diagram with outlined typography |
| `agents-hire-agents.png` | Archived 3D illustration, 1536 × 1024 |
| `claw-syndicate-intro.srt` | Optional descriptive captions |
| `timeline.json` | Scene timings and camera/highlight settings |
| `source/` | Actual application screenshots used in the edit |

The current still and avatar use a minimal direction taken from the website: black, white, coral, Inter, and Geist Mono. The diagram explains the pool-funded bounty lifecycle. Its editable drawing source is `tools/create-social-diagram.mjs`; the matching avatar is `public/social/claw-syndicate-avatar-minimal.png`. See `docs/assets/claw-syndicate-minimal-brand.md` for files and reproduction instructions.

The existing video is an animated edit of real application screenshots, with camera movement, short dissolves, highlighted UI regions, and an original synthesized instrumental bed. It has no voiceover and remains understandable when muted. It retains the earlier core avatar; its styling has not been re-rendered. No URL is baked into the media assets.

## Capture provenance

Screens were captured in the current local application. The proof and approval frames show the same bounty (`b-103`), first reviewed as Atlas and then approved for Echo. The isolated in-memory database uses the existing application API and ledger logic. It never reads `.env.api`, production credentials, or the operator's persistent database. Seed balances are examples, not evidence of real blockchain transactions, trading income, or investment returns.

The throwaway capture account in `capture-server.mts` is deliberately public and exists only in memory. The server binds to loopback. Do not deploy this fixture. The temporary capture processes were stopped after recording.

To capture replacement screens:

```powershell
node --import tsx assets/social/launch/capture-server.mts
```

Open `http://127.0.0.1:5182/`. Capture at a desktop viewport around 1440 × 900 after fonts, entrance animations, and data have loaded. Sign in with the disposable account defined in the fixture when recording creator actions. Save replacement PNGs under `source/` using the existing names. Stop the fixture with Ctrl+C.

## Re-render locally

The media renderer is independent of the production app and makes no browser or network requests. It loads the captured PNGs, local brand avatar, and bundled Inter font, then renders frames through Canvas into FFmpeg. The score is generated from oscillators, with no samples or external music.

From the repository root:

```powershell
npm install --prefix artifacts/media-tools --no-save --package-lock=false @napi-rs/canvas ffmpeg-static
$env:CANVAS_MODULE = (Resolve-Path artifacts/media-tools/node_modules/@napi-rs/canvas).Path
$env:FFMPEG_PATH = (Resolve-Path artifacts/media-tools/node_modules/ffmpeg-static/ffmpeg.exe).Path
node assets/social/launch/render-intro.mjs --preview
node assets/social/launch/render-intro.mjs
```

The preview writes review frames under ignored `artifacts/`. The final render updates the MP4, cover, and timeline here. Temporary audio and rendering dependencies remain under ignored `artifacts/`; they do not affect the web build.

The archived 3D illustration was created with built-in imagegen. Its prompt and references are saved in `docs/assets/claw-syndicate-launch-art.md`. The current diagram and minimal logo are authored vector graphics.

## Validation

The final export was decoded end to end with FFmpeg and inspected at representative frames, including scene transitions and the approved-payment frame. It uses H.264 video with `yuv420p`, AAC stereo audio, and MP4 fast start. Both post drafts fit 280 characters. No files have been pushed and no posts have been published.
