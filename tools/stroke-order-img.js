// Render a character with stroke order numbers (for checking split/order by eye).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const ch = process.argv[2] || '迯';
const out = process.argv[3] || path.join(BASE, 'tools', 'compare', `${ch}-order.png`);

const data = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'chars', `${ch}.json`), 'utf8'));
const strokes = data.strokes;
const medians = data.medians;

const svg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${strokes.map((d) => `<path d="${d}" fill="#c9ced6" stroke="#fff" stroke-width="0.8"/>`).join('')}</g></svg>`;

const labels = medians.map((m, i) => {
  const [x, y] = m[Math.floor(m.length / 2)] || m[0];
  const sx = (x / 1024) * 100;
  const sy = ((900 - y) / 1024) * 100;
  const color = i < 5 ? '#c0392b' : '#1f6fb2';
  return `<div class="num" style="left:${sx}%;top:${sy}%;color:${color}">${i + 1}</div>`;
}).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:900px; background:#fff; font-family:'KaiTi',serif; }
  .title { text-align:center; font-size:40px; padding:20px; color:#1f2937; }
  .wrap { position:relative; width:860px; height:860px; margin:0 auto; }
  .wrap svg { width:100%; height:100%; }
  .num { position:absolute; transform:translate(-50%,-50%); font-size:30px; font-weight:700;
         background:#fff; border-radius:50%; width:44px; height:44px; line-height:44px; text-align:center; box-shadow:0 0 0 2px #fff; }
  .legend { text-align:center; font-size:26px; padding:16px; }
  .a { color:#c0392b; } .b { color:#1f6fb2; }
</style></head><body>
  <div class="title">${ch} · 笔顺编号</div>
  <div class="wrap">${svg}${labels}</div>
  <div class="legend"><span class="a">红 1–5 = 外</span>　<span class="b">蓝 6–8 = 辶</span></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
