// 用固定词组（山上）验证练习页着色是否与词组页一致
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

  // 固定成「山上」
  await page.evaluate(() => {
    var st = window.__pstate;
    st.pool = [{ w: '山上', c6: 'mmhg', c86: 'mmhh', c98: 'mmhh', r6: '山 山 上', keys: '10', len: 2 }];
    st.idx = 0; st.locked = false;
    // 手动触发重绘
    document.getElementById('wordbox').innerHTML = '';
    var evt = new Event('x');
    window.__redraw && window.__redraw();
  });
  await page.waitForTimeout(300);
  // 若未暴露 __redraw，退化为刷新页面后点“停止/继续”——这里直接再触发一次 nextQuestion
  await page.evaluate(() => { if (window.__next) window.__next(); });
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.zislot')];
    return slots.map((s) => ({
      key: s.dataset.key,
      // 统计主要填充色
      fills: [...new Set([...s.querySelectorAll('path[fill]')].map((p) => p.getAttribute('fill')).filter((f) => f !== '#fff'))].slice(0, 3),
      dash: [...s.querySelectorAll('path[stroke-dasharray]')].map((p) => p.getAttribute('stroke')).slice(0, 1),
    }));
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-shanshang.png', clip: { x: 300, y: 100, width: 800, height: 420 } });
  await browser.close();
  server.close();
});
