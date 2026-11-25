// 生成全部单字的静态页（Node 直接拼 HTML，不用浏览器渲染）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'char');
const SVG = path.join(ROOT, 'svg');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));
const pinyin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pinyin-map.json'), 'utf8'));
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));

const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#2980B9'];
const KEY_VER = { '86': 'v86', '98': 'v98', '06': 'v06' };
const SUPP = { G: [1, 1], F: [1, 2], D: [1, 3], H: [2, 1], J: [2, 2], K: [2, 3], T: [3, 1], R: [3, 2], E: [3, 3], Y: [4, 1], U: [4, 2], I: [4, 3], N: [5, 1], B: [5, 2], V: [5, 3] };
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const isFrag = (n) => { const a = [...String(n)]; return a.length !== 1 || a[0].codePointAt(0) > 0xffff; };

function expand(v, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[v] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) out.push(...expand(v, e.r, depth + 1));
    else out.push(r);
  }
  return out;
}

function fragIcon(name, color, size = 20) {
  const i = fragMap[name];
  if (!isFrag(name) || i === undefined) return esc(name);
  return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}" style="color:${color};vertical-align:-4px"><use href="../data/frag-sprite.svg#frag-${i}"/></svg>`;
}

function glyphSvg(ch, ver, size) {
  const p = path.join(SVG, `${ch}-${ver}.svg`);
  if (!fs.existsSync(p)) return '';
  let t = fs.readFileSync(p, 'utf8').replace(/<\?xml[^>]*\?>/g, '').trim();
  t = t.replace(/<svg([^>]*)>/, (m, attrs) => `<svg class="glyph"${attrs.replace(/\s*xmlns="[^"]*"/g, '')} xmlns="http://www.w3.org/2000/svg" style="width:${size}px;height:${size}px">`);
  return t;
}

const CSS = `
 :root{--ink:#2a2320;--muted:#8a7b6c;--line:#e6dcc9;--bg:#fbf7ef;--accent:#a33c2f;--paper:#fffdf8}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--ink);font-family:'KaiTi','楷体','STKaiti',serif;line-height:1.7}
 header{border-bottom:1px solid var(--line);padding:12px 20px;display:flex;justify-content:space-between;font-size:15px}
 header a{color:var(--muted);text-decoration:none}
 main{max-width:900px;margin:18px auto 0;background:var(--paper);box-shadow:0 0 0 1px var(--line);border-radius:16px;padding:26px 22px 44px}
 h1{font-size:32px;margin:0 0 6px;letter-spacing:2px}
 .sub{color:var(--muted);font-size:16px;margin-bottom:20px}
 .vers{display:flex;gap:16px;flex-wrap:wrap}
 .vcard{flex:1;min-width:240px;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}
 .vhead{display:flex;justify-content:space-between;align-items:center}
 .vtag{color:var(--muted);font-size:15px}
 .bcode{font-family:ui-monospace,Consolas,monospace;font-size:20px;letter-spacing:2px}
 .glyphbox{text-align:center;margin:8px 0}
 svg.glyph{border:1px solid var(--line);border-radius:8px;background:#fff}
 .chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
 .chip{border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:15px}
 .vsup{text-align:center;font-size:12px;color:var(--muted);margin-top:6px}
 .rule{background:#faf6ee;border:1px solid var(--line);border-radius:10px;padding:12px 16px;font-size:15px;margin-top:10px}
 .rule p{margin:5px 0}
 h2{font-size:20px;margin:26px 0 10px}
 .words{display:flex;flex-wrap:wrap;gap:10px}
 .word{border:1px solid var(--line);border-radius:8px;padding:7px 14px;font-size:18px;color:var(--accent);text-decoration:none;background:#fff}
 .cta{margin-top:28px;border:1px solid var(--line);border-radius:14px;padding:18px 22px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:#fff}
 .cta a.primary{background:var(--accent);color:#fff;text-decoration:none;padding:10px 18px;border-radius:9px}
 footer{text-align:center;color:var(--muted);font-size:13px;padding:18px}
 @media (max-width:640px){h1{font-size:26px}main{padding:18px 14px 36px}}
`;

const candidates = Object.keys(tables.v86).filter((c) => (tables.v86[c] || {}).c && (tables.v06[c] || {}).c);
// 常用字优先，其余按码表顺序
const rankOf = new Map(ranking.map((c, i) => [c, i]));
candidates.sort((a, b) => (rankOf.has(a) ? rankOf.get(a) : 1e6) - (rankOf.has(b) ? rankOf.get(b) : 1e6));

