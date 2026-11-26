// 对比：动态单字页 char.html?c= 的着色
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
  for (const ch of ['大', '象', '米']) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
    await page.goto(`http://127.0.0.1:${port}/char.html?c=${encodeURIComponent(ch)}`, { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    const info = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('svg')];
      const g = svgs.map((s) => ({
        fills: [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))],
        dashes: s.querySelectorAll('path[stroke-dasharray]').length,
      }));
      return { svgs: svgs.length, detail: g.slice(0, 4) };
    });
    console.log(ch, '|', JSON.stringify(info).slice(0, 260), '| err:', errs.join(';') || 'none');
    if (ch === '象') await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/dyn-xiang.png', clip: { x: 0, y: 60, width: 1100, height: 480 } });
    await page.close();
  }
  await browser.close();
  server.close();
});
