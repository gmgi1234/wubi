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
  for (const [w, name] of [['王八', 'twobox-wangba'], ['北京人', 'twobox-beijingren']]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${port}/ci.html?w=${encodeURIComponent(w)}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const n = await page.evaluate(() => document.querySelectorAll('.brow')[0].querySelectorAll('svg.glyph, svg').length);
    console.log(w, '| 第一行 svg 数:', n);
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, clip: { x: 0, y: 120, width: 1000, height: 380 } });
    await page.close();
  }
  await browser.close();
  server.close();
});
