// Inspect how the running page renders a character's root chips.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => { await loadAndRender('狗'); });
  await page.waitForTimeout(600);

  const info = await page.evaluate(() => {
    const out = [];
    const walk = (el) => {
      if (el.children.length === 0 && el.textContent && el.textContent.trim()) {
        const t = el.textContent.trim();
        if (/犭|鱼头|弋|口/.test(t) && t.length <= 8) {
          out.push({ tag: el.tagName, cls: el.className, id: el.id, text: t });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return out.slice(0, 40);
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
  server.close();
});
