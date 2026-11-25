// Render extracted stroke polylines (tools/font-strokes/<ch>-v5.json) for visual check.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const chars = process.argv.slice(2);
const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB', '#9B59B6', '#16A085', '#E67E22', '#2C3E50'];

const cells = chars.map((ch) => {
  const data = JSON.parse(fs.readFileSync(path.join(BASE, 'tools', 'font-strokes', `${ch}-v5.json`), 'utf8'));
  const lines = data.polylines.map((pts, i) => {
    const d = pts.map(([x, y]) => `${x},${900 - y}`).join(' ');
    return `<polyline points="${d}" fill="none" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  const svg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/>${lines}</svg>`;
  return `<div class="cell">${svg}<div class="lab">${ch} · ${data.polylines.length} 笔</div></div>`;
}).join('');

const html = `<html><head><meta charset="utf-8"><style>
  body{margin:0;display:flex;background:#fff;font-family:'KaiTi',serif}
  .cell{width:${100 / chars.length}%;padding:10px}
  .cell svg{width:100%;aspect-ratio:1}
  .lab{text-align:center;font-size:24px}
</style></head><body>${cells}</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 480 * chars.length, height: 560 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const out = path.join(BASE, 'tools', 'compare', 'v5-strokes.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
