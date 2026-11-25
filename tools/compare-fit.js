// Render old vs fitted vs KaiTi for fitted characters.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const chars = process.argv.slice(2);
if (!chars.length) process.exit(1);

function svgFor(data, color) {
  const paths = data.strokes
    .map((d) => `<path d="${d.replace(/"/g, '')}" fill="${color}" stroke="#fff" stroke-width="0.6"/>`)
    .join('');
  return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${paths}</g></svg>`;
}

const rows = chars.map((ch) => {
  const orig = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'chars', `${ch}.json`), 'utf8'));
  let fit = null;
  try { fit = JSON.parse(fs.readFileSync(path.join(BASE, 'tools', 'fit', `${ch}.json`), 'utf8')); } catch {}
  return `<div class="row">
    <div class="cell"><div class="art">${svgFor(orig, '#5b6472')}</div><div class="lab">${ch} 原数据</div></div>
    <div class="cell"><div class="art">${fit ? svgFor(fit, '#1f2937') : ''}</div><div class="lab">${ch} 调整后</div></div>
    <div class="cell"><div class="art kai">${ch}</div><div class="lab">${ch} 楷体</div></div>
  </div>`;
}).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#fff; font-family:'KaiTi','楷体',serif; }
  .row { display:flex; gap:8px; padding:8px; border-bottom:1px solid #eee; }
  .cell { width: 32%; }
  .art { width:100%; aspect-ratio:1; }
  .art svg { width:100%; height:100%; }
  .art.kai { display:flex; align-items:center; justify-content:center; font-size:280px; line-height:0; }
  .lab { font-size:13px; color:#666; text-align:center; }
</style></head><body>${rows}</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = path.join(BASE, 'tools', 'compare', 'fit-compare.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
