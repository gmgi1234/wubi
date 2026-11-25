// Visual check: render PUA glyphs with the 字根 font next to their mapped names.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const map = JSON.parse(fs.readFileSync(path.join(BASE, 'tools/root-pua-map.json'), 'utf8'));
const fontPath = path.join(BASE, 'qingfeng/WindInput/schemas/xin_shiji_zigen.ttf');
const fontData = fs.readFileSync(fontPath).toString('base64');

const rows = Object.entries(map)
  .filter(([, v]) => v.confident)
  .slice(0, 40)
  .map(([pua, v]) => `<div class="row"><div class="pua">${pua}</div><div class="name">${v.name}</div><div class="meta">${v.pua} · ${v.votes}/${v.total}</div></div>`)
  .join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'ZiGen'; src: url(data:font/ttf;base64,${fontData}) format('truetype'); }
body { margin:0; font-family:'KaiTi',serif; background:#fff; }
.grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; padding:12px; }
.row { border:1px solid #e3e7ee; border-radius:8px; padding:10px; text-align:center; }
.pua { font-family:'ZiGen'; font-size:52px; line-height:1.2; color:#1f2937; }
.name { font-size:34px; line-height:1.3; color:#c0392b; }
.meta { font-size:12px; color:#8a929e; font-family:sans-serif; }
</style></head><body><div class="grid">${rows}</div></body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = path.join(BASE, 'tools/compare/pua-check.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
