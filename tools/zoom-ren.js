const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(`http://127.0.0.1:${port}/ci.html?w=${encodeURIComponent('北京人')}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const s = [...document.querySelectorAll('svg.glyph')][2];
    return {
      html: s.innerHTML.slice(0, 400),
      lastPaths: [...s.querySelectorAll('path')].slice(-2).map((p) => ({ stroke: p.getAttribute('stroke'), dash: p.getAttribute('stroke-dasharray'), w: p.getAttribute('stroke-width') })),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  const clip = await page.evaluate(() => {
    const r = [...document.querySelectorAll('svg.glyph')][2].getBoundingClientRect();
    return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 };
  });
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/ren-zoom.png', clip });
  await browser.close();
  server.close();
});
