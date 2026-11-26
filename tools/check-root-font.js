const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
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
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);
  const info = await page.evaluate(async () => {
    const ok = document.fonts.check("16px ZiGen");
    const el = document.querySelector('.kb-roots');
    return {
      fontLoaded: ok,
      family: el ? getComputedStyle(el).fontFamily : null,
      text: el ? el.textContent.slice(0, 12) : null,
      codePoints: el ? [...el.textContent].slice(0, 6).map((c) => c.codePointAt(0).toString(16)) : null,
    };
  });
  console.log(JSON.stringify(info));
  await browser.close();
  server.close();
});
