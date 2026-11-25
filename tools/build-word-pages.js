// 生成词组单页：/ci/<词>.html，三版编码 + 彩色字形（内联 SVG）+ 拆分说明
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'site', 'ci');
const SVG_DIR = path.join(ROOT, 'site', 'svg');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const selected = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const charMeta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));

const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#2980B9'];
const BASE_COLORS = PALETTE.slice();
const GRAY = '#cfc8bd';
const KEY_VER = { '86': 'v86', '98': 'v98', '06': 'v06' };

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const lenLabel = (n) => (n === 2 ? '双字词' : n === 3 ? '三字词' : n === 4 ? '四字词' : n === 5 ? '五字词' : '六字词');
const ruleText = (n) => (n === 2 ? '双字词：每个字取前两码' : n === 3 ? '三字词：前两字各取首码，最后一字取前两码'
  : n === 4 ? '四字词：每个字取首码' : '五字及以上：前三字各取首码，最后一字取首码');

const codeOf = (v, c) => (tables[v][c] || {}).c || '';
const rootsOf = (v, c) => (tables[v][c] || {}).r || [];

function wordCode(chars, v) {
  const codes = chars.map((c) => codeOf(v, c));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

function expandRoots(v, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[v] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) out.push(...expandRoots(v, e.r, depth + 1));
    else out.push(r);
  }
  return out;
}

function wordRoots(chars, v) {
  const R = chars.map((c) => expandRoots(v, rootsOf(v, c)));
  if (R.some((r) => !r.length)) return [];
  const n = chars.length;
  if (n === 2) return [...R[0].slice(0, 2), ...R[1].slice(0, 2)];
  if (n === 3) return [R[0][0], R[1][0], ...R[2].slice(0, 2)];
  if (n === 4) return R.map((r) => r[0]);
  return [R[0][0], R[1][0], R[2][0], R[n - 1][0]];
}

const isKeyName = (v, ch) => {
  const e = tables[v][ch];
  return !!(e && Array.isArray(e.r) && e.r[0] === ch);
};

// ---------- 字形 ----------
const rawSvgCache = new Map();
function rawGlyph(name) {
  if (rawSvgCache.has(name)) return rawSvgCache.get(name);
  let s = '';
  try {
    s = fs.readFileSync(path.join(SVG_DIR, `${name}.svg`), 'utf8')
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<path[^>]*stroke="#c0392b"[^>]*\/>/g, '')
      .trim();
  } catch (e) { s = ''; }
  rawSvgCache.set(name, s);
  return s;
}

function recolorGlyph(svg, startPos, count) {
  if (!svg) return '';
  return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, fill) => {
    const up = fill.toUpperCase();
    if (up === '#FFF' || up === '#FFFFFF') return m; // 保留白底
    const idx = BASE_COLORS.indexOf(up);
    if (idx >= 0 && idx < count) return `fill="${PALETTE[(startPos + idx) % 4]}"`;
    return `fill="${GRAY}"`;
  }).replace(/^<svg/, '<svg class="glyph"');
}

