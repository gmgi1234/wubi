// 逐个验证「成字字根占两码」的词，练习页是否画了虚线
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
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const words = ['地方', '文化', '学生', '方面', '中心', '为了', '大学', '东西', '方法', '学校', '方式'];
  for (const w of words) {
    await page.evaluate((word) => {
      var st = window.__pstate;
      // 从题库里找这一行
      var rows = window.PRACTICE_2 || [];
      var row = rows.find(function (r) { return r[0] === word; });
      if (!row) return;
      st.pool = [{
        w: row[0], c6: row[1], c86: row[2], c98: row[3], r6: row[4], r86: row[5], r98: row[6],
        keys: row[7] || '', cheng: row[8] || '', len: 2
      }];
      st.idx = 0; st.locked = false;
      window.__next();
    }, w);
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const slots = [...document.querySelectorAll('.zislot')];
      return slots.map((s) => s.querySelectorAll('path[stroke-dasharray]').length);
    });
    console.log(w, '| 各格虚线数:', JSON.stringify(info));
  }
  await browser.close();
  server.close();
});
