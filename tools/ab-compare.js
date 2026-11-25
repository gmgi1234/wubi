// Three-panel comparison: A (fitted + stroke outline), B (original, position tuned), KaiTi.
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

const ch = process.argv[2] || '馺';
const out = path.join(ROOT, 'tools', 'compare', `${ch}-AB.png`);

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const a = await page.evaluate(async (c) => {
    await loadAndRender(c);
    const el = document.querySelector('#char-svg').cloneNode(true);
    el.querySelectorAll('path').forEach((p) => {
      const fill = p.getAttribute('fill');
      if (fill) { p.setAttribute('stroke', fill); p.setAttribute('stroke-width', '8'); p.setAttribute('stroke-linejoin', 'round'); }
    });
    return el.outerHTML;
  }, ch);

  // B: original strokes, translated a few pixels to sit on the same boxes
  const orig = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'chars', `${ch}.json.bak-20261122`), 'utf8'));
  const shiftPart = (data, from, to, dx, dy) => {
    for (let i = from; i < to; i += 1) {
      data.strokes[i] = data.strokes[i].replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${(+x + dx).toFixed(1)} ${(+y + dy).toFixed(1)}`);
      data.medians[i] = data.medians[i].map(([x, y]) => [x + dx, y + dy]);
    }
    return data;
  };
  shiftPart(orig, 0, 10, 6, -2);
  shiftPart(orig, 10, 13, -11, 18);
  const bSvg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${orig.strokes.map((d) => `<path d="${d}" fill="#555" stroke="#fff" stroke-width="0.6"/>`).join('')}</g></svg>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#fff; font-family:'KaiTi',serif; }
    .row { display:flex; }
    .cell { width:33.3%; padding:10px; }
    .art svg { width:100%; aspect-ratio:1; }
    .kai { font-size:300px; line-height:360px; text-align:center; height:360px; }
    .lab { text-align:center; font-size:26px; color:#444; }
    .title { text-align:center; font-size:34px; padding:12px; }
  </style></head><body>
    <div class="title">${ch}</div>
    <div class="row">
      <div class="cell"><div class="art">${a}</div><div class="lab">A 缩放+描边</div></div>
      <div class="cell"><div class="art">${bSvg}</div><div class="lab">B 原笔画只平移</div></div>
      <div class="cell"><div class="art"><div class="kai">${ch}</div></div><div class="lab">楷体</div></div>
    </div>
  </body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
  server.close();
});
