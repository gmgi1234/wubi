// 在仓库根目录模拟托管，验证静态 + 动态页面
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml' };

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
    ['char.html?c=' + encodeURIComponent('狗'), 'root-char-dyn'],
    ['ci.html?w=' + encodeURIComponent('中国'), 'root-ci-dyn'],
    ['char/' + encodeURIComponent('王') + '.html', 'root-char-static'],
    ['ci/' + encodeURIComponent('中国') + '.html', 'root-ci-static'],
  ];
  for (const [p, name] of targets) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
    await page.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const title = await page.title();
    const links = await page.evaluate(() => [...document.querySelectorAll('main a')].slice(0, 3).map((a) => a.getAttribute('href')));
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, fullPage: true });
    console.log(name, '|', title.slice(0, 24), '| links:', JSON.stringify(links), '| errors:', errs.length ? errs.join('|') : 'none');
    await page.close();
  }
  await browser.close();
  server.close();
});
