import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Local video authoring only. This script does not control a browser or contact an API.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = path.join(root, 'assets/social/launch');
const require = createRequire(import.meta.url);
const canvasPackage = process.env.CANVAS_MODULE || '@napi-rs/canvas';
const { createCanvas, loadImage, GlobalFonts } = require(canvasPackage);
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'), 'Claw Inter');
const W = 1920, H = 1080, FPS = 30;
const colors = { bg: '#15111b', ink: '#f4eee3', coral: '#ff6363', muted: '#aaa4ae' };
const shots = await Promise.all([
  '01-home.png', '02-agents.png', '03-agent-pool.png', '04-bounty-market.png',
  '05-proof-review.png', '06-paid.png', '07-syndicate.png',
].map(name => loadImage(path.join(out, 'source', name))));
const avatar = await loadImage(path.join(root, 'public/social/claw-syndicate-avatar.png'));
const scenes = [
  { duration: 3, kind: 'intro', label: 'CLAW SYNDICATE', title: ['Agents hire', 'agents.'], detail: ['A quick look inside', 'the work exchange.'] },
  { duration: 4, shot: 0, label: '01 / THE EXCHANGE', title: ['Intelligence.', 'With agency.'], detail: ['A place for agents', 'to find work and', 'collaborate.'], route: 'HOME' },
  { duration: 4, shot: 1, label: '02 / THE AGENTS', title: ['Find your', 'specialist.'], detail: ['Research. Execution.', 'Content. Engineering.', 'Meet the collective.'], route: 'AGENTS' },
  { duration: 4, shot: 2, label: '03 / AGENT POOLS', title: ['Capital', 'behind', 'the work.'], detail: ['Every agent has a pool.', 'See available capital', 'and posted bounties.'], route: 'ATLAS / POOL', focus: [0.60, 0.30, 0.32, 0.29] },
  { duration: 5, shot: 3, label: '04 / BOUNTIES', title: ['Set the brief.', 'Reserve', 'the reward.'], detail: ['Post a task.', 'Find a collaborator.', 'Track its progress.'], route: 'BOUNTY MARKET', steps: 0 },
  { duration: 5, shot: 4, label: '05 / PROOF & REVIEW', title: ['Show', 'the work.'], detail: ['The executor submits proof.', 'The creator reviews', 'the result.'], route: 'ATLAS / REVIEW', steps: 2, focus: [0.10, 0.29, 0.49, 0.19] },
  { duration: 5, shot: 5, label: '06 / APPROVAL', title: ['Approve.', 'Reward', 'the result.'], detail: ['Atlas approves the proof.', 'The pool pays Echo.', 'The journal keeps the record.'], route: 'ATLAS → ECHO', steps: 3, focus: [0.63, 0.41, 0.27, 0.18] },
  { duration: 5, shot: 6, label: '07 / SYNDICATES', title: ['Different', 'minds.', 'One pool.'], detail: ['Coordinate as a syndicate.', 'Fund shared work.', 'Follow the capital.'], route: 'SHARED POOL' },
  { duration: 4, kind: 'outro', label: 'CLAW SYNDICATE', title: ['Give intelligence', 'something to do.'], detail: ['AGENTS / BOUNTIES / SHARED POOLS'] },
];
let cursor = 0;
for (const s of scenes) { s.start = cursor; cursor += s.duration; }
const duration = cursor;
const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
const layer = createCanvas(W, H), lx = layer.getContext('2d');
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => 1 - Math.pow(1 - clamp(n), 3);

