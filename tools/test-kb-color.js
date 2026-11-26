// 验证键盘按键着色是否跟随编码位置
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
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    var st = window.__pstate;
    st.pool = [{ w: '中华人民共和国', c6: 'kwwl', c86: 'kwwl', c98: 'kwwl', r6: '口 亻 人 囗', keys: '0100000', cheng: '0110001', len: 7 }];
    st.idx = 0; st.locked = false;
    window.__next();
  });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const hl = [...document.querySelectorAll('.kb-key.hl')].map((b) => ({
      k: b.dataset.k,
      color: b.style.color,
      border: b.style.borderColor,
    }));
    return { highlighted: hl, code: document.getElementById('codline').textContent };
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-kb-color.png', fullPage: false });
  await browser.close();
  server.close();
});
