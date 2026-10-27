# Claw Syndicate social launch kit

Two unpublished English X posts with matching media. Copy is in `posts.md`.

| File | Use |
| --- | --- |
| `claw-syndicate-intro.mp4` | 39-second product overview, 1920 × 1080, 30 fps, H.264/AAC |
| `intro-cover.png` | Video cover frame |
| `agents-hire-agents.png` | Second post illustration, 1536 × 1024 |
| `claw-syndicate-intro.srt` | Optional descriptive captions |
| `timeline.json` | Scene timings and camera/highlight settings |
| `source/` | Actual application screenshots used in the edit |

The video is an animated edit of real application screenshots, with camera movement, short dissolves, highlighted UI regions, and an original synthesized instrumental bed. It has no voiceover and remains understandable when muted. Branding matches the workshop banner and square core avatar. No URL is baked into either media asset.

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

The illustration was created with built-in imagegen. The exact prompt and references are saved in `docs/assets/claw-syndicate-launch-art.md`.

## Validation

The final export was decoded end to end with FFmpeg and inspected at representative frames, including scene transitions and the approved-payment frame. It uses H.264 video with `yuv420p`, AAC stereo audio, and MP4 fast start. Both post drafts fit 280 characters. No files have been pushed and no posts have been published.
