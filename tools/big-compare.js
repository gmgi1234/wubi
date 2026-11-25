// Big vertical comparison for phone viewing: fitted glyph over KaiTi reference.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const ch = process.argv[2] || '馺';
const out = process.argv[3] || path.join(ROOT, 'tools', 'compare', `${ch}-big.png`);

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
  const page = await browser.newPage({ viewport: { width: 1080, height: 2000 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  const svg = await page.evaluate(async (c) => {
    await loadAndRender(c);
    return document.querySelector('#char-svg').outerHTML;
  }, ch);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:1080px; background:#fff; font-family:'KaiTi','楷体',serif; color:#1f2930; }
    .panel { padding: 30px 40px; }
    .panel svg { width: 900px; height: 900px; display:block; margin: 0 auto; }
    .kai { font-size: 780px; line-height: 900px; text-align:center; height: 900px; }
    .lab { font-size: 34px; color:#5b6472; text-align:center; margin-top: 10px; }
    .title { font-size: 52px; text-align:center; padding: 30px 0 10px; letter-spacing: 8px; }
  </style></head><body>
    <div class="title">${ch} · 调整后 / 楷体对照</div>
    <div class="panel">${svg}<div class="lab">调整后（页面实际渲染）</div></div>
    <div class="panel"><div class="kai">${ch}</div><div class="lab">楷体参考</div></div>
  </body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
  server.close();
});
