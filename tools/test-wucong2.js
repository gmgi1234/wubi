// 检查练习页「无从」里的「从」是不是两色（人 + 人）
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    var st = window.__pstate;
    var rows = window.PRACTICE_2 || [];
    var row = rows.find(function (r) { return r[0] === '无从'; });
    st.pool = [{ w: row[0], c6: row[1], c86: row[2], c98: row[3], r6: row[4], r86: row[5], r98: row[6], keys: row[7], cheng: row[8], len: 2 }];
    st.idx = 0; st.locked = false;
    window.__next();
  });
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.zislot')];
    return slots.map((s) => ({
      fills: [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))],
      caption: (s.parentElement.querySelector('.r, .l') ? s.parentElement.textContent.replace(/\s+/g, ' ').trim() : ''),
    }));
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/wucong2.png', clip: { x: 200, y: 80, width: 800, height: 360 } });
  await browser.close();
  server.close();
});
