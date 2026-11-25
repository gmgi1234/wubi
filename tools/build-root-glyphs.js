// Build a glyph library for composite roots (字根片段) from all three versions.
// For each fragment name, find a character (in 86/98/06) that contains it, borrow those
// strokes, normalise the shape into a 1024 box, and save tools/root-glyphs.json.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));

const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'data', 'wubi_roots_all.js'), 'utf8')};globalThis.__d = {
  T86: WUBI_ROOT_TABLE_86, T98: WUBI_ROOT_TABLE_98, T06: WUBI_ROOT_TABLE_06 };`, sandbox);
const tablesRoot = sandbox.globalThis.__d;

const isFragment = (name) => {
  const chars = [...String(name)];
  return chars.length !== 1 || chars[0].codePointAt(0) > 0xffff;
};

const names = new Set();
for (const T of [tablesRoot.T86, tablesRoot.T98, tablesRoot.T06]) {
  for (const str of Object.values(T)) {
    for (const r of (String(str).match(/\[[^\]]+\]|./gu) || [])) {
      const name = r.replace(/^\[|\]$/g, '');
      if (isFragment(name)) names.add(name);
    }
  }
}
const wanted = [...names];
console.log('fragment roots:', wanted.length);

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

  const chars = Object.keys(tables.v86);
  const carriers = {}; // name -> { ch, ver, score }

  for (const v of ['86', '98', '06']) {
    await page.evaluate(async (ver) => { await setWubiVersion(ver); await new Promise((r) => setTimeout(r, 300)); }, v);
    const found = await page.evaluate(({ chars, wanted, ver }) => {
      const table = ver === '86' ? WUBI_86 : ver === '98' ? WUBI_98 : WUBI_06;
      const picked = {};
      for (const c of chars) {
        const w = table[c];
        if (!w || !w.r) continue;
        let roots;
        try { roots = recursivelyExpandRoots(w.r, c); } catch (e) { continue; }
        for (const r of roots) {
          if (!wanted.includes(r)) continue;
          const score = roots.length * 100 + [...c].length;
          if (!picked[r] || score < picked[r].score) picked[r] = { ch: c, score };
        }
      }
      return picked;
    }, { chars, wanted, ver: v });
    for (const [name, info] of Object.entries(found)) carriers[name] = { ...info, ver: v };
  }

  console.log('carriers found:', Object.keys(carriers).length, '/', wanted.length);
  const missing = wanted.filter((n) => !carriers[n]);
  if (missing.length) console.log('still missing:', missing.join(' '));

  const lib = {};
  for (const [name, info] of Object.entries(carriers)) {
    await page.evaluate(async (ver) => { await setWubiVersion(ver); await new Promise((r) => setTimeout(r, 250)); }, info.ver);
    const glyph = await page.evaluate(async ({ ch, target }) => {
      const table = currentWubiVersion === '86' || !currentWubiVersion ? WUBI_86
        : (typeof WUBI !== 'undefined' ? WUBI : WUBI_86);
      await loadAndRender(ch);
      await new Promise((r) => setTimeout(r, 120));
      const w = WUBI[ch];
      const roots = recursivelyExpandRoots(w.r, ch);
      const ri = roots.indexOf(target);
      if (ri < 0) return null;
      const paths = [];
      for (let si = 0; si < strokeRootMap.length; si += 1) {
        if (strokeRootMap[si] !== ri) continue;
        const p = document.querySelector(`#char-svg path[data-stroke-index="${si}"]`);
        if (p) paths.push(p.getAttribute('d'));
      }
      if (!paths.length) return null;
      const svg = document.querySelector('#char-svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (const d of paths) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        g.appendChild(p);
      }
      svg.appendChild(g);
      const b = g.getBBox();
      g.remove();
      return { paths, bbox: { x: b.x, y: b.y, w: b.width, h: b.height } };
    }, { ch: info.ch, target: name });

    if (!glyph) { console.log('x', name, info.ch, info.ver); continue; }
    const { x, y, w, h } = glyph.bbox;
    const scale = Math.min(880 / Math.max(w, 1), 880 / Math.max(h, 1));
    lib[name] = {
      from: info.ch,
      ver: info.ver,
      scale: Number(scale.toFixed(3)),
      cx: Math.round(x + w / 2),
      cy: Math.round(y + h / 2),
      paths: glyph.paths,
    };
  }

  // 4) 手工补充：从指定字的指定字根借用（用于字根表里有、但没被任何字用到的片段）
  const EXTRAS = [
    { name: '虎头', ch: '虎', target: '虍', ver: '86' },
    { name: '乐头', ch: '乐', target: '卬左', ver: '86' },
    { name: '長头', ch: '長', target: '镸头', ver: '86' },
    { name: '马前', ch: '马', target: '𢎘', ver: '98' },
  ];
  for (const ex of EXTRAS) {
    if (lib[ex.name]) continue;
    await page.evaluate(async (ver) => { await setWubiVersion(ver); await new Promise((r) => setTimeout(r, 250)); }, ex.ver);
    const glyph = await page.evaluate(async ({ ch, target }) => {
      await loadAndRender(ch);
      await new Promise((r) => setTimeout(r, 150));
      const w = WUBI[ch];
      if (!w) return null;
      const roots = recursivelyExpandRoots(w.r, ch);
      let ri = roots.indexOf(target);
      if (ri < 0) ri = 0; // 片段被展开成子字根时，退而用第一个字根
      if (ri < 0) return null;
      const paths = [];
      for (let si = 0; si < strokeRootMap.length; si += 1) {
        if (strokeRootMap[si] !== ri) continue;
        const p = document.querySelector(`#char-svg path[data-stroke-index="${si}"]`);
        if (p) paths.push(p.getAttribute('d'));
      }
      if (!paths.length) return null;
      const svg = document.querySelector('#char-svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (const d of paths) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        g.appendChild(p);
      }
      svg.appendChild(g);
      const b = g.getBBox();
      g.remove();
      return { paths, bbox: { x: b.x, y: b.y, w: b.width, h: b.height } };
    }, { ch: ex.ch, target: ex.target });
    if (!glyph) { console.log('x extra', ex.name); continue; }
    const { x, y, w, h } = glyph.bbox;
    const scale = Math.min(880 / Math.max(w, 1), 880 / Math.max(h, 1));
    lib[ex.name] = {
      from: ex.ch,
      ver: ex.ver,
      scale: Number(scale.toFixed(3)),
      cx: Math.round(x + w / 2),
      cy: Math.round(y + h / 2),
      paths: glyph.paths,
    };
    console.log('+ extra', ex.name, 'from', ex.ch, '/', ex.target);
  }

  fs.writeFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), JSON.stringify(lib, null, 1), 'utf8');
  console.log('saved', Object.keys(lib).length, 'glyphs');
  await browser.close();
  server.close();
});
