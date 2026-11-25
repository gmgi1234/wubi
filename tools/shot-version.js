// Screenshot a character under a given version, from a local file (served) or the live site.
// Usage: node shot-version.js <char> <out.png> <ver> [file.html]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const ch = process.argv[2];
const out = process.argv[3];
const ver = process.argv[4];
const file = process.argv[5];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

async function shoot(url) {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async ({ c, v }) => {
    if (typeof setWubiVersion === 'function') setWubiVersion(v);
    await new Promise((r) => setTimeout(r, 800));
    await loadAndRender(c);
    await new Promise((r) => setTimeout(r, 400));
  }, { c: ch, v: ver });
  const el = await page.$('#char-svg');
  await el.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
}

if (file) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    await shoot(`http://127.0.0.1:${port}/${encodeURIComponent(file)}`);
    server.close();
  });
} else {
  shoot('https://wubi.netlify.app/');
}
