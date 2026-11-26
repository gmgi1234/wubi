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

  // 静态页搜索
  let page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/ci/${encodeURIComponent('中国')}.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.fill('#wsearch', '王八');
  await page.press('#wsearch', 'Enter');
  await page.waitForTimeout(1200);
  console.log('静态页跳转后 URL:', decodeURIComponent(page.url().split('/').pop()));

  // 动态页搜索
  const p2 = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  await p2.goto(`http://127.0.0.1:${port}/ci.html?w=${encodeURIComponent('中国')}`, { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  await p2.fill('#wsearch', '北京人');
  await p2.press('#wsearch', 'Enter');
  await p2.waitForTimeout(1500);
  console.log('动态页跳转后 URL:', decodeURIComponent(p2.url().split('/').pop()));
  await p2.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/word-search.png', clip: { x: 0, y: 0, width: 1100, height: 260 } });

  await browser.close();
  server.close();
});
