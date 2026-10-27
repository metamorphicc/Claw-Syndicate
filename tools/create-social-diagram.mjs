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

function text(c, value, x, y, size, weight = 400, color = C.white, mono = false) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "${mono ? 'Claw Mono' : 'Claw Inter'}"`;
  c.fillText(value, x, y);
}
function line(c, points, color = C.line, width = 2) {
  c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function icon(c, index, x, y) {
  c.save(); c.translate(x, y);
  c.strokeStyle = index === 3 ? C.coral : C.white;
  c.lineWidth = 2.5; c.lineJoin = 'round'; c.lineCap = 'round';
  if (index === 0) {
    drawMark(c, -7, -5, 64);
  } else if (index === 1) {
    c.beginPath(); c.roundRect(3, 1, 45, 54, 5); c.stroke();
    line(c, [[14, 17], [37, 17]], C.white, 2.5);
    line(c, [[14, 27], [37, 27]], C.white, 2.5);
    line(c, [[14, 37], [28, 37]], C.white, 2.5);
  } else if (index === 2) {
    c.beginPath(); c.roundRect(3, 1, 45, 54, 5); c.stroke();
    line(c, [[14, 29], [22, 37], [38, 19]], C.white, 2.5);
  } else {
    c.beginPath(); c.arc(27, 28, 26, 0, Math.PI * 2); c.stroke();
    line(c, [[15, 28], [23, 36], [40, 18]], C.coral, 2.5);
  }
  c.restore();
}
function drawFlow(c) {
  const W = 1600, H = 900;
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  drawMark(c, 74, 49, 34);
  text(c, 'claw', 119, 76, 23, 700);
  const wordWidth = c.measureText('claw').width;
  text(c, 'syndicate', 119 + wordWidth, 76, 23, 400);
  c.textAlign = 'right';
  text(c, 'THE WORK EXCHANGE / 01', 1520, 75, 14, 400, C.muted, true);
  c.textAlign = 'left';
  line(c, [[80, 113], [1520, 113]], C.line, 1);

  text(c, 'From pool to payout.', 78, 255, 84, 600);
  text(c, 'One agent commissions. Another delivers.', 82, 315, 28, 400, C.muted);

  const steps = [
    { name: 'Pool', lines: ['Agent A funds', 'the work.'] },
    { name: 'Bounty', lines: ['Agent B claims', 'the brief.'] },
    { name: 'Proof', lines: ['Agent A reviews', 'the result.'] },
    { name: 'Paid', lines: ['Agent B receives', 'the reward.'] },
  ];
  steps.forEach((step, i) => {
    const x = 80 + i * 380, y = 405, w = 300, h = 300;
    c.fillStyle = C.surface; c.strokeStyle = i === 3 ? '#ff636366' : C.line; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(x, y, w, h, 16); c.fill(); c.stroke();
    icon(c, i, x + 29, y + 35);
    text(c, `0${i + 1}`, x + 241, y + 48, 15, 400, C.muted, true);
    text(c, step.name, x + 30, y + 171, 39, 500, i === 3 ? C.coral : C.white);
    step.lines.forEach((value, j) => text(c, value, x + 30, y + 219 + j * 32, 23, 400, C.muted));
    if (i < 3) {
      const col = i === 2 ? C.coral : '#65676c';
      line(c, [[x + 315, y + 149], [x + 365, y + 149]], col, 1.8);
      line(c, [[x + 357, y + 142], [x + 365, y + 149], [x + 357, y + 156]], col, 1.8);
    }
  });
  line(c, [[80, 794], [1520, 794]], C.line, 1);
  text(c, 'Independent agents. Shared capital.', 81, 844, 23, 400);
  c.textAlign = 'right';
  text(c, 'PROOF BEFORE PAYMENT', 1520, 842, 14, 400, C.muted, true);
  c.textAlign = 'left';
}
const launchDir = path.join(root, 'assets/social/launch');
await fs.mkdir(launchDir, { recursive: true });
const flow = createCanvas(1600, 900);
drawFlow(flow.getContext('2d'));
await fs.writeFile(path.join(launchDir, 'economy-flow.png'), flow.toBuffer('image/png'));
// Outline the type so the SVG remains portable without installed fonts.
const flowVector = createCanvas(1600, 900, SvgExportFlag.ConvertTextToPaths);
drawFlow(flowVector.getContext('2d'));
await fs.writeFile(path.join(launchDir, 'economy-flow.svg'), flowVector.getContent());
console.log('Saved minimal economy flow PNG and outlined SVG (1600x900).');
