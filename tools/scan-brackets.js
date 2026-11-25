// Find any remaining bracketed composite-root text in the page across versions.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const chars = process.argv.slice(2);
const targets = chars.length ? chars : ['革', '狗', '鹿', '馬', '亞', '齊'];

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  for (const ver of ['86', '98', '06']) {
    await page.evaluate(async (v) => { await setWubiVersion(v); await new Promise((r) => setTimeout(r, 300)); }, ver);
    for (const ch of targets) {
      await page.evaluate(async (c) => { await loadAndRender(c); await new Promise((r) => setTimeout(r, 150)); }, ch);
      const hits = await page.evaluate(() => {
        const out = [];
        const walk = (el) => {
          for (const node of el.childNodes) {
            if (node.nodeType === 3) {
              const t = node.textContent || '';
              if (/\[[^\]]+\]/.test(t)) {
                const p = node.parentElement;
                out.push({ cls: p ? p.className : '', id: p ? p.id : '', text: t.trim().slice(0, 40) });
              }
            } else if (node.nodeType === 1) walk(node);
          }
        };
        walk(document.body);
        return out.slice(0, 12);
      });
      if (hits.length) {
        console.log(ver, ch, JSON.stringify(hits));
      }
    }
  }
  console.log('scan done');
  await browser.close();
  server.close();
});