let n = 0;
for (const ch of candidates) {
  const md = meta[ch] || {};
  const py = pinyin[ch] || '';
  const cards = ['06', '86', '98'].map((ver) => {
    const e = tables[KEY_VER[ver]][ch];
    if (!e || !e.c) return '';
    const label = ver === '86' ? '86 版' : ver === '98' ? '98 版' : '新世纪';
    const roots = expand(KEY_VER[ver], e.r || []);
    const letters = e.c.split('');
    const items = roots.map((r, i) => {
      let pos = -1;
      if (i < 3) pos = i;
      else if (i === roots.length - 1 && roots.length >= 4) pos = letters.length - 1;
      return { r, l: pos >= 0 ? (letters[pos] || '') : '' };
    });
    const supIdx = (e.sup && e.sup.length) ? e.sup.slice() : (roots.length < letters.length && roots.length < 4 ? [letters.length - 1] : []);
    const sup = supIdx.map((i) => {
      const L = letters[i] || '';
      const rev = SUPP[L];
      return `${esc(L)}（末笔${rev ? ['横', '竖', '撇', '捺', '折'][rev[0] - 1] : '—'} · ${rev ? ['左右', '上下', '杂合'][rev[1] - 1] : '—'}结构）`;
    });
    const codeHtml = letters.map((L, k) => `<span style="color:${PALETTE[k % 4]}">${esc(L)}</span>`).join('');
    const chips = items.map((it, k) => `<span class="chip" style="color:${PALETTE[k % 4]}">${fragIcon(it.r, PALETTE[k % 4], 20)}</span>`).join('');
    const rootLine = items.map((it, k) => `<span style="color:${PALETTE[k % 4]}">${fragIcon(it.r, PALETTE[k % 4], 18)}<span style="color:var(--muted);font-size:13px">（${esc(it.l)}）</span></span>`).join('<span style="color:var(--muted);font-size:14px"> + </span>');
    return `<div class="vcard">
      <div class="vhead"><span class="vtag">${label}</span><span class="bcode">${codeHtml}</span></div>
      <div class="glyphbox">${glyphSvg(ch, ver, 200)}</div>
      <div class="chips">${chips}</div>
      <div class="vsup">${sup.length ? '补码 ' + sup.join('、') : '无补码'}</div>
      <div class="rule"><p>展开后共 ${items.length} 个字根：</p><div>${rootLine}</div></div>
    </div>`;
  }).join('');

  const words = (md.words || []).slice(0, 8).map((w) => `<a class="word" href="../ci.html?w=${encodeURIComponent(w)}">${esc(w)}</a>`).join('') || '<span style="color:var(--muted)">暂无</span>';
  const rels = (md.related || []).slice(0, 8).map((c) => `<a class="word" href="../char.html?c=${encodeURIComponent(c)}">${esc(c)}</a>`).join('') || '<span style="color:var(--muted)">暂无</span>';
  const c86 = (tables.v86[ch] || {}).c || '';
  const title = `${ch}字五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根`;
  const desc = `「${ch}」的五笔编码：86版 ${c86}，98版 ${(tables.v98[ch] || {}).c || ''}，新世纪 ${(tables.v06[ch] || {}).c || ''}。字根拆分、笔画着色、取码规则。`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="https://wubi.iqiusuo.cn/char/${encodeURIComponent(ch)}.html">
<style>${CSS}</style>
</head><body>
<header><a href="../">五笔字根 · 笔画着色</a><span><a href="../char/">全部单字</a>　<a href="../ci/">全部词组</a></span></header>
<main>
  <h1>「${esc(ch)}」的五笔编码与拆分</h1>
  <div class="sub">读音 ${esc(py || '—')} · 三版编码对照 · 字根拆分 · 笔画着色</div>
  <div class="vers">${cards}</div>
  <h2>常用词组</h2>
  <div class="words">${words}</div>
  <h2>相关字</h2>
  <div class="words">${rels}</div>
  <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div><a class="primary" href="../">打开五笔查询 →</a></div>
</main>
<footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>
</body></html>`;

  fs.writeFileSync(path.join(OUT, `${ch}.html`), html, 'utf8');
  n += 1;
  if (n % 2000 === 0) console.log(n, 'pages');
}
console.log('static char pages written:', n);
