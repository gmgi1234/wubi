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
  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/ci.html?w=${encodeURIComponent('中国')}`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll('h2')].map((x) => x.textContent);
    const slot = document.getElementById('mean-slot');
    return { h2, mean: slot ? slot.textContent.trim().slice(0, 60) : 'no slot' };
  });
  console.log(JSON.stringify(info));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/word-mean.png', clip: { x: 0, y: 300, width: 1000, height: 520 } });
  await browser.close();
  server.close();
});
