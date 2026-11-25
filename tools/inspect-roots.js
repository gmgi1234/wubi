// Show the exact roots array autoDetectNonContinuous receives for one char.
// Usage: node inspect-roots.js <file.html> <char> <ver>
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const file = process.argv[2];
const ch = process.argv[3];
const ver = process.argv[4];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
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
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(file)}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(async ({ c, v }) => {
    const calls = [];
    const orig = window.autoDetectNonContinuous;
    window.autoDetectNonContinuous = function (char, roots, n, ...rest) {
      calls.push({ char, roots: [...roots], n });
      return orig.apply(this, arguments);
    };
    if (typeof setWubiVersion === 'function') setWubiVersion(v);
    await new Promise((r) => setTimeout(r, 800));
    await loadAndRender(c);
    await new Promise((r) => setTimeout(r, 300));
    window.autoDetectNonContinuous = orig;
    return { calls, map: typeof strokeRootMap !== 'undefined' ? [...strokeRootMap] : null, wubiRoots: (WUBI[c] || {}).r };
  }, { c: ch, v: ver });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  server.close();
});
