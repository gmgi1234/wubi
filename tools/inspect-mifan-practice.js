// 检查练习页「米饭」的米：走的是成字字根分支还是普通着色
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  // 用页面自带的搜索跳转
  await page.fill('#jumpInput', '米饭');
  await page.press('#jumpInput', 'Enter');
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.zislot')];
    return {
      count: slots.length,
      data: slots.map((s) => ({ k: s.dataset.k, key: s.dataset.key, cheng: s.dataset.cheng })),
      fills: slots.map((s) => [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))]),
      rects: slots.map((s) => s.querySelectorAll('rect[stroke-dasharray]').length),
      dashPaths: slots.map((s) => s.querySelectorAll('path[stroke-dasharray]').length),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/mifan-practice-now.png', clip: { x: 300, y: 80, width: 900, height: 330 } });
  await browser.close();
  server.close();
});
