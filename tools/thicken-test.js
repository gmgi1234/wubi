// Test: thicken strokes by giving each path a same-colour stroke outline.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const ch = process.argv[2] || '馺';
const width = Number(process.argv[3] || 6);
const out = path.join(ROOT, 'tools', 'compare', `${ch}-thick.png`);

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
  const svg = await page.evaluate(async ({ c, w }) => {
    await loadAndRender(c);
    const el = document.querySelector('#char-svg').cloneNode(true);
    el.querySelectorAll('path').forEach((p) => {
      const fill = p.getAttribute('fill');
      if (fill) {
        p.setAttribute('stroke', fill);
        p.setAttribute('stroke-width', String(w));
        p.setAttribute('stroke-linejoin', 'round');
      }
    });
    return el.outerHTML;
  }, { c: ch, w: width });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#fff; font-family:'KaiTi',serif; }
    .panel { padding:20px 40px; } .panel svg { width:900px; height:900px; display:block; margin:0 auto; }
    .kai { font-size:780px; line-height:900px; text-align:center; }
    .lab { font-size:30px; color:#666; text-align:center; } .title { font-size:44px; text-align:center; padding:20px; }
  </style></head><body>
    <div class="title">${ch} · 加 ${width}px 描边</div>
    <div class="panel">${svg}<div class="lab">调整后 + 描边</div></div>
    <div class="panel"><div class="kai">${ch}</div><div class="lab">楷体</div></div>
  </body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
  server.close();
});
