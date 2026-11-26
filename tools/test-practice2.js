// 测试新版练习页：直接进入、选项可点、编码着色
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
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const init = await page.evaluate(() => ({
    word: document.getElementById('word').textContent,
    rootsColor: document.querySelectorAll('#roots span[style*="color"]').length,
    codeColor: document.querySelectorAll('#codeLine span[style*="color"]').length,
    total: document.getElementById('qTotal').textContent,
  }));
  console.log('进入即练习:', JSON.stringify(init));

  // 切换到四字词
  await page.click('[data-len="4"]');
  await page.waitForTimeout(1200);
  console.log('切四字词后:', await page.evaluate(() => document.getElementById('word').textContent + ' | 总数 ' + document.getElementById('qTotal').textContent));

  // 切换 86 版
  await page.click('[data-ver="8"]');
  await page.waitForTimeout(500);
  console.log('切 86 版后编码:', await page.evaluate(() => document.getElementById('codeLine').textContent));

  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice2.png', clip: { x: 0, y: 0, width: 900, height: 760 } });
  console.log('errors:', errs.join(' | ') || 'none');
  await browser.close();
  server.close();
});
