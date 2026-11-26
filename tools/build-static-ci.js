// 重新生成 5,000 个静态词组页（与动态页规则一致：键名字重复取根、复合字根画小图）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'ci');
const SVG = path.join(ROOT, 'svg');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const keep = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8'));
const glyphLib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));
const wordMeanings = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-meanings.json'), 'utf8'));

const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'];
const GRAY = '#cfc8bd';
const KEY_VER = { '86': 'v86', '98': 'v98', '06': 'v06' };
const KEY_NAMES = new Set('王土大木工目日口田山禾白月人金言立水火之已子女又纟'.split(''));
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const byWord = new Map(words.map((x) => [x.w, x]));
const byFirst = new Map();
for (const w of keep) {
  const k = [...w][0];
  if (!byFirst.has(k)) byFirst.set(k, []);
  byFirst.get(k).push(w);
}
for (const arr of byFirst.values()) arr.sort((a, b) => [...a].length - [...b].length || a.localeCompare(b));

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

function rootsTaken(c, v, k) {
  if (KEY_NAMES.has(c)) return Array.from({ length: k }, () => c);
  const e = (tables[v] || {})[c] || {};
  const ex = expand(v, e.r || []);
  if (!ex.length) return Array.from({ length: k }, () => c);
  return Array.from({ length: k }, (_, i) => ex[Math.min(i, ex.length - 1)]);
}

function wordRootsOf(chars, v) {
  const n = chars.length;
  if (n === 2) return [...rootsTaken(chars[0], v, 2), ...rootsTaken(chars[1], v, 2)];
  if (n === 3) return [...rootsTaken(chars[0], v, 1), ...rootsTaken(chars[1], v, 1), ...rootsTaken(chars[2], v, 2)];
  if (n === 4) return chars.map((c) => rootsTaken(c, v, 1)[0]);
  return [rootsTaken(chars[0], v, 1)[0], rootsTaken(chars[1], v, 1)[0], rootsTaken(chars[2], v, 1)[0], rootsTaken(chars[n - 1], v, 1)[0]];
}

// 复合字根小图
function fragIcon(name, color, size = 20) {
  const i = fragMap[name];
  if (!isFrag(name) || i === undefined) return esc(name);
  return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}" style="color:${color};vertical-align:-4px"><use href="../data/frag-sprite.svg#frag-${i}"/></svg>`;
}

// 单字彩色字形（去掉补码虚线）
const svgCache = new Map();
function glyph(ch, ver) {
  const key = `${ch}-${ver}`;
  if (svgCache.has(key)) return svgCache.get(key);
  let s = '';
  try {
    s = fs.readFileSync(path.join(SVG, `${key}.svg`), 'utf8')
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<path[^>]*stroke="#c0392b"[^>]*\/>/g, '')
      .replace(/<svg([^>]*)>/, (m, attrs) => `<svg class="glyph"${attrs.replace(/\s*xmlns="[^"]*"/g, '')} xmlns="http://www.w3.org/2000/svg">`);
  } catch (e) { s = ''; }
  svgCache.set(key, s);
  return s;
}

function recolor(svg, startPos, count) {
  if (!svg) return '';
  return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, fill) => {
    const up = fill.toUpperCase();
    if (up === '#FFF' || up === '#FFFFFF' || up === '#CFC8BD') return m;
    const idx = PALETTE.indexOf(up);
    if (idx >= 0 && idx < count) return `fill="${PALETTE[(startPos + idx) % 4]}"`;
    return `fill="${GRAY}"`;
  });
}