function colorWhole(svg, color, nextColor) {
  if (!svg) return '';
  return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
    let f = fill.toUpperCase();
    if (f === '#FFF' || f === '#FFFFFF') return m;
    if (f.length === 4) f = '#' + f[1] + f[1] + f[2] + f[2] + f[3] + f[3];
    const dMatch = (pre + post).match(/d="([^"]*)"/);
    const dAttr = dMatch ? `d="${dMatch[1]}"` : '';
    const base = `<path${pre}fill="${color}"${post}/>`;
    if (nextColor && f === BASE_COLORS[1]) {
      return base
        + `<path ${dAttr} fill="none" stroke="#ffffff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>`
        + `<path ${dAttr} fill="none" stroke="${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    return base;
  }).replace(/^<svg/, '<svg class="glyph"');
}

// ---------- 词表 ----------
const merged = new Map();
for (const it of selected) merged.set(it.w, it);
for (const v of Object.values(charMeta)) {
  for (const w of v.words || []) {
    if (merged.has(w)) continue;
    const chars = [...w];
    if (chars.length < 2 || chars.length > 6) continue;
    if (!chars.every((c) => (tables.v86[c] || {}).c && (tables.v06[c] || {}).c)) continue;
    merged.set(w, { w, n: chars.length, chars, weight: 0 });
  }
}

const words = [];
for (const it of merged.values()) {
  const chars = it.chars || [...it.w];
  const c86 = it.c86 || wordCode(chars, 'v86');
  const c98 = it.c98 || wordCode(chars, 'v98');
  const c06 = it.c06 || wordCode(chars, 'v06');
  if (!c86 || !c06) continue;
  words.push({
    w: it.w, chars, n: chars.length, c86, c98, c06,
    r86: it.r86 || wordRoots(chars, 'v86'),
    r98: it.r98 || wordRoots(chars, 'v98'),
    r06: it.r06 || wordRoots(chars, 'v06'),
  });
}
console.log('word pages to write:', words.length);

const byFirst = new Map();
for (const it of words) {
  const k = it.chars[0];
  if (!byFirst.has(k)) byFirst.set(k, []);
  byFirst.get(k).push(it.w);
}

// ---------- 模板 ----------
const CSS = `
  :root { --ink:#2a2320; --muted:#8a7b6c; --line:#e6dcc9; --bg:#fbf7ef; --accent:#a33c2f; --paper:#fffdf8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:12px 20px; display:flex; justify-content:space-between; font-size:15px; }
  header a { color:var(--muted); text-decoration:none; }
  main { max-width:900px; margin:18px auto 0; background:var(--paper); box-shadow:0 0 0 1px var(--line); border-radius:16px; padding:26px 22px 44px; }
  h1 { font-size:32px; margin:0 0 6px; letter-spacing:2px; }
  .sub { color:var(--muted); font-size:16px; margin-bottom:22px; }
  .bigbox { border:1px solid var(--line); border-radius:14px; padding:10px 16px; background:#fff; margin-bottom:20px; }
  .brow { display:flex; gap:16px; align-items:center; flex-wrap:wrap; padding:10px 0; border-bottom:1px dashed var(--line); }
  .brow:last-child { border-bottom:0; }
  .vtag { color:var(--muted); font-size:15px; width:52px; }
  .bimgs { display:flex; gap:8px; }
  .bimgs.same { color:var(--muted); font-size:14px; }
  svg.glyph { width:var(--gsize,96px); height:var(--gsize,96px); border:1px solid var(--line); border-radius:8px; background:#fff; display:block; }
  .broots { font-size:19px; display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
  .bcode { margin-left:auto; font-family:ui-monospace,Consolas,monospace; font-size:20px; letter-spacing:2px; }
  .plus { color:var(--muted); font-size:14px; }
  h2 { font-size:20px; margin:28px 0 10px; }
  .rule { background:#faf6ee; border:1px solid var(--line); border-radius:10px; padding:12px 16px; font-size:15px; }
  .rule p { margin:5px 0; }
  .chars { display:flex; gap:10px; flex-wrap:wrap; }
  .ch { width:56px; height:56px; display:flex; align-items:center; justify-content:center; font-size:28px;
        border:1px solid var(--line); border-radius:10px; background:#fff; color:var(--ink); text-decoration:none; }
  .words { display:flex; flex-wrap:wrap; gap:10px; }
  .word { border:1px solid var(--line); border-radius:8px; padding:7px 14px; font-size:18px; color:var(--accent); text-decoration:none; background:#fff; }
  .cta { margin-top:30px; border:1px solid var(--line); border-radius:14px; padding:18px 22px; display:flex; gap:16px; align-items:center; justify-content:space-between; flex-wrap:wrap; background:#fff; }
  .cta a.primary { background:var(--accent); color:#fff; text-decoration:none; padding:10px 18px; border-radius:9px; }
  footer { text-align:center; color:var(--muted); font-size:13px; padding:18px; }
  @media (max-width:640px){ h1{font-size:26px} main{padding:18px 14px 36px} svg.glyph{width:70px;height:70px} .vtag{width:44px} }
`;

function page(it) {
  const imgSize = it.chars.length <= 2 ? 96 : it.chars.length <= 4 ? 76 : 64;
  const posOf = (i, n) => (n === 2 ? i * 2
    : n === 3 ? (i < 2 ? i : 2)
      : n === 4 ? i
        : (i < 3 ? i : (i === n - 1 ? 3 : -1)));
  const cntOf = (i, n) => (n === 2 ? 2 : n === 3 ? (i === 2 ? 2 : 1) : 1);

  const rowGlyphs = (v) => `<span class="bimgs">${it.chars.map((c, ci) => {
    const p = posOf(ci, it.n);
    if (p < 0) return recolorGlyph(rawGlyph(`${c}-${v}`), 0, 0);
    return isKeyName(KEY_VER[v], c)
      ? colorWhole(rawGlyph(`${c}-${v}`), PALETTE[p % 4], cntOf(ci, it.n) >= 2 ? PALETTE[(p + 1) % 4] : null)
      : recolorGlyph(rawGlyph(`${c}-${v}`), p, cntOf(ci, it.n));
  }).join('')}</span>`;

  const rows = [
    ['86', '86 版', it.c86, it.r86],
    ['98', '98 版', it.c98, it.r98],
    ['06', '新世纪', it.c06, it.r06],
  ].map(([v, label, code, roots]) => `<div class="brow">
      <span class="vtag">${label}</span>
      ${rowGlyphs(v)}
      <span class="broots">${roots.map((r, i) => `<span style="color:${PALETTE[i % 4]}">${esc(r)}</span>`).join('<span class="plus">+</span>')}</span>
      <span class="bcode">${[...code].map((L, i) => `<span style="color:${PALETTE[i % 4]}">${esc(L)}</span>`).join('')}</span>
    </div>`).join('');

  const related = (byFirst.get(it.chars[0]) || []).filter((w) => w !== it.w).slice(0, 12);
  const desc = `「${it.w}」的五笔编码：86版 ${it.c86}，98版 ${it.c98}，新世纪 ${it.c06}。${ruleText(it.n)}。`;

  return `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(it.w)}五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="https://wubi.iqiusuo.cn/ci/${encodeURIComponent(it.w)}.html">
<style>${CSS}</style>
</head><body>
<header><a href="/">五笔字根 · 笔画着色</a><a href="../char/">全部单字</a></header>
<main>
  <h1>「${esc(it.w)}」的五笔编码与拆分</h1>
  <div class="sub">${lenLabel(it.n)} · 三版编码对照</div>

  <div class="bigbox" style="--gsize:${imgSize}px">${rows}</div>

  <h2>怎么拆</h2>
  <div class="rule">
    <p>${esc(it.w)} = ${it.chars.map((c) => esc(c)).join(' + ')}</p>
    <p>${ruleText(it.n)}：${it.r86.map((r, i) => `${esc(r)}（${esc(it.c86[i] || '')}）`).join(' + ')} → <strong>${esc(it.c86)}</strong></p>
  </div>

  <h2>单字拆分</h2>
  <div class="chars">${it.chars.map((c) => `<a class="ch" href="../char/${encodeURIComponent(c)}.html" title="查看「${esc(c)}」的字形与拆分">${esc(c)}</a>`).join('')}</div>

  <h2>相关词组</h2>
  <div class="words">${related.map((w) => `<a class="word" href="${encodeURIComponent(w)}.html">${esc(w)}</a>`).join('') || '<span class="muted">暂无</span>'}</div>

  <div class="cta">
    <div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div>
    <a class="primary" href="https://wubi.iqiusuo.cn/">打开 wubi.iqiusuo.cn →</a>
  </div>
</main>
<footer>数据来源：Rime 五笔码表 · 五笔大一统方案</footer>
</body></html>`;
}

// ---------- 生成 ----------
const ONLY = process.argv[2] || '';
if (!ONLY) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let list = words;
if (ONLY) list = words.filter((x) => x.w === ONLY);

let n = 0;
for (const it of list) {
  fs.writeFileSync(path.join(OUT, `${it.w}.html`), page(it), 'utf8');
  n += 1;
  if (n % 5000 === 0) console.log(n, 'pages');
}
console.log('total word pages:', n);

// 索引 + sitemap
const indexHtml = (title, arr) => `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · 五笔字根</title>
<style>
 body{margin:0;background:#fbf7ef;color:#2a2320;font-family:'KaiTi','楷体',serif}
 main{max-width:1000px;margin:0 auto;padding:24px 18px 50px}
 h1{font-size:28px;margin:0 0 6px} .sub{color:#8a7b6c;margin-bottom:18px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
 .grid a{display:block;text-align:center;padding:8px 6px;border:1px solid #e6dcc9;border-radius:8px;background:#fffdf8;color:#2a2320;text-decoration:none;font-size:17px}
 .grid a:hover{border-color:#a33c2f;color:#a33c2f}
 .tabs{display:flex;gap:14px;margin-bottom:14px}.tabs a{color:#a33c2f;text-decoration:none}
</style></head><body><main>
<h1>${title}</h1><div class="sub">共 ${arr.length} 条</div>
<div class="tabs"><a href="/ci/">全部</a><a href="/ci/2/">双字</a><a href="/ci/3/">三字</a><a href="/ci/4/">四字</a><a href="/ci/5/">五字</a><a href="/ci/6/">六字</a></div>
<div class="grid">${arr.map((w) => `<a href="${encodeURIComponent(w)}.html">${esc(w)}</a>`).join('')}</div>
</main></body></html>`;

if (!ONLY) {
  const all = words.map((x) => x.w);
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml('全部词组页', all), 'utf8');
  for (const g of [2, 3, 4, 5, 6]) {
    const arr = words.filter((x) => x.n === g).map((x) => x.w);
    if (!arr.length) continue;
    fs.mkdirSync(path.join(OUT, String(g)), { recursive: true });
    fs.writeFileSync(path.join(OUT, String(g), 'index.html'), indexHtml(`${lenLabel(g)}（${arr.length}）`, arr), 'utf8');
  }
  const urls = all.map((w) => `  <url><loc>https://wubi.iqiusuo.cn/ci/${encodeURIComponent(w)}.html</loc></url>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'sitemap-ci.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'tools', 'word-pages.json'), JSON.stringify(all), 'utf8');
  console.log('indexes, sitemap, word-pages.json written');
}
