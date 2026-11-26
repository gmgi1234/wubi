// 本地验证练习页「王牌」是否有整格虚线外框
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
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.evaluate(() => {
    var st = window.__pstate;
    st.pool = [{ w: '王牌', c6: 'ggth', c86: 'ggth', c98: 'ggth', r6: '王 王 丿 丨', keys: '10', cheng: '10', len: 2 }];
    st.idx = 0; st.locked = false;
    window.__next();
  });
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => [...document.querySelectorAll('.zislot')].map((s) => ({
    rects: s.querySelectorAll('rect[stroke-dasharray]').length,
    dashPaths: s.querySelectorAll('path[stroke-dasharray]').length,
  })));
  console.log(JSON.stringify(info));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-wangpai-frame.png', clip: { x: 300, y: 100, width: 900, height: 330 } });
  await browser.close();
  server.close();
});
