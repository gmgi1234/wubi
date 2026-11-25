// Build one character page. Usage: node build-char-page3.js 革 [style]
// styles: plain | copybook | blackboard | card
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const { renderPage } = require('./char-page-template.js');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const OUT = path.join(ROOT, 'site', 'char');
const ch = process.argv[2] || '革';
const style = process.argv[3] || 'plain';
const PY = 'C:\\Users\\10061\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe';

const meta = JSON.parse(execFileSync(PY, [path.join(ROOT, 'tools', 'char-page-data.py'), ch], { encoding: 'utf8' }));
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));
const idx = ranking.indexOf(ch);
const prev = idx > 0 ? ranking[idx - 1] : null;
const next = idx >= 0 && idx < ranking.length - 1 ? ranking[idx + 1] : null;
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
let wordPages = null;
try {
  wordPages = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-pages.json'), 'utf8')));
} catch (e) { wordPages = null; }

const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'data', 'wubi_roots_all.js'), 'utf8')};globalThis.__d = {
  WUBI_KOuju_86: WUBI_KOuju_86, WUBI_KOuju_98: WUBI_KOuju_98, WUBI_KOuju_06: WUBI_KOuju_06,
  WUBI_ROOT_TABLE_86: WUBI_ROOT_TABLE_86, WUBI_ROOT_TABLE_98: WUBI_ROOT_TABLE_98, WUBI_ROOT_TABLE_06: WUBI_ROOT_TABLE_06,
  KEY_NAMES: KEY_NAMES, KEY_NAMES_98: KEY_NAMES_98, KEY_NAMES_06: KEY_NAMES_06 };`, sandbox);
const rootData = sandbox.globalThis.__d;

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
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(async (c) => {
    const out = { versions: {} };
    for (const v of ['86', '98', '06']) {
      await setWubiVersion(v);
      await new Promise((r) => setTimeout(r, 400));
      await loadAndRender(c);
      await new Promise((r) => setTimeout(r, 250));
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

  await browser.close();
  server.close();

  const html = renderPage({ ch, info, meta, prev, next, rootData, tables, style, wordPages });
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${ch}.html`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('written', file, html.length, 'bytes', 'style=' + style);

  const b2 = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const p2 = await b2.newPage({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 2 });
  await p2.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load' });
  await p2.waitForTimeout(400);
  const suffix = style === 'plain' ? '' : `-${style}`;
  const shot = path.join(ROOT, 'tools', 'compare', `char-page-${ch}${suffix}.png`);
  await p2.screenshot({ path: shot, fullPage: true });
  console.log('screenshot', shot);
  await b2.close();
});
