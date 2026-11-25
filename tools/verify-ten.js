// Verify newly added characters in all three versions: code, roots, colour count.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const CHARS = ['贠', '菓', '幋', '燊', '凅', '坘', '脮', '馺', '秎', '镠'];
const VERS = ['86', '98', '06'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

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
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  for (const ver of VERS) {
    await page.evaluate((v) => { if (typeof setWubiVersion === 'function') setWubiVersion(v); }, ver);
    await page.waitForTimeout(600);
    console.log('== 版本', ver);
    for (const ch of CHARS) {
      const r = await page.evaluate(async (c) => {
        await loadAndRender(c);
        const w = WUBI[c] || {};
        const colors = new Set((strokeRootMapForDisplay || []).map(String)).size;
        return { code: w.c || '-', roots: (w.r || []).join('+'), strokes: strokes.length, colors };
      }, ch);
      console.log(`  ${ch} ${r.code.padEnd(5)} ${r.roots.padEnd(12)} 笔${String(r.strokes).padStart(2)} 色${r.colors}`);
    }
  }
  console.log('errors:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
  server.close();
});
