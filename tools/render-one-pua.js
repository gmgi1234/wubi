// Render one PUA glyph large, next to the character it is supposed to represent.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const pua = process.argv[2] || '\uE1CF';
const sample = process.argv[3] || '犭';
const fontData = fs.readFileSync(path.join(BASE, 'qingfeng/WindInput/schemas/xin_shiji_zigen.ttf')).toString('base64');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family:'ZiGen'; src:url(data:font/ttf;base64,${fontData}) format('truetype'); }
body{margin:0;background:#fff;font-family:'KaiTi',serif}
.row{display:flex;gap:40px;padding:30px;align-items:center;justify-content:center}
.cell{text-align:center}
.big{font-size:240px;line-height:1.1}
.pua{font-family:'ZiGen'}
.lab{font-size:20px;color:#666;margin-top:8px}
</style></head><body>
<div class="row">
  <div class="cell"><div class="big pua">${pua}</div><div class="lab">PUA 字形 U+${pua.codePointAt(0).toString(16).toUpperCase()}</div></div>
  <div class="cell"><div class="big">${sample}</div><div class="lab">${sample}</div></div>
  <div class="cell"><div class="big">丿</div><div class="lab">第一笔 撇</div></div>
  <div class="cell"><div class="big">弯</div><div class="lab">第二笔 弯钩</div></div>
</div>
</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 420 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = path.join(BASE, 'tools/compare', 'pua-single.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
