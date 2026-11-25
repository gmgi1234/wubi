// 本地测试动态页面：char.html?c= / ci.html?w=
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi/site');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const targets = [
    ['char.html?c=' + encodeURIComponent('狗'), 'dyn-char-gou'],
    ['ci.html?w=' + encodeURIComponent('中国'), 'dyn-word-zhongguo'],
    ['ci.html?w=' + encodeURIComponent('米饭'), 'dyn-word-mifan'],
  ];
  for (const [url, name] of targets) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    await page.goto(`http://127.0.0.1:${port}/${url}`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const out = path.join('D:/Users/10061/Downloads/wubi/tools/compare', `${name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(name, '| errors:', errs.length ? errs.join(' | ') : 'none');
    await page.close();
  }
  await browser.close();
  server.close();
});