function dashOnly(svg, color) {
  if (!svg) return '';
  return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
    const f = fill.toUpperCase();
    if (f === '#FFF' || f === '#FFFFFF') return '';
    const dMatch = (pre + post).match(/d="([^"]*)"/);
    if (!dMatch) return '';
    return '<path d="' + dMatch[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
  });
}


  function colorWholeDashed(svg, fillColor, dashColor) {
    return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, function (m, pre, fill, post) {
      var f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return m;
      var d = (pre + post).match(/d="([^"]*)"/);
      var base = '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
      if (!d) return base;
      return base
        + '<path d="' + d[1] + '" fill="none" stroke="#ffffff" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<path d="' + d[1] + '" fill="none" stroke="' + dashColor + '" stroke-width="14" stroke-dasharray="30 18" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }

function colorWhole(svg, color, nextColor) {
  if (!svg) return '';
  let matchedSecondary = false;
  const out = svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
    let f = fill.toUpperCase();
    if (f === '#FFF' || f === '#FFFFFF') return m;
    const dMatch = (pre + post).match(/d="([^"]*)"/);
    const dAttr = dMatch ? `d="${dMatch[1]}"` : '';
    const base = `<path${pre}fill="${color}"${post}/>`;
    if (nextColor && f === '#FF9800') {
      matchedSecondary = true;
      return base
        + `<path ${dAttr} fill="none" stroke="#ffffff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>`
        + `<path ${dAttr} fill="none" stroke="${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    return base;
  });
  if (nextColor && !matchedSecondary) {
            const dashSrc = svg.replace(/<rect[^>]*>/g, '');
    const dash = dashSrc.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      const dMatch = (pre + post).match(/d="([^"]*)"/);
      if (!dMatch) return '';
      return `<path d="${dMatch[1]}" fill="none" stroke="${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    return out + dash;
  }
  return out;
}

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
  .wsearch { font-family:inherit; font-size:14px; padding:5px 10px; border:1px solid var(--line); border-radius:8px; background:#fffdf8; width:220px; }
  .word-nav { display:flex; gap:14px; align-items:center; }
  .word-nav a { color:var(--accent); text-decoration:none; }
  .word-nav .dim { color:#cfc8bd; }
  footer { text-align:center; color:var(--muted); font-size:13px; padding:18px; }
  @media (max-width:640px){ h1{font-size:26px} main{padding:18px 14px 36px} svg.glyph{width:70px;height:70px} .vtag{width:44px} }
`;

const ruleText = (n) => (n === 2 ? '双字词：每个字取前两码' : n === 3 ? '三字词：前两字各取首码，最后一字取前两码'
  : n === 4 ? '四字词：每个字取首码' : '五字及以上：前三字各取首码，最后一字取首码');

let n = 0;
for (let wi = 0; wi < keep.length; wi += 1) {
  const w = keep[wi];
  const prevW = keep[wi - 1] || null;
  const nextW = keep[wi + 1] || null;
  const rec = byWord.get(w);
  if (!rec) continue;
  const chars = rec.chars;
  const len = chars.length;
  const size = len <= 2 ? 96 : len <= 4 ? 76 : 64;
  const posOf = (i) => (len === 2 ? i * 2 : len === 3 ? (i < 2 ? i : 2) : len === 4 ? i : (i < 3 ? i : (i === len - 1 ? 3 : -1)));
  const cntOf = (i) => (len === 2 ? 2 : len === 3 ? (i === 2 ? 2 : 1) : 1);

  const rows = [['06', '新世纪', rec.c06, wordRootsOf(chars, 'v06')], ['86', '86 版', rec.c86, wordRootsOf(chars, 'v86')], ['98', '98 版', rec.c98, wordRootsOf(chars, 'v98')]]
    .map(([ver, label, code, roots]) => {
      const imgs = chars.map((c, ci) => {
        const p = posOf(ci);
        const g = glyph(c, ver);
        if (p < 0) return recolor(g, 0, 0);
        const rArr = (tables[KEY_VER[ver]][c] || {}).r || [];
        const isKeyName = rArr.length === 1 && rArr[0] === c;
        const isKey = rArr[0] === c;
        if (isKeyName && cntOf(ci) >= 2) {
          return colorWholeDashed(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]);
        }
        if (isKey && cntOf(ci) >= 2) return colorWhole(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]);
        return isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci));
      }).join('');
      const rootHtml = roots.map((r, i) => `<span style="color:${PALETTE[i % 4]}">${fragIcon(r, PALETTE[i % 4], 20)}</span>`).join('<span class="plus">+</span>');
      const codeHtml = code.split('').map((L, i) => `<span style="color:${PALETTE[i % 4]}">${esc(L)}</span>`).join('');
      return `<div class="brow"><span class="vtag">${label}</span><span class="bimgs">${imgs}</span><span class="broots">${rootHtml}</span><span class="bcode">${codeHtml}</span></div>`;
    }).join('');

  const related = (byFirst.get(chars[0]) || []).filter((x) => x !== w).slice(0, 12);
  const desc = `「${w}」的五笔编码：86版 ${rec.c86}，98版 ${rec.c98}，新世纪 ${rec.c06}。${ruleText(len)}。`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(w)}五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="https://wubi.iqiusuo.cn/ci/${encodeURIComponent(w)}.html">
<style>${CSS}</style>
</head><body>
<header><a href="../">五笔字根 · 笔画着色</a><input id="wsearch" class="wsearch" placeholder="搜索词组，回车跳转" autocomplete="off"><div class="word-nav">${prevW ? `<a class="nav" href="${encodeURIComponent(prevW)}.html">← ${esc(prevW)}</a>` : '<span class="nav dim">←</span>'}<a href="../ci/">全部词组</a>${nextW ? `<a class="nav" href="${encodeURIComponent(nextW)}.html">${esc(nextW)} →</a>` : '<span class="nav dim">→</span>'}</div></header>
<main>
  <h1>「${esc(w)}」的五笔编码与拆分</h1>
  <div class="sub">${len} 字词 · 三版编码对照</div>
  <div class="bigbox" style="--gsize:${size}px">${rows}</div>
  <h2>怎么拆</h2>
  <div class="rule">
    <p>${esc(w)} = ${chars.map((c) => esc(c)).join(' + ')}</p>
    <p>${ruleText(len)}：${wordRootsOf(chars, 'v86').map((r, i) => `${fragIcon(r, PALETTE[i % 4], 18)}（${esc(rec.c86[i] || '')}）`).join(' + ')} → <strong>${esc(rec.c86)}</strong></p>
  </div>
  ${wordMeanings[w] ? `<h2>释义</h2><div class="rule"><p>${esc(wordMeanings[w])}</p></div>` : ''}
  <h2>单字拆分</h2>
  <div class="chars">${chars.map((c) => `<a class="ch" href="../char.html?c=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</div>
  <h2>相关词组</h2>
  <div class="words">${related.map((x) => `<a class="word" href="../ci.html?w=${encodeURIComponent(x)}">${esc(x)}</a>`).join('') || '<span style="color:var(--muted)">暂无</span>'}</div>
  <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div><a class="primary" href="../">打开五笔查询 →</a></div>
</main>
<footer>数据来源：Rime 五笔码表 · 五笔大一统方案</footer>
<script>(function(){var q=document.getElementById('wsearch');if(!q)return;q.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var v=q.value.trim();if(!v)return;location.href='../ci.html?w='+encodeURIComponent(v);});})();</script>
</body></html>`;

  fs.writeFileSync(path.join(OUT, `${w}.html`), html, 'utf8');
  n += 1;
  if (n % 1000 === 0) console.log(n, 'pages');
}
console.log('static word pages rewritten:', n);
