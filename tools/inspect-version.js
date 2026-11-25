// Inspect one character under a given wubi version (86/98/06).
// Usage: node inspect-version.js local <file.html> <char> <ver> | live <char> <ver>
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const mode = process.argv[2];
const file = mode === 'live' ? null : process.argv[3];
const ch = mode === 'live' ? process.argv[3] : process.argv[4];
const ver = mode === 'live' ? process.argv[4] : process.argv[5];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

async function run(url) {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(async ({c, v}) => {
    if (typeof setWubiVersion === 'function') setWubiVersion(v);
    await new Promise((r) => setTimeout(r, 800));
    await loadAndRender(c);
    await new Promise((r) => setTimeout(r, 300));
    return {
      version: typeof currentWubiVersion !== 'undefined' ? currentWubiVersion : '?',
      roots: (WUBI[c] || {}).r || null,
      code: (WUBI[c] || {}).c || null,
      n: strokes.length,
      map: typeof strokeRootMap !== 'undefined' ? [...strokeRootMap] : null,
      mapDisplay: typeof strokeRootMapForDisplay !== 'undefined' && strokeRootMapForDisplay ? [...strokeRootMapForDisplay] : null,
    };
  }, {c: ch, v: ver});
  await browser.close();
  return out;
}

(async () => {
  if (mode === 'live') {
    console.log(JSON.stringify(await run('https://wubi.netlify.app/')));
    return;
  }
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    console.log(JSON.stringify(await run(`http://127.0.0.1:${port}/${encodeURIComponent(file)}`)));
    server.close();
  });
})();
