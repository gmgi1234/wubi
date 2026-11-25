// 本地测试单字目录页检索
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/char/`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  for (const q of ['狗', 'gou', 'zhong']) {
    await page.fill('#q', q);
    await page.waitForTimeout(900);
    const st = await page.evaluate(() => ({
      hint: document.getElementById('hint').textContent,
      first: [...document.querySelectorAll('#results a')].slice(0, 6).map((a) => a.textContent),
    }));
    console.log(q, '=>', JSON.stringify(st));
  }
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/char-search.png', clip: { x: 0, y: 0, width: 1000, height: 620 } });
  await browser.close();
  server.close();
});
