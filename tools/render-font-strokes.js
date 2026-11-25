// Render extracted prototype strokes (from tools/font-strokes/<ch>.json) for visual check.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const chars = process.argv.slice(2);
const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB', '#9B59B6', '#16A085', '#E67E22', '#2C3E50'];

const cells = chars.map((ch) => {
  const data = JSON.parse(fs.readFileSync(path.join(BASE, 'tools', 'font-strokes', `${ch}.json`), 'utf8'));
  const paths = data.strokes.map((d, i) => `<path d="${d}" fill="${PALETTE[i % PALETTE.length]}" stroke="#fff" stroke-width="1"/>`).join('');
  const svg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${paths}</g></svg>`;
  return `<div class="cell">${svg}<div class="lab">${ch} · ${data.strokes.length} 段</div></div>`;
}).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#fff; font-family:'KaiTi',serif; display:flex; }
  .cell { width:${100 / chars.length}%; padding:10px; }
  .cell svg { width:100%; aspect-ratio:1; }
  .lab { text-align:center; font-size:26px; color:#333; }
</style></head><body>${cells}</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 600 * chars.length, height: 700 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const out = path.join(BASE, 'tools', 'compare', 'font-extract.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
