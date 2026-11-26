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
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  console.log('初始 state.ver:', await page.evaluate(() => window.__pstate.ver));
  await page.click('[data-ver="8"]');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({
    ver: window.__pstate.ver,
    ver86: typeof WUBI_ROOT_TABLE_86,
    kbTitle: (document.querySelector('.kb-title') || {}).textContent,
    kbKeys: document.querySelectorAll('.kb-key').length,
    name86: typeof KEY_NAMES_86,
  }));
  console.log(JSON.stringify(after));
  await browser.close();
  server.close();
});
