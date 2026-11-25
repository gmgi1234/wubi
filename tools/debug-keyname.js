// 调试北京人页面上「人」的字形输出
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
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.slice(0, 200)));
  await page.goto(`http://127.0.0.1:${port}/ci.html?w=${encodeURIComponent('北京人')}`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg.glyph')];
    return svgs.slice(0, 3).map((s) => ({ paths: s.querySelectorAll('path').length, len: s.innerHTML.length, head: s.innerHTML.slice(0, 120) }));
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
  server.close();
});
