// Dump the first root list item HTML/bbox and screenshot just that panel.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const ch = process.argv[2] || '狗';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf' };
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async (c) => { await loadAndRender(c); }, ch);
  await page.waitForTimeout(600);

  const html = await page.evaluate(() => {
    const li = document.querySelector('li[data-root-idx]');
    return li ? { html: li.innerHTML.slice(0, 600), text: li.innerText } : null;
  });
  console.log(JSON.stringify(html, null, 1));

  const box = await page.evaluate(() => {
    const li = document.querySelector('li[data-root-idx]');
    if (!li) return null;
    const ul = li.closest('ul') || li.parentElement;
    const r = ul.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  if (box) {
    const out = path.join(ROOT, 'tools/compare', `roots-${ch}.png`);
    await page.screenshot({ path: out, clip: box });
    console.log('screenshot', out);
  }
  await browser.close();
  server.close();
});
