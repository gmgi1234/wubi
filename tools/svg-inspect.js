// Inspect how a rendered character's SVG carries stroke colours.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(async () => {
    await loadAndRender('王');
    const svg = document.querySelector('#char-svg');
    const first = svg.querySelector('path');
    return {
      viewBox: svg.getAttribute('viewBox'),
      attrs: first ? [...first.attributes].map((a) => a.name + '=' + a.value.slice(0, 40)) : null,
      head: svg.outerHTML.slice(0, 500),
      paths: svg.querySelectorAll('path').length,
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  server.close();
});
