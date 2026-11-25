// Side-by-side comparison: current stroke data vs 楷体 reference, for a list of chars.
// Usage: node compare-glyphs.js 陈 做 想 ...  -> tools/compare/glyph-compare.png
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const OUT = path.join(ROOT, 'tools', 'compare');
fs.mkdirSync(OUT, { recursive: true });
const chars = process.argv.slice(2);
if (!chars.length) { console.error('give chars'); process.exit(1); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const svgs = {};
  for (const ch of chars) {
    svgs[ch] = await page.evaluate(async (c) => {
      await loadAndRender(c);
      const el = document.querySelector('#char-svg');
      return el ? el.outerHTML : null;
    }, ch);
  }

  const cell = (ch, html) => `<div class="cell"><div class="art">${html || ''}</div><div class="lab">${ch}</div></div>`;
  const rows = chars.map((ch) => `<div class="row">
      ${cell(ch + ' 数据', svgs[ch])}
      ${cell(ch + ' 楷体', `<div class="kai">${ch}</div>`)}
    </div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#fff; font-family:'KaiTi','楷体',serif; }
    .grid { display:grid; grid-template-columns: repeat(2, 1fr); }
    .row { display:flex; border-bottom:1px solid #eee; }
    .cell { width:50%; padding:10px; }
    .art { width:300px; height:300px; }
    .art svg { width:100%; height:100%; }
    .kai { width:300px; height:300px; display:flex; align-items:center; justify-content:center; font-size:300px; line-height:0.72; }
    .lab { font-size:14px; color:#666; }
  </style></head><body><div class="grid">${rows}</div></body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const el = await page.$('.grid');
  await el.screenshot({ path: path.join(OUT, 'glyph-compare.png') });
  console.log('saved', path.join(OUT, 'glyph-compare.png'));
  await browser.close();
  server.close();
});
