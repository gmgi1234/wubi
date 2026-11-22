// Regression harness: render every WUBI char on a page and dump the result.
// Usage: node harness.js <file.html> <out.ndjson> [limit]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const PAGE = process.argv[2];
const OUT = process.argv[3];
const LIMIT = Number(process.argv[4] || 0);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
    args: ['--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(path.basename(PAGE))}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2000);

  const chars = await page.evaluate(() => Object.keys(WUBI));
  console.log('chars', chars.length);
  const list = LIMIT ? chars.slice(0, LIMIT) : chars;

  const fd = fs.openSync(OUT, 'w');
  fs.writeSync(fd, JSON.stringify({
    _meta: {
      file: path.basename(OUT),
      source: path.basename(PAGE),
      chars: list.length,
      capturedAt: new Date().toISOString(),
      note: '现状快照，不代表正确。对拍只用于发现变化，不用于判定对错。',
      scope: '笔画数、每笔归属的字根、字根序列、86 版编码',
    },
  }) + '\n');
  const started = Date.now();
  for (let i = 0; i < list.length; i += 1) {
    const ch = list[i];
    let rec;
    try {
      rec = await page.evaluate(async (c) => {
        await loadAndRender(c);
        const w = (typeof WUBI !== 'undefined' && WUBI[c]) || null;
        return {
          c,
          n: (typeof strokes !== 'undefined' && strokes) ? strokes.length : -1,
          map: (typeof strokeRootMapForDisplay !== 'undefined' && strokeRootMapForDisplay) ? [...strokeRootMapForDisplay] : null,
          roots: w ? w.r : null,
          code: w ? w.c : null,
        };
      }, ch);
    } catch (error) {
      rec = { c: ch, error: String(error).slice(0, 120) };
    }
    fs.writeSync(fd, JSON.stringify(rec) + '\n');
    if (i % 500 === 0) {
      const rate = (i + 1) / ((Date.now() - started) / 1000);
      console.log(`progress ${i}/${list.length} (${rate.toFixed(1)}/s)`);
    }
  }
  fs.closeSync(fd);
  console.log('done', list.length, 'errors', errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
  server.close();
});
