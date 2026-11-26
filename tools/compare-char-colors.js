// 对比主站与本站「大」字的着色
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const CHAR = process.argv[2] || '大';

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });

  const p1 = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  await p1.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 90000 });
  await p1.waitForTimeout(2500);
  await p1.evaluate((ch) => {
    const input = document.getElementById('char-input');
    input.value = ch;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof window.renderChar === 'function') window.renderChar(ch);
  }, CHAR);
  await p1.waitForTimeout(1500);
  const main = await p1.evaluate(() => {
    const el = document.getElementById('char-svg');
    if (!el) return null;
    return [...el.querySelectorAll('path')].map((p) => p.getAttribute('fill'));
  });
  console.log('主站 fills:', JSON.stringify(main));
  await p1.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${CHAR}-main.png`, clip: { x: 300, y: 60, width: 620, height: 520 } });

  const p2 = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await p2.goto(`http://127.0.0.1:${port}/char/${encodeURIComponent(CHAR)}.html`, { waitUntil: 'load' });
  await p2.waitForTimeout(600);
  const ours = await p2.evaluate(() => {
    const svg = document.querySelector('svg.glyph');
    if (!svg) return null;
    return [...svg.querySelectorAll('path')].map((p) => p.getAttribute('fill'));
  });
  console.log('本站 fills:', JSON.stringify(ours));
  await p2.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${CHAR}-ours.png`, clip: { x: 0, y: 100, width: 1100, height: 460 } });

  await browser.close();
  server.close();
});
