// 本地测试词组目录页的分类标签与检索
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/ci/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  console.log('初始:', await page.evaluate(() => document.getElementById('hint').textContent));

  await page.click('.tabs button[data-n="3"]');
  await page.waitForTimeout(1500);
  console.log('三字:', await page.evaluate(() => document.getElementById('hint').textContent));

  await page.click('.tabs button[data-n="5"]');
  await page.waitForTimeout(1500);
  console.log('五字:', await page.evaluate(() => document.getElementById('hint').textContent));

  await page.fill('#q', '良莠');
  await page.waitForTimeout(1500);
  console.log('检索:', await page.evaluate(() => document.getElementById('hint').textContent + ' | ' + [...document.querySelectorAll('#results a')].slice(0, 3).map((a) => a.textContent).join(',')));

  await page.click('.tabs button[data-n="2"]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/ci-tabs.png', clip: { x: 0, y: 0, width: 1000, height: 700 } });
  await browser.close();
  server.close();
});
