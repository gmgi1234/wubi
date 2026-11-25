// Inspect one character's stroke→root map and rendered stroke colours.
// Usage: node inspect-char.js local <file.html> <char>   |   node inspect-char.js live <char>
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const mode = process.argv[2];
const arg = process.argv[3];
const ch = mode === 'live' ? process.argv[3] : process.argv[4];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

async function run(url) {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(async (c) => {
    await loadAndRender(c);
    const paths = [...document.querySelectorAll('#char-svg path')];
    const colors = paths.map((p) => p.getAttribute('stroke') || p.getAttribute('fill'));
    return {
      roots: (WUBI[c] || {}).r || null,
      code: (WUBI[c] || {}).c || null,
      n: strokes.length,
      map: typeof strokeRootMap !== 'undefined' ? [...strokeRootMap] : null,
      mapDisplay: typeof strokeRootMapForDisplay !== 'undefined' && strokeRootMapForDisplay ? [...strokeRootMapForDisplay] : null,
      colors,
    };
  }, ch);
  await browser.close();
  return out;
}

(async () => {
  if (mode === 'live') {
    const out = await run('https://wubi.netlify.app/');
    console.log(JSON.stringify(out));
    return;
  }
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    const out = await run(`http://127.0.0.1:${port}/${encodeURIComponent(arg)}`);
    console.log(JSON.stringify(out));
    server.close();
  });
})();
