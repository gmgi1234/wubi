const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  console.log('默认侧栏可见:', await page.evaluate(() => !document.getElementById('sidebar').classList.contains('hidden')));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-sidebar.png', clip: { x: 0, y: 0, width: 1200, height: 640 } });
  await page.click('#collapseBtn');
  await page.waitForTimeout(300);
  console.log('收起后侧栏隐藏:', await page.evaluate(() => document.getElementById('sidebar').classList.contains('hidden')));
  await page.waitForTimeout(200);
  await page.click('#openSide');
  await page.waitForTimeout(300);
  console.log('再展开:', await page.evaluate(() => !document.getElementById('sidebar').classList.contains('hidden')));
  console.log('errors:', errs.join(' | ') || 'none');
  await browser.close();
  server.close();
});
