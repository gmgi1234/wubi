// Compare the 犭前 fragment glyph with the full 犭 and the third stroke glyph.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const fontData = fs.readFileSync(path.join(BASE, 'qingfeng/WindInput/schemas/xin_shiji_zigen.ttf')).toString('base64');

const items = [
  { label: '犭前 E1CF', text: '\uE1CF', cls: 'pua' },
  { label: '第三笔 E1E0', text: '\uE1E0', cls: 'pua' },
  { label: '完整 犭', text: '犭', cls: '' },
];

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family:'ZiGen'; src:url(data:font/ttf;base64,${fontData}) format('truetype'); }
body{margin:0;background:#fff;font-family:'KaiTi',serif;display:flex;gap:30px;padding:30px;justify-content:center}
.cell{text-align:center}
.big{font-size:200px;line-height:1.1}
.pua{font-family:'ZiGen'}
.lab{font-size:18px;color:#666}
</style></head><body>
${items.map((i) => `<div class="cell"><div class="big ${i.cls}">${i.text}</div><div class="lab">${i.label}</div></div>`).join('')}
</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 340 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = path.join(BASE, 'tools/compare', 'fragment-check.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
