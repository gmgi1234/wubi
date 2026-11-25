// Screenshot the page with a character whose roots include un-typeable components.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const ch = process.argv[2] || '狗';
const out = process.argv[3] || path.join(ROOT, 'tools/compare', `page-${ch}.png`);

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
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async (c) => { await loadAndRender(c); }, ch);
  await page.waitForTimeout(800);
  const fontOk = await page.evaluate(() => document.fonts.check('16px ZiGen'));
  const zigen = await page.evaluate(() => [...document.querySelectorAll('.zigen')].map((e) => e.textContent.codePointAt(0).toString(16)));
  console.log('font loaded:', fontOk, '| zigen spans:', JSON.stringify(zigen), '| errors:', errors.length ? errors.join(' | ') : 'none');
  await page.screenshot({ path: out, fullPage: true });
  console.log('screenshot', out);
  await browser.close();
  server.close();
});
