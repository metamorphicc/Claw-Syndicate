import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { createCanvas, GlobalFonts, Path2D, SvgExportFlag } = require(process.env.CANVAS_MODULE || '@napi-rs/canvas');
const root = fileURLToPath(new URL('../', import.meta.url));
const C = { bg: '#040506', surface: '#07080a', line: '#24262a', white: '#ffffff', muted: '#9c9c9d', coral: '#ff6363' };
GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'), 'Claw Inter');
GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'), 'Claw Mono');

const mark = new Path2D('M14 14v19l18 15 18-15V14M32 14v34');
function drawMark(c, x, y, size, color = C.coral) {
  c.save(); c.translate(x, y); c.scale(size / 64, size / 64);
  c.strokeStyle = color; c.lineWidth = 7.5; c.lineJoin = 'round'; c.lineCap = 'butt';
  c.stroke(mark); c.restore();
}
function drawAvatar(c) {
  c.fillStyle = C.bg; c.fillRect(0, 0, 1024, 1024);
  drawMark(c, 160, 160, 704);
}
await fs.mkdir(path.join(root, 'public/brand'), { recursive: true });
await fs.mkdir(path.join(root, 'public/social'), { recursive: true });
const avatar = createCanvas(1024, 1024);
drawAvatar(avatar.getContext('2d'));
await fs.writeFile(path.join(root, 'public/social/claw-syndicate-avatar-minimal.png'), avatar.toBuffer('image/png'));
const transparent = createCanvas(1024, 1024);
drawMark(transparent.getContext('2d'), 0, 0, 1024);
await fs.writeFile(path.join(root, 'public/brand/claw-mark.png'), transparent.toBuffer('image/png'));

// Small-size and circular-crop review stays outside the delivered assets.
await fs.mkdir(path.join(root, 'artifacts'), { recursive: true });
const review = createCanvas(1000, 420), rc = review.getContext('2d');
rc.fillStyle = C.bg; rc.fillRect(0, 0, 1000, 420);
rc.drawImage(avatar, 32, 32, 356, 356);
for (const [i, size] of [128, 64, 32, 24].entries()) {
  const x = 460 + i * 125, y = 190 - size / 2;
  rc.save(); rc.beginPath(); rc.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); rc.clip();
  rc.drawImage(avatar, x, y, size, size); rc.restore();
}
await fs.writeFile(path.join(root, 'artifacts/minimal-logo-review.png'), review.toBuffer('image/png'));
console.log('Saved minimal avatar PNG/SVG and transparent mark PNG/SVG.');
