// Demo: re-create the "squashed" auto-fit result for one char (targets measured by fit4.py)
// and render 原数据 / 压扁 / 楷体 three panels.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const JOBS = {
  '麡': { targets: [[117, 166, 369, 922], [369, 95, 911, 918]], ranges: [[0, 11], [11, 25]] },
  '鶧': { targets: [[123, 148, 538, 826], [538, 117, 908, 899]], ranges: [[0, 8], [8, 19]] },
};

function bbox(medians, s, e) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (let i = s; i < e; i += 1) for (const [x, y] of medians[i]) {
    x1 = Math.min(x1, x); x2 = Math.max(x2, x);
    const yy = 900 - y; y1 = Math.min(y1, yy); y2 = Math.max(y2, yy);
  }
  return [x1, y1, x2, y2];
}

function transform(path, fn) {
  const out = [];
  const tokens = path.match(/[MQLCZ]|-?\d+(?:\.\d+)?/g) || [];
  let buf = [];
  for (const t of tokens) {
    if (/[A-Z]/.test(t)) { out.push(t); buf = []; continue; }
    buf.push(parseFloat(t));
    if (buf.length === 2) {
      const [x, y] = fn(buf[0], buf[1]);
      out.push(x.toFixed(1), y.toFixed(1));
      buf = [];
    }
  }
  return out.join(' ');
}

const panels = [];
for (const [ch, job] of Object.entries(JOBS)) {
  const d = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'chars', `${ch}.json`), 'utf8'));
  const strokes = [...d.strokes];
  const medians = [...d.medians];
  job.ranges.forEach(([s, e], i) => {
    const [tx1, ty1, tx2, ty2] = job.targets[i];
    const [x1, y1, x2, y2] = bbox(d.medians, s, e);
    const sx = (tx2 - tx1) / Math.max(1, x2 - x1);
    const sy = (ty2 - ty1) / Math.max(1, y2 - y1);
    const fn = (x, y) => {
      const yi = 900 - y;
      return [tx1 + (x - x1) * sx, 900 - (ty1 + (yi - y1) * sy)];
    };
    for (let k = s; k < e; k += 1) {
      strokes[k] = transform(d.strokes[k], fn);
      medians[k] = d.medians[k].map(([x, y]) => fn(x, y));
    }
  });
  panels.push({ ch, orig: d.strokes, fitted: strokes });
}

const svg = (strokes, color) => `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${strokes.map((p) => `<path d="${p}" fill="${color}" stroke="#fff" stroke-width="0.8"/>`).join('')}</g></svg>`;

const rows = panels.map(({ ch, orig, fitted }) => `<div class="row">
  <div class="cell">${svg(orig, '#9aa4b2')}<div class="lab">${ch} 原数据</div></div>
  <div class="cell">${svg(fitted, '#1f2937')}<div class="lab">${ch} 自动拟合后（压扁）</div></div>
  <div class="cell"><div class="kai">${ch}</div><div class="lab">${ch} 楷体</div></div>
</div>`).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#fff; font-family:'KaiTi',serif; }
  .row { display:flex; border-bottom:1px solid #eee; }
  .cell { width:33.3%; padding:8px; }
  .cell svg { width:100%; aspect-ratio:1; }
  .kai { font-size:280px; line-height:360px; text-align:center; height:360px; }
  .lab { text-align:center; font-size:22px; color:#444; }
</style></head><body>${rows}</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = path.join(BASE, 'tools', 'compare', 'squash-demo.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
