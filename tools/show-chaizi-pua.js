// Show the chaizi PUA sequence for a character and render each glyph with the font.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const CHAIZI = path.join(BASE, 'qingfeng/WindInput/schemas/wubi06_chaizi_pua.txt');
const fontData = fs.readFileSync(path.join(BASE, 'qingfeng/WindInput/schemas/xin_shiji_zigen.ttf')).toString('base64');

const targets = ['狗', '猫', '狼'];
const rows = [];

for (const line of fs.readFileSync(CHAIZI, 'utf8').split('\n')) {
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const ch = parts[0];
  if (!targets.includes(ch)) continue;
  const roots = [...parts[1].replace(/\s+/g, '')];
  rows.push({ ch, code: parts[2], roots });
}

const cells = rows.map(({ ch, code, roots }) => `
  <div class="row">
    <div class="src">${ch}<span class="code">${code}</span></div>
    <div class="glyphs">
      ${roots.map((r, i) => `<div class="cell"><div class="big">${r}</div><div class="meta">第${i + 1}根 U+${r.codePointAt(0).toString(16).toUpperCase()}</div></div>`).join('')}
    </div>
  </div>`).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family:'ZiGen'; src:url(data:font/ttf;base64,${fontData}) format('truetype'); }
body{margin:0;background:#fff;font-family:'KaiTi',serif}
.row{display:flex;align-items:center;gap:24px;padding:14px 20px;border-bottom:1px solid #eee}
.src{font-size:64px;width:120px}
.code{font-size:16px;color:#888;display:block;font-family:monospace}
.glyphs{display:flex;gap:18px}
.cell{text-align:center}
.big{font-family:'ZiGen';font-size:84px;line-height:1.1}
.meta{font-size:12px;color:#777;font-family:monospace}
</style></head><body>${cells}</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 420 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = path.join(BASE, 'tools/compare', 'chaizi-pua-dog.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  for (const r of rows) console.log(r.ch, r.code, r.roots.map((x) => 'U+' + x.codePointAt(0).toString(16).toUpperCase()).join(' '));
  await browser.close();
})();
