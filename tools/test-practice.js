// 本地测试词组练习页
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
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#startBtn');
  await page.waitForTimeout(1200);

  const first = await page.evaluate(() => ({
    word: document.getElementById('word').textContent,
    hint: document.getElementById('hint').textContent.slice(0, 40),
    total: document.getElementById('qTotal').textContent,
  }));
  console.log('第一题:', JSON.stringify(first));

  // 故意打错
  await page.keyboard.type('zzzz');
  await page.waitForTimeout(600);
  const bad = await page.evaluate(() => document.getElementById('msg').textContent);
  console.log('打错反馈:', bad);

  // 下一题打对
  await page.keyboard.press(' ');
  await page.waitForTimeout(400);
  const code = await page.evaluate(() => {
    const m = document.querySelector('#hint .code');
    return m ? m.textContent.trim().toLowerCase() : null;
  });
  if (code) {
    await page.keyboard.type(code);
    await page.waitForTimeout(900);
  }
  const right = await page.evaluate(() => document.getElementById('msg').textContent);
  console.log('打对反馈:', right, '| 正确数:', await page.evaluate(() => document.getElementById('qRight').textContent));

  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice.png', clip: { x: 0, y: 0, width: 900, height: 620 } });
  console.log('errors:', errs.join(' | ') || 'none');
  await browser.close();
  server.close();
});