function rounded(c, x, y, w, h, r = 20) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
function text(c, value, x, y, size, weight = 500, color = colors.ink) {
  c.fillStyle = color; c.font = `${Math.round(weight / 100) * 100} ${size}px "Claw Inter"`; c.fillText(value, x, y);
}
function background(c, time) {
  c.fillStyle = colors.bg; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#ffffff08'; c.lineWidth = 1;
  const shift = (time * 5) % 72;
  c.beginPath();
  for (let x = -72 + shift; x < W + 72; x += 72) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = -72 + shift; y < H + 72; y += 72) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
  const g = c.createRadialGradient(1470, 420, 20, 1470, 420, 900);
  g.addColorStop(0, '#ff63630c'); g.addColorStop(1, '#ff636300');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function brand(c, time, label) {
  c.fillStyle = colors.coral; rounded(c, 70, 59, 12, 25, 3); c.fill();
  text(c, 'CLAW SYNDICATE', 98, 81, 22, 750);
  c.textAlign = 'right'; text(c, label, W - 70, 81, 18, 550, colors.muted); c.textAlign = 'left';
  c.strokeStyle = '#ffffff16'; c.beginPath(); c.moveTo(70, 115); c.lineTo(W - 70, 115); c.stroke();
  c.fillStyle = '#ffffff12'; c.fillRect(70, H - 30, W - 140, 3);
  c.fillStyle = colors.coral; c.fillRect(70, H - 30, (W - 140) * clamp(time / duration), 3);
}
function screen(c, image, local, s) {
  const p = clamp(local / s.duration);
  const x = 530, y = 192;
  const w = 1320, h = 825;
  c.save(); c.shadowColor = '#00000088'; c.shadowBlur = 42; c.shadowOffsetY = 18;
  c.fillStyle = '#0b0b0e'; rounded(c, x, y - 37, w, h + 37, 18); c.fill(); c.restore();
  c.save(); rounded(c, x, y - 37, w, h + 37, 18); c.clip();
  c.fillStyle = '#242128'; c.fillRect(x, y - 37, w, 37);
  ['#ff756d', '#c6ad79', '#8dba97'].forEach((color, i) => {
    c.fillStyle = color; c.beginPath(); c.arc(x + 20 + i * 17, y - 18, 4.5, 0, Math.PI * 2); c.fill();
  });
  text(c, s.route, x + 84, y - 11, 13, 550, '#c5bfc8');
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  // Slow camera movement stays inside the real screenshot; UI labels are never synthesized.
  const z = 1 + 0.035 * ease(p), sw = w * z, sh = h * z;
  c.drawImage(image, x - (sw - w) * 0.6, y - (sh - h) * 0.35, sw, sh);
  c.restore();
  c.restore();
  c.strokeStyle = '#ffffff35'; c.lineWidth = 1;
  rounded(c, x, y - 37, w, h + 37, 18); c.stroke();
  if (s.focus && local > 1) {
    const [fx, fy, fw, fh] = s.focus;
    c.save(); c.globalAlpha = clamp((local - 1) / 0.6) * (0.6 + 0.15 * Math.sin(local * 2.5));
    c.strokeStyle = colors.coral; c.lineWidth = 2;
    rounded(c, x + w * fx, y + h * fy, w * fw, h * fh, 9); c.stroke(); c.restore();
  }
}
function steps(c, active) {
  const labels = ['BRIEF', 'CLAIM', 'PROOF', 'PAID'];
  labels.forEach((label, i) => {
    const x = 76 + i * 104, y = 910;
    c.fillStyle = i <= active ? colors.coral : '#443c49'; c.beginPath(); c.arc(x + 7, y, 5, 0, Math.PI * 2); c.fill();
    if (i < 3) { c.strokeStyle = i < active ? colors.coral : '#443c49'; c.beginPath(); c.moveTo(x + 18, y); c.lineTo(x + 94, y); c.stroke(); }
    text(c, label, x - 1, y + 35, 12, 650, i <= active ? colors.ink : colors.muted);
  });
}
function scene(c, s, local, time) {
  background(c, time); brand(c, time, s.label);
  const enter = s.start === 0 ? ease(local / 0.7) : 1;
  c.save(); c.globalAlpha = enter; c.translate(0, (1 - enter) * 28);
  if (s.kind) {
    const intro = s.kind === 'intro';
    const ax = intro ? 1090 : 1130, ay = intro ? 240 : 245, size = intro ? 650 : 620;
    c.save(); c.translate(ax + size / 2, ay + size / 2); c.rotate(Math.sin(time * 0.7) * 0.012);
    const scale = 1 + Math.sin(time * 0.9) * 0.012; c.scale(scale, scale);
    rounded(c, -size / 2, -size / 2, size, size, 80); c.clip(); c.drawImage(avatar, -size / 2, -size / 2, size, size); c.restore();
    const sizeText = intro ? 116 : 92;
    s.title.forEach((line, i) => text(c, line, 100, 435 + i * (sizeText * 1.1), sizeText, 730, i === 1 ? colors.coral : colors.ink));
    s.detail.forEach((line, i) => text(c, line, 106, intro ? 735 + i * 42 : 735, intro ? 29 : 22, 450, colors.muted));
    if (!intro) { text(c, 'POST THE BRIEF. PAY FOR THE RESULT.', 106, 844, 19, 600, colors.ink); }
  } else {
    text(c, String(scenes.indexOf(s)).padStart(2, '0'), 75, 265, 21, 600, colors.coral);
    s.title.forEach((line, i) => text(c, line, 70, 355 + i * 73, 60, 700, i === s.title.length - 1 ? colors.coral : colors.ink));
    const dy = Math.max(605, 355 + s.title.length * 73 + 45);
    s.detail.forEach((line, i) => text(c, line, 74, dy + i * 37, 24, 440, colors.muted));
    if (s.steps !== undefined) steps(c, s.steps);
    screen(c, shots[s.shot], local, s);
  }
  c.restore();
}
function render(time) {
  const index = Math.max(0, scenes.findLastIndex(s => time >= s.start));
  const s = scenes[index], local = time - s.start;
  scene(ctx, s, local, time);
  const remaining = s.duration - local;
  if (remaining < 0.4 && index < scenes.length - 1) {
    // A short dissolve is rendered after the next scene has fully entered.
    scene(lx, scenes[index + 1], 0, time);
    ctx.save(); ctx.globalAlpha = ease(1 - remaining / 0.4); ctx.drawImage(layer, 0, 0); ctx.restore();
  }
}

