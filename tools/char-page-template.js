// Shared character-page template (used by both the single-page builder and the batch builder).
// styles: plain | copybook | blackboard | card

const fs = require('node:fs');
const path = require('node:path');

// 复合字根的图形库（从包含它的字里借笔画，已做归一化）
let GLYPH_LIB = {};
try {
  GLYPH_LIB = JSON.parse(fs.readFileSync(path.join(__dirname, 'root-glyphs.json'), 'utf8'));
} catch (e) {
  GLYPH_LIB = {};
}

const THEMES = {
  plain: `
  :root { --ink:#1f2430; --muted:#6b7486; --line:#e3e7ee; --bg:#fff; --accent:#2f6f8f; --paper:#fff; }
  `,
  copybook: `
  :root { --ink:#2a2320; --muted:#8a7b6c; --line:#e6dcc9; --bg:#fbf7ef; --accent:#a33c2f; --paper:#fffdf8; }
  body { background:var(--bg); }
  main { background:var(--paper); box-shadow:0 0 0 1px var(--line); border-radius:16px; margin-top:18px; }
  .art { position:relative; }
  .art::before { content:''; position:absolute; inset:0; pointer-events:none;
    background-image:linear-gradient(var(--line) 1px, transparent 1px),linear-gradient(90deg,var(--line) 1px, transparent 1px);
    background-size:25% 25%; opacity:.55; }
  h1, h2 { letter-spacing:2px; }
  `,
  blackboard: `
  :root { --ink:#eef3ee; --muted:#a8b8ae; --line:#2f4a40; --bg:#1d322b; --accent:#f0d48a; --paper:#22392f; }
  body { background:var(--bg); color:var(--ink); }
  .vcard, .krow, .rule-ver, .cta { background:#25402f !important; border-color:#33513f !important; }
  .word, .rel, .kroot, .chip, .kvtag { background:#2a4736 !important; border-color:#3a5a47 !important; color:#e8f0e8 !important; }
  .art { border-color:#33513f !important; }
  header { border-color:#33513f; }
  footer { border-color:#33513f; }
  .rule-ver code, .vhead .vcode { color:#f0d48a !important; }
  `,
  card: `
  :root { --ink:#1f2430; --muted:#6b7486; --line:#e6e9ef; --bg:#f4f6f9; --accent:#2f6f8f; --paper:#fff; }
  body { background:var(--bg); }
  .vcard, .krow, .rule-ver { background:var(--paper) !important; box-shadow:0 2px 10px rgba(31,36,48,.06); border-color:#e9edf3 !important; }
  .cta { background:var(--paper) !important; box-shadow:0 2px 10px rgba(31,36,48,.06); }
  .kkey { background:#f7f9fc; }
  `,
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function renderPage({ ch, info, meta, prev, next, rootData, tables, style = 'plain', available = null, pool = null, wordPages = null }) {
  const isFragmentName = (name) => {
    const chars = [...String(name)];
    return chars.length !== 1 || chars[0].codePointAt(0) > 0xffff;
  };

  // 某个版本里某字根对应的笔画颜色
  const rootColorFor = (v, ri) => {
    const d = info.versions[v];
    if (!d) return '#555';
    const first = (d.map || []).findIndex((x) => x === ri);
    const s = (d.strokes || []).find((x) => x.i === first);
    return s ? s.fill : '#555';
  };

  // 片段小图：优先用当前字自己的笔画；没有就用图形库（借其他字的笔画）
  const fragIcon = (v, ri, color, size = 20) => {
    const d = info.versions[v];
    if (!d) return '';
    const item = (d.items || [])[ri];
    if (!item || !isFragmentName(item.root)) return '';
    const paths = [];
    for (let si = 0; si < (d.map || []).length; si += 1) {
      if (d.map[si] !== ri) continue;
      const s = (d.strokes || []).find((x) => x.i === si);
      if (s && s.d) paths.push(s.d);
    }
    const c = color || '#2f6f8f';
    if (paths.length) {
      return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}"><g transform="translate(0,900) scale(1,-1)">${paths.map((p) => `<path d="${p}" fill="${c}"/>`).join('')}</g></svg>`;
    }
    const g = GLYPH_LIB[item.root];
    if (g) {
      return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}"><g transform="translate(0,900) scale(1,-1)"><g transform="translate(512,512) scale(${g.scale}) translate(${-g.cx},${-g.cy})">${g.paths.map((p) => `<path d="${p}" fill="${c}"/>`).join('')}</g></g></svg>`;
    }
    return '';
  };

  // 三版卡片
  const versionCards = ['86', '98', '06'].map((v) => {
    const label = v === '86' ? '86 版' : v === '98' ? '98 版' : '新世纪';
    const d = info.versions[v];
    if (!d || !(d.split || []).length) return '';

    const geom = (info.versions['86'].strokes || []).slice().sort((a, b) => a.i - b.i);
    const fills = d.colors && d.colors.length ? d.colors : geom.map((s) => s.fill);
    const hasSup = (d.sup || []).length > 0;
    const lastStroke = hasSup && geom.length ? geom[geom.length - 1] : null;
    const svg = '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)">'
      + geom.map((s, i) => `<path d="${s.d}" fill="${fills[i] || '#555'}"/>`).join('')
      + (lastStroke ? `<path d="${lastStroke.d}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"/>` : '')
      + '</g></svg>';

    const supIdx = (d.sup || []).map((s) => s.i);
    const codeHtml = (d.code || '').split('')
      .map((L, i) => (supIdx.includes(i) ? `<span class="supcode">${esc(L)}</span>` : esc(L)))
      .join('');
    const supHtml = (d.sup || []).length
      ? `<div class="vsup">补码 ${d.sup.map((s) => `${esc(s.letter)}（末笔${esc(s.last)} · ${esc(s.struct)}结构）`).join('、')}</div>`
      : '<div class="vsup">无补码</div>';

    // 字根条
    const seenV = new Set();
    const chips = [];
    const chipNames = new Set();
    for (const s of d.strokes || []) {
      const ri = d.map[s.i];
      if (ri === undefined || ri < 0 || seenV.has(ri)) continue;
      seenV.add(ri);
      const name = (d.items[ri] || {}).root || '';
      if (!name) continue;
      if (isFragmentName(name)) chips.push(`<span class="chip fragchip">${fragIcon(v, ri, s.fill, 26)}</span>`);
      else chips.push(`<span class="chip"><i style="background:${s.fill}"></i>${esc(name)}</span>`);
      chipNames.add(name);
    }
    for (const it of d.items || []) {
      if (!it.root || chipNames.has(it.root)) continue;
      const i = d.items.indexOf(it);
      const color = rootColorFor(v, i);
      if (isFragmentName(it.root)) chips.push(`<span class="chip fragchip">${fragIcon(v, i, color, 26)}</span>`);
      else chips.push(`<span class="chip"><i style="background:${color}"></i>${esc(it.root)}</span>`);
      chipNames.add(it.root);
    }

    // 展开说明里的片段：用墨水色小图代替文字（不抢颜色）
    const mono = (name, size = 18) => {
      const i = (d.items || []).findIndex((it) => it.root === name);
      if (i >= 0) {
        const paths = [];
        for (let si = 0; si < (d.map || []).length; si += 1) {
          if (d.map[si] !== i) continue;
          const s = (d.strokes || []).find((x) => x.i === si);
          if (s && s.d) paths.push(s.d);
        }
        if (paths.length) {
          return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}"><g transform="translate(0,900) scale(1,-1)">${paths.map((p) => `<path d="${p}" fill="#3a3330"/>`).join('')}</g></svg>`;
        }
      }
      const g = GLYPH_LIB[name];
      if (g) {
        return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}"><g transform="translate(0,900) scale(1,-1)"><g transform="translate(512,512) scale(${g.scale}) translate(${-g.cx},${-g.cy})">${g.paths.map((p) => `<path d="${p}" fill="#3a3330"/>`).join('')}</g></g></svg>`;
      }
      return esc(name);
    };

    const subHtml = (d.subs || []).length
      ? `<p>其中 ${d.subs.map((s) => `${isFragmentName(s.root) ? mono(s.root) : esc(s.root)} → ${s.ex.map((r) => (isFragmentName(r) ? mono(r) : esc(r))).join(' + ')}`).join('；')}，继续展开。</p>`
      : '';
    const itemsHtml = (d.items || []).map((it, i) => {
      const color = rootColorFor(v, i);
      if (isFragmentName(it.root)) {
        return `<span class="ritem" style="color:${color}">${fragIcon(v, i, color, 18)}<span class="rletter">（${esc(it.letter || '')}）</span></span>`;
      }
      return `<span class="ritem" style="color:${color}">${esc(it.root)}<span class="rletter">（${esc(it.letter || '')}）</span></span>`;
    }).join('<span class="rplus">+</span>');

    return `<div class="vcard">
      <div class="vhead"><span class="vtag">${label}</span><span class="vcode">${codeHtml}</span></div>
      <div class="art">${svg}</div>
      <div class="chips">${chips.join('')}</div>
      ${supHtml}
      <div class="rule-ver">
        <p>展开后共 ${(d.items || []).length} 个字根：</p>
        <div class="rlist">${itemsHtml}</div>
        ${subHtml}
      </div>
    </div>`;
  }).join('');

  // 涉及的键位
  const keyLetters = [...new Set(['86', '98', '06'].flatMap((v) => (info.versions[v].code || '').toUpperCase().split('')))]
    .filter((k) => /[A-Z]/.test(k));
  const VER_DATA = [
    { v: '86', label: '86 版', kouju: rootData.WUBI_KOuju_86, roots: rootData.WUBI_ROOT_TABLE_86, names: rootData.KEY_NAMES },
    { v: '98', label: '98 版', kouju: rootData.WUBI_KOuju_98, roots: rootData.WUBI_ROOT_TABLE_98, names: rootData.KEY_NAMES_98 },
    { v: '06', label: '新世纪', kouju: rootData.WUBI_KOuju_06, roots: rootData.WUBI_ROOT_TABLE_06, names: rootData.KEY_NAMES_06 },
  ];
  const keysHtml = keyLetters.map((k) => {
    const perVer = VER_DATA.map((vd) => {
      const rootsStr = (vd.roots && vd.roots[k]) || '';
      return { vd, roots: (rootsStr.match(/\[[^\]]+\]|./gu) || []).filter(Boolean).map((r) => r.replace(/^\[|\]$/g, '')) };
    });
    const countIn = (name) => perVer.filter((p) => p.roots.includes(name)).length;
    const blocks = perVer.map(({ vd, roots }) => {
      const name = (vd.names && vd.names[k]) || '';
      const kouju = (vd.kouju && vd.kouju[k]) || '';
      const fragIdx = new Map();
      (info.versions[vd.v].items || []).forEach((it, i) => {
        if (it.root && isFragmentName(it.root)) fragIdx.set(it.root, i);
      });
      const chips = roots.map((r) => {
        const diff = countIn(r) < 3;
        if (fragIdx.has(r)) {
          const i = fragIdx.get(r);
          return `<span class="kroot kfrag${diff ? ' diff' : ''}">${fragIcon(vd.v, i, rootColorFor(vd.v, i), 26)}</span>`;
        }
        const lib = GLYPH_LIB[r];
        if (lib) {
          const c = diff ? '#a5680f' : '#5a6270';
          return `<span class="kroot kfrag${diff ? ' diff' : ''}"><svg class="frag" viewBox="0 0 1024 1024" width="26" height="26"><g transform="translate(0,900) scale(1,-1)"><g transform="translate(512,512) scale(${lib.scale}) translate(${-lib.cx},${-lib.cy})">${lib.paths.map((p) => `<path d="${p}" fill="${c}"/>`).join('')}</g></g></svg></span>`;
        }
        // 画不出来的复合字根（没有字形库）直接不显示，避免又出现文字描述
        if (isFragmentName(r)) return '';
        return `<span class="kroot${diff ? ' diff' : ''}">${esc(r)}</span>`;
      }).join('');
      return `<details class="kv" open>
        <summary><span class="kvtag">${vd.label}</span><span class="kvname">${esc(name)}</span><span class="kvkouju">${esc(kouju)}</span></summary>
        <div class="kroots">${chips}</div>
      </details>`;
    }).join('');
    return `<div class="krow"><div class="kkey">${esc(k)}</div><div class="kbody">${blocks}</div></div>`;
  }).join('');

  const wordsHtml = (meta.words && meta.words.length)
    ? meta.words.map((w) => {
      if (wordPages && wordPages.has(w)) {
        return `<a class="word" href="../ci/${encodeURIComponent(w)}.html" title="查看「${esc(w)}」的词组编码与拆分">${esc(w)}</a>`;
      }
      return `<span class="word" title="暂无词组页">${esc(w)}</span>`;
    }).join('')
    : '<span class="muted">暂无</span>';
  // 相关字：只链到已经生成页面的字，且用相对路径（本地打开也能跳转）
  const relatedPool = (meta.related || []).filter((c) => !available || available.has(c));
  // 不够 6 个时，用同首码的常用字补上，保证每页都有可点的相关字
  if (pool && relatedPool.length < 6) {
    const firstCode = (info.versions['86'].code || '')[0] || '';
    const seen = new Set([ch, ...relatedPool]);
    for (const c of pool) {
      if (relatedPool.length >= 6) break;
      if (seen.has(c)) continue;
      const e = tables.v86[c] || {};
      if (((e.c || '')[0] || '') !== firstCode) continue;
      relatedPool.push(c);
      seen.add(c);
    }
  }
  const relatedHtml = relatedPool.length
    ? relatedPool.slice(0, 8).map((c) => `<a class="rel" href="${encodeURIComponent(c)}.html" title="查看「${esc(c)}」的编码与拆分">${esc(c)}</a>`).join('')
    : '<span class="muted">暂无</span>';

  const navPrev = prev ? `<a class="nav" href="/char/${encodeURIComponent(prev)}.html">← ${esc(prev)}</a>` : '';
  const navNext = next ? `<a class="nav" href="/char/${encodeURIComponent(next)}.html">${esc(next)} →</a>` : '';

  const v86 = info.versions['86'];
  const title = `${ch}字五笔怎么打？86/98/新世纪编码与拆分`;
  const description = `「${esc(ch)}」的五笔编码：86版 ${esc(v86.code)}，98版 ${esc(info.versions['98'].code)}，新世纪 ${esc(info.versions['06'].code)}。三版拆分：86 版 ${esc(v86.split.join('+'))}、98 版 ${esc(info.versions['98'].split.join('+'))}、新世纪 ${esc(info.versions['06'].split.join('+'))}。附笔画着色图、取码规则、常用词组与相关字。`;

  return `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · 五笔字根</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://wubi.iqiusuo.cn/char/${encodeURIComponent(ch)}.html">
<style>
  :root { --ink:#1f2430; --muted:#6b7486; --line:#e3e7ee; --bg:#fff; --accent:#2f6f8f; --paper:#fff; }
${THEMES[style] || ''}
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:12px 20px; display:flex; justify-content:space-between; align-items:center; font-size:15px; }
  header a { color:var(--muted); text-decoration:none; }
  .navbar { display:flex; gap:18px; align-items:center; }
  .navbar .nav { color:var(--accent); }
  main { max-width:900px; margin:0 auto; padding:26px 20px 60px; }
  h1 { font-size:34px; margin:0 0 6px; }
  .sub { color:var(--muted); font-size:16px; margin-bottom:24px; }
  .py { font-family:"Segoe UI",Arial,sans-serif; }
  .hero { margin-bottom:26px; }
  .vers { display:flex; gap:18px; flex-wrap:wrap; }
  .vcard { flex:1; min-width:240px; border:1px solid var(--line); border-radius:14px; padding:12px 14px 14px; background:var(--paper); }
  .vhead { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; }
  .vhead .vtag { color:var(--muted); font-size:15px; }
  .vhead .vcode { font-family:ui-monospace,Consolas,monospace; font-size:16px; color:var(--accent); }
  .vhead .supcode { color:#c0392b; border-bottom:2px solid currentColor; }
  .vsup { text-align:center; font-size:12px; color:var(--muted); margin:2px 0 6px; }
  .art { width:100%; max-width:280px; aspect-ratio:1; margin:0 auto 10px; border:1px solid var(--line); border-radius:10px; overflow:hidden; background:#fff; }
  .art svg { width:100%; height:100%; display:block; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; justify-content:center; }
  .chip { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--line); border-radius:999px; padding:3px 9px; font-size:15px; white-space:nowrap; background:var(--paper); }
  .chip i { width:13px; height:13px; border-radius:3px; display:inline-block; flex:0 0 auto; }
  .chip.fragchip { padding:3px 8px; }
  svg.frag { background:none; box-shadow:none; padding:0; vertical-align:-6px; margin-right:0; }
  .rule-ver { margin-top:10px; text-align:left; background:var(--paper); border:1px solid var(--line); border-radius:10px; padding:8px 12px; }
  .rule-ver p { margin:4px 0; font-size:14px; }
  .rlist { display:flex; flex-wrap:wrap; gap:4px 8px; margin-top:4px; align-items:center; }
  .ritem { font-size:15px; display:inline-flex; align-items:center; gap:3px; }
  .rplus { color:var(--muted); font-size:14px; }
  .rletter { color:var(--muted); font-size:13px; }
  h2 { font-size:21px; margin:32px 0 12px; }
  p { margin:8px 0; }
  .keys { display:flex; gap:12px; flex-wrap:wrap; align-items:stretch; }
  .krow { flex:1 1 170px; min-width:170px; display:flex; flex-direction:column; gap:8px; border:1px solid var(--line); border-radius:12px; padding:12px 14px; background:var(--paper); }
  .kkey { width:36px; height:36px; flex:0 0 36px; border-radius:8px; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:700; color:var(--accent); background:var(--paper); }
  .kbody { flex:1; width:100%; }
  .kv { border-top:1px dashed var(--line); padding-top:6px; margin-top:2px; }
  .kv:first-child { border-top:0; padding-top:0; margin-top:0; }
  .kv summary { cursor:pointer; list-style:none; display:flex; gap:6px; align-items:baseline; flex-wrap:wrap; font-size:14px; }
  .kv summary::-webkit-details-marker { display:none; }
  .kvtag { color:var(--muted); font-size:12px; border:1px solid var(--line); border-radius:4px; padding:0 5px; background:var(--paper); }
  .kvname { font-weight:700; }
  .kvkouju { color:var(--muted); font-size:13px; }
  .kroots { display:flex; flex-wrap:wrap; gap:4px; margin-top:5px; }
  .kroot { font-size:14px; border:1px solid var(--line); border-radius:6px; padding:0 5px; background:var(--paper); }
  .kroot.diff { border-color:#e2a03f; background:#fff6e6; color:#a5680f; }
  .kroot.kfrag { padding:2px 5px; }
  .words, .rels { display:flex; flex-wrap:wrap; gap:10px; }
  .word, .rel { border:1px solid var(--line); border-radius:8px; padding:7px 14px; font-size:18px; color:var(--accent); text-decoration:none; background:var(--paper); }
  .rel { font-size:22px; padding:4px 12px; }
  .muted { color:var(--muted); }
  .links a { color:var(--accent); text-decoration:none; margin-right:14px; }
  .cta { margin-top:34px; border:1px solid var(--line); border-radius:14px; padding:20px 24px; display:flex; gap:18px; align-items:center; justify-content:space-between; flex-wrap:wrap; background:var(--paper); }
  .cta a.primary { background:var(--accent); color:#fff; text-decoration:none; padding:11px 20px; border-radius:9px; font-size:17px; white-space:nowrap; }
  .cta a.secondary { color:var(--muted); text-decoration:none; padding:10px 16px; border-radius:9px; border:1px dashed var(--line); font-size:15px; }
  footer { border-top:1px solid var(--line); padding:18px 20px; color:var(--muted); font-size:14px; text-align:center; }
  @media (max-width: 640px) {
    header { padding:10px 14px; font-size:13px; gap:8px; }
    .navbar { gap:10px; }
    main { padding:18px 14px 44px; }
    h1 { font-size:26px; line-height:1.35; }
    .sub { font-size:13px; margin-bottom:16px; }
    .vcard { padding:10px 10px 12px; }
    .vhead .vcode { font-size:15px; }
    .rule-ver { padding:6px 10px; }
    .rule-ver p, .rlist { font-size:13px; }
    .krow { flex:1 1 100%; min-width:0; }
    .kroot { font-size:13px; }
    .word, .rel { font-size:16px; padding:6px 12px; }
    .rel { font-size:20px; }
    .cta { flex-direction:column; align-items:flex-start; }
    .cta a.primary, .cta a.secondary { width:100%; text-align:center; }
  }
</style>
</head><body>
<header>
  <a href="/">五笔字根 · 笔画着色</a>
  <div class="navbar">${navPrev}<a href="/">查其它字</a>${navNext}</div>
</header>
<main>
  <h1>「${esc(ch)}」的五笔编码与拆分</h1>
  <div class="sub">读音 <span class="py">${esc(info.pinyin || '—')}</span> · 三版编码对照 · 字根拆分 · 笔画着色 · 三版编码在五笔大一统方案里都能出字</div>

  <div class="hero"><div class="vers">${versionCards}</div></div>

  <h2>涉及的键位</h2>
  <div class="keys">${keysHtml}</div>

  <h2>常用词组</h2>
  <div class="words">${wordsHtml}</div>

  <h2>相关字</h2>
  <div class="rels">${relatedHtml}</div>

  <h2>相关</h2>
  <p class="links">
    <a href="/">查其它字</a>
    <a href="/">三版编码对照</a>
    <a href="/">字根速查表</a>
  </p>

  <div class="cta">
    <div>
      <strong>想边看边学？</strong><br>
      在网页版里输入任意汉字，可以看到笔画着色、字根高亮、笔顺演示和三版对比。
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a class="secondary" href="#" title="即将上线">下载练习册（即将上线）</a>
      <a class="primary" href="https://wubi.iqiusuo.cn/">打开 wubi.iqiusuo.cn →</a>
    </div>
  </div>
</main>
<footer>数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）</footer>
</body></html>`;
}

module.exports = { renderPage, THEMES };
