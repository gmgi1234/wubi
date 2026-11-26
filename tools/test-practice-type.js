// 测试词组打字练习（输入词本身）
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

  const info = await page.evaluate(() => {
    const w = document.querySelectorAll('.charcell');
    return {
      chars: w.length,
      roots: document.querySelectorAll('.charcell .roots div').length,
      code: document.getElementById('codline').textContent,
      word: [...document.querySelectorAll('.charcell .zi')].map((x) => x.textContent).join(''),
    };
  });
  console.log('题目:', JSON.stringify(info));

  // 输入正确词组
  await page.fill('#typeInput', info.word);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    right: document.getElementById('qRight').textContent,
    idx: document.getElementById('qIndex').textContent,
    msg: document.getElementById('msg').textContent,
  }));
  console.log('输入正确后:', JSON.stringify(after));

  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-type.png', clip: { x: 0, y: 0, width: 1200, height: 700 } });
  console.log('errors:', errs.join(' | ') || 'none');
  await browser.close();
  server.close();
});