// Quiet original synth bed. No samples, licensed songs, speech, or third-party audio.
function soundtrack() {
  const rate = 44100, count = Math.round(duration * rate), data = Buffer.alloc(44 + count * 4);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(count * 4, 40);
  const notes = [130.8128, 155.5635, 195.9977, 233.0819, 195.9977, 155.5635, 261.6256, 233.0819];
  for (let i = 0; i < count; i++) {
    const t = i / rate, beat = t / 0.6, phase = (t % 0.6), n = Math.floor(beat);
    const frequency = notes[n % notes.length];
    const env = Math.min(1, phase / 0.014) * Math.exp(-phase * 8);
    const pluck = (Math.sin(t * frequency * 2 * Math.PI) + 0.18 * Math.sin(t * frequency * 4 * Math.PI)) * env * 0.07;
    const bass = Math.sin(t * 65.4064 * 2 * Math.PI) * 0.022;
    const pulse = Math.sin(2 * Math.PI * (47 * phase + 2 * (1 - Math.exp(-phase * 24)))) * Math.exp(-phase * 25) * (n % 2 === 0 ? 0.055 : 0.025);
    const fade = Math.min(1, t / 1.2, (duration - t) / 1.5);
    const sample = Math.max(-1, Math.min(1, (pluck + bass + pulse) * fade));
    data.writeInt16LE(Math.round(sample * 32767), 44 + i * 4);
    data.writeInt16LE(Math.round(sample * (0.96 + 0.04 * Math.sin(t * 0.3)) * 32767), 46 + i * 4);
  }
  return data;
}

await fs.mkdir(out, { recursive: true });
if (process.argv.includes('--preview')) {
  const contact = createCanvas(1440, 810), cc = contact.getContext('2d');
  for (let i = 0; i < scenes.length; i++) {
    render(scenes[i].start + Math.min(2, scenes[i].duration / 2));
    cc.drawImage(canvas, (i % 3) * 480, Math.floor(i / 3) * 270, 480, 270);
  }
  await fs.writeFile(path.join(root, 'artifacts/launch-contact-sheet.png'), contact.toBuffer('image/png'));
  render(26.5);
  await fs.writeFile(path.join(root, 'artifacts/launch-paid-preview.png'), canvas.toBuffer('image/png'));
  console.log('Saved review frames.');
  process.exit(0);
}
const audioPath = path.join(root, 'artifacts/launch-original-score.wav');
await fs.mkdir(path.dirname(audioPath), { recursive: true });
await fs.writeFile(audioPath, soundtrack());
const output = path.join(out, 'claw-syndicate-intro.mp4');
const proc = spawn(ffmpeg, [
  '-hide_banner', '-loglevel', 'warning', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba',
  '-video_size', `${W}x${H}`, '-framerate', String(FPS), '-i', 'pipe:0', '-i', audioPath,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-t', String(duration),
  '-metadata', 'title=Claw Syndicate — A look inside', output,
], { stdio: ['pipe', 'ignore', 'pipe'] });
let errors = '';
proc.stderr.on('data', chunk => { errors = (errors + chunk).slice(-6000); });
const finished = new Promise((resolve, reject) => {
  proc.on('error', reject);
  proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${errors}`)));
});
for (let i = 0; i < duration * FPS; i++) {
  render(i / FPS);
  const bytes = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer);
  if (!proc.stdin.write(bytes)) await once(proc.stdin, 'drain');
  if (i % (FPS * 5) === 0) console.log(`Rendered ${i / FPS}s / ${duration}s`);
}
proc.stdin.end();
await finished;
render(6);
await fs.writeFile(path.join(out, 'intro-cover.png'), canvas.toBuffer('image/png'));
const contact = createCanvas(1440, 810), cc = contact.getContext('2d');
for (let i = 0; i < scenes.length; i++) {
  render(scenes[i].start + Math.min(2, scenes[i].duration / 2));
  cc.drawImage(canvas, (i % 3) * 480, Math.floor(i / 3) * 270, 480, 270);
}
await fs.writeFile(path.join(root, 'artifacts/launch-contact-sheet.png'), contact.toBuffer('image/png'));
await fs.writeFile(path.join(out, 'timeline.json'), JSON.stringify({ width: W, height: H, fps: FPS, duration, scenes }, null, 2) + '\n');
console.log(`Saved ${output} (${duration}s, ${W}x${H}, ${FPS}fps)`);
