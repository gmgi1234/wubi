// 截图确认键名字合并后的效果（王牌 / 王八）
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

  const p1 = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  await p1.goto(`http://127.0.0.1:${port}/ci/${encodeURIComponent('王牌')}.html`, { waitUntil: 'load' }).catch(() => {});
  await p1.waitForTimeout(500);
  await p1.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/wangpai-merged.png', clip: { x: 0, y: 120, width: 1100, height: 380 } });

  const p2 = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  await p2.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await p2.waitForTimeout(1200);
  await p2.evaluate(() => {
    var st = window.__pstate;
    var rows = window.PRACTICE_2 || [];
    var row = rows.find(function (r) { return r[0] === '王八'; });
    st.pool = [{ w: row[0], c6: row[1], c86: row[2], c98: row[3], r6: row[4], r86: row[5], r98: row[6], keys: row[7], cheng: row[8], len: 2 }];
    st.idx = 0; st.locked = false;
    window.__next();
  });
  await p2.waitForTimeout(800);
  const n = await p2.evaluate(() => document.querySelectorAll('.zislot').length);
  console.log('练习页 王八 格数:', n);
  await p2.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/wangba-merged.png', clip: { x: 200, y: 80, width: 800, height: 360 } });

  await browser.close();
  server.close();
});
