// Demo: draw a root's fragment from the character's own stroke data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const ch = process.argv[2] || '狗';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf' };
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async (c) => { await loadAndRender(c); }, ch);
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const out = { name: currentChar, roots: [] };
    const seen = new Map();
    strokes.forEach((d, i) => {
      const ri = strokeRootMap[i];
      if (ri === undefined || ri < 0) return;
      if (!seen.has(ri)) seen.set(ri, { paths: [], indices: [] });
      seen.get(ri).paths.push(d);
      seen.get(ri).indices.push(i);
    });
    for (const [ri, v] of seen) {
      const color = getStrokeColor(v.indices[0]) || '#555';
      out.roots.push({ ri, name: (WUBI[currentChar]?.r || [])[ri] || '', indices: v.indices, color, paths: v.paths });
    }
    out.fullSvg = document.querySelector('#char-svg').outerHTML;
    return out;
  });

  console.log('char', data.name, 'roots:', data.roots.map((r) => `${r.name}(${r.indices.length}笔)`).join(' | '));

  const makeSvg = (r, size = 220) => `<svg viewBox="0 0 1024 1024" width="${size}" height="${size}"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">${r.paths.map((d) => `<path d="${d}" fill="${r.color}" stroke="none"/>`).join('')}</g></svg>`;

  const cards = data.roots.map((r) => `<div class="card">${makeSvg(r)}<div class="lab">${r.name}</div><div class="sub">第 ${r.indices.map((i) => i + 1).join('、')} 笔</div></div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:'KaiTi',serif;padding:20px}
  h2{font-size:24px;margin:0 0 12px;text-align:center}
  .row{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}
  .card{text-align:center;border:1px solid #e3e7ee;border-radius:12px;padding:10px}
  .lab{font-size:22px;color:#1f2937;margin-top:4px}
  .sub{font-size:13px;color:#8a929e}
  .full{display:block;margin:0 auto 16px}
  </style></head><body>
  <h2>${data.name}：用笔画数据现画的字根片段</h2>
  <div class="row">${cards}</div>
  </body></html>`;

  fs.writeFileSync(path.join(ROOT, 'tools/compare', `fragment-${ch}.html`), html, 'utf8');
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const out = path.join(ROOT, 'tools/compare', `fragment-${ch}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
  server.close();
});
