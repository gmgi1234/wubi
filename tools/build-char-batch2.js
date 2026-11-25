// Batch-build character pages with the shared template.
// Usage: node build-char-batch2.js [count] [style]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const { renderPage } = require('./char-page-template.js');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const OUT = path.join(ROOT, 'site', 'char');
const metaAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const limit = Number(process.argv[2] || 0);
const style = process.argv[3] || 'copybook';
const wordPages = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-pages.json'), 'utf8')));

const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'data', 'wubi_roots_all.js'), 'utf8')};globalThis.__d = {
  WUBI_KOuju_86: WUBI_KOuju_86, WUBI_KOuju_98: WUBI_KOuju_98, WUBI_KOuju_06: WUBI_KOuju_06,
  WUBI_ROOT_TABLE_86: WUBI_ROOT_TABLE_86, WUBI_ROOT_TABLE_98: WUBI_ROOT_TABLE_98, WUBI_ROOT_TABLE_06: WUBI_ROOT_TABLE_06,
  KEY_NAMES: KEY_NAMES, KEY_NAMES_98: KEY_NAMES_98, KEY_NAMES_06: KEY_NAMES_06 };`, sandbox);
const rootData = sandbox.globalThis.__d;

const orderedChars = ranking.filter((c) => metaAll[c]);
const restChars = Object.keys(metaAll).filter((c) => !new Set(orderedChars).has(c));
const chars = limit ? [...orderedChars, ...restChars].slice(0, limit) : [...orderedChars, ...restChars];
console.log('target chars:', chars.length);

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
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  fs.mkdirSync(OUT, { recursive: true });
  const available = new Set(chars);
  const started = Date.now();
  let done = 0;

  for (const ch of chars) {
    const info = await page.evaluate(async (c) => {
      const out = { versions: {} };
      for (const v of ['86', '98', '06']) {
        await setWubiVersion(v);
        await new Promise((r) => setTimeout(r, 180));
        await loadAndRender(c);
        await new Promise((r) => setTimeout(r, 120));
        const table = v === '86' ? WUBI_86 : v === '98' ? WUBI_98 : WUBI_06;
        const w = table[c] || {};
        const split = w.r || [];
        const expanded = recursivelyExpandRoots(split, c);
        const lettersArr = (w.c || '').split('');
        const items = expanded.map((root, i) => {
          let pos = -1;
          if (i < 3) pos = i;
          else if (i === expanded.length - 1 && expanded.length >= 4) pos = lettersArr.length - 1;
          return { root, letter: pos >= 0 ? (lettersArr[pos] || '') : '' };
        });
        const subs = [];
        for (const root of split) {
          const ex = recursivelyExpandRoots([root], c);
          if (ex.length > 1) subs.push({ root, ex });
        }
        const supIdx = (w.sup && w.sup.length) ? w.sup.slice()
          : (expanded.length < lettersArr.length && expanded.length < 4 ? [lettersArr.length - 1] : []);
        const sup = supIdx.map((i) => {
          const L = lettersArr[i] || '';
          const rev = (typeof SUPPLEMENT_REVERSE !== 'undefined') ? SUPPLEMENT_REVERSE[L] : null;
          return { i, letter: L, last: rev ? ({ 1: '横', 2: '竖', 3: '撇', 4: '捺', 5: '折' })[rev[0]] : '', struct: rev ? ({ 1: '左右', 2: '上下', 3: '杂合' })[rev[1]] : '' };
        });
        const strokes = [];
        const svg = document.querySelector('#char-svg');
        svg.querySelectorAll('path').forEach((p) => {
          if (p.dataset.strokeIndex === undefined) return;
          strokes.push({ i: Number(p.dataset.strokeIndex), fill: p.getAttribute('fill'), d: p.getAttribute('d') });
        });
        out.versions[v] = {
          code: w.c || '', split, items, subs, sup, strokes,
          map: (typeof strokeRootMapForDisplay !== 'undefined' && strokeRootMapForDisplay) ? Array.from(strokeRootMapForDisplay) : Array.from(strokeRootMap || []),
          colors: (typeof strokeColorMap !== 'undefined' && strokeColorMap) ? Array.from(strokeColorMap) : [],
        };
      }
      out.pinyin = (window.CC_PINYIN && window.CC_PINYIN[c]) || '';
      return out;
    }, ch);

    const idx = ranking.indexOf(ch);
    const prev = idx > 0 ? ranking[idx - 1] : null;
    const next = idx >= 0 && idx < ranking.length - 1 ? ranking[idx + 1] : null;
    const html = renderPage({ ch, info, meta: metaAll[ch] || {}, prev, next, rootData, tables, style, available, pool: chars, wordPages });
    fs.writeFileSync(path.join(OUT, `${ch}.html`), html, 'utf8');
    done += 1;
    if (done % 100 === 0) {
      const sec = (Date.now() - started) / 1000;
      console.log(`${done}/${chars.length}  ${(done / sec).toFixed(1)}/s`);
    }
  }

  const urls = chars.map((c) => `  <url><loc>https://wubi.iqiusuo.cn/char/${encodeURIComponent(c)}.html</loc></url>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'sitemap-char.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');

  console.log('done', done, 'pages in', ((Date.now() - started) / 1000).toFixed(0), 's', 'style=' + style);
  await browser.close();
  server.close();
});
