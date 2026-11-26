// 用「米饭」验证练习页着色
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    var st = window.__pstate;
    st.pool = [{ w: '米饭', c6: 'oyqn', c86: 'oyqn', c98: 'oyqn', r6: '米 丶 饣 丿', keys: '00', len: 2 }];
    st.idx = 0; st.locked = false;
    window.__next();
  });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => [...document.querySelectorAll('.zislot')].map((s) => ({
    fills: [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))].join(','),
  })));
  console.log('米饭各字填色:', JSON.stringify(info));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-mifan.png', clip: { x: 250, y: 90, width: 850, height: 420 } });
  await browser.close();
  server.close();
});
