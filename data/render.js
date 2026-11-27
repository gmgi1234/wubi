// 动态页面渲染：DOM 结构与静态页保持一致（CSS 由 data/page-char.css / page-word.css 提供）
(function () {
  const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'];
  const GRAY = '#cfc8bd';
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const enc = encodeURIComponent;
  const VER_LABEL = { '06': '新世纪', '86': '86 版', '98': '98 版' };

  // ---------- 基础工具 ----------
  const isFragName = (n) => { const a = [...String(n)]; return a.length !== 1 || a[0].codePointAt(0) > 0xffff; };
  function rootHtml(name, color, size) {
    const map = window.FRAG_MAP || {};
    const i = map[name];
    if (isFragName(name) && i !== undefined) {
      const s = size || 20;
      const inline = (window.FRAG_SVG || {})[i];
      if (inline) {
        return '<svg class="frag" viewBox="0 0 1024 1024" width="' + s + '" height="' + s + '" style="color:' + color + ';vertical-align:-4px">' + inline + '</svg>';
      }
      return '<svg class="frag" viewBox="0 0 1024 1024" width="' + s + '" height="' + s + '" style="color:' + color + ';vertical-align:-4px"><use href="data/frag-sprite.svg#frag-' + i + '"/></svg>';
    }
    return esc(name);
  }
  function wireSearch() {
    const q = document.getElementById('wsearch');
    if (!q || q.dataset.wired) return;
    q.dataset.wired = '1';
    q.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = q.value.trim();
      if (!v) return;
      location.href = 'ci.html?w=' + encodeURIComponent(v);
    });
  }
  function page(title, desc, header, body, footer) {
    document.title = title;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', desc);
    const app = document.getElementById('app');
    app.innerHTML = header + '<main>' + body + '</main><footer>' + footer + '</footer>';
    wireSearch();
  }
  const svgWrap = (inner, size) => inner
    ? `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="--gsize:${size || 96}px"><rect width="1024" height="1024" fill="#fff"/>${inner}</svg>`
    : '';

  // ---------- 五笔键位数据（data/wubi_roots_all.js，可选） ----------
  function rootTable(ver) {
    if (ver === '86' && typeof WUBI_ROOT_TABLE_86 !== 'undefined') return WUBI_ROOT_TABLE_86;
    if (ver === '98' && typeof WUBI_ROOT_TABLE_98 !== 'undefined') return WUBI_ROOT_TABLE_98;
    if (ver === '06' && typeof WUBI_ROOT_TABLE_06 !== 'undefined') return WUBI_ROOT_TABLE_06;
    return null;
  }
  function keyNames(ver) {
    if (ver === '86' && typeof KEY_NAMES !== 'undefined') return KEY_NAMES;
    if (ver === '98' && typeof KEY_NAMES_98 !== 'undefined') return KEY_NAMES_98;
    if (ver === '06' && typeof KEY_NAMES_06 !== 'undefined') return KEY_NAMES_06;
    return {};
  }
  function keyKouju(ver) {
    if (ver === '86' && typeof WUBI_KOuju_86 !== 'undefined') return WUBI_KOuju_86;
    if (ver === '98' && typeof WUBI_KOuju_98 !== 'undefined') return WUBI_KOuju_98;
    if (ver === '06' && typeof WUBI_KOuju_06 !== 'undefined') return WUBI_KOuju_06;
    return {};
  }
  function parseRoots(str) {
    return (String(str || '').match(/\[[^\]]+\]|./gu) || []).map((x) => x.replace(/^\[|\]$/g, ''));
  }
  function keysSection(rec) {
    const tables = { '86': rootTable('86'), '98': rootTable('98'), '06': rootTable('06') };
    if (!tables['86'] && !tables['98'] && !tables['06']) return '';
    const parsed = { '86': {}, '98': {}, '06': {} };
    ['86', '98', '06'].forEach((v) => {
      const tb = tables[v] || {};
      Object.keys(tb).forEach((L) => { parsed[v][L] = parseRoots(tb[L]); });
    });
    const letters = [];
    ['86', '98', '06'].forEach((v) => {
      const code = rec.v[v] && rec.v[v].code;
      if (!code) return;
      code.split('').forEach((L) => { if (letters.indexOf(L) < 0) letters.push(L); });
    });
    const rows = letters.map((L) => {
      const details = ['86', '98', '06'].map((v) => {
        const roots = parsed[v][L] || [];
        if (!roots.length) return '';
        const kroots = roots.map((r) => {
          let count = 0;
          ['86', '98', '06'].forEach((x) => { if ((parsed[x][L] || []).indexOf(r) >= 0) count += 1; });
          const diff = count < 3 ? ' diff' : '';
          const frag = isFragName(r) && (window.FRAG_MAP || {})[r] !== undefined;
          return frag
            ? `<span class="kroot kfrag${diff}">${rootHtml(r, '#5a6270', 26)}</span>`
            : `<span class="kroot${diff}">${esc(r)}</span>`;
        }).join('');
        const nm = keyNames(v)[L] || '';
        const kj = keyKouju(v)[L] || '';
        return `<details class="kv" open><summary><span class="kvtag">${VER_LABEL[v]}</span><span class="kvname">${esc(nm)}</span><span class="kvkouju">${esc(kj)}</span></summary><div class="kroots">${kroots}</div></details>`;
      }).join('');
      return `<div class="krow"><div class="kkey">${esc(L)}</div><div class="kbody">${details}</div></div>`;
    }).join('');
    return letters.length ? `<h2>涉及的键位</h2><div class="keys">${rows}</div>` : '';
  }

  // ---------- 单字页 ----------
  function renderChar(rec, env) {
    env = env || {};
    const ch = rec.c;
    const cards = ['06', '86', '98'].map((ver) => {
      const d = rec.v[ver];
      if (!d) return '';
      const supIdx = (d.sup || []).map((s) => s.i);
      const vcode = d.code.split('').map((L, k) => supIdx.indexOf(k) >= 0 ? `<span class="supcode">${esc(L)}</span>` : esc(L)).join('');
      const sup = (d.sup || []).length
        ? '补码 ' + d.sup.map((s) => `${esc(s.l)}（末笔${esc(s.last)} · ${esc(s.st)}结构）`).join('、')
        : '无补码';
      const chips = d.items.map((it, k) => {
        const color = it.l ? PALETTE[k % 4] : '#555';
        if (isFragName(it.r) && (window.FRAG_MAP || {})[it.r] !== undefined) {
          return `<span class="chip fragchip">${rootHtml(it.r, color, 26)}</span>`;
        }
        return `<span class="chip"><i style="background:${color}"></i>${esc(it.r)}</span>`;
      }).join('');
      const ritems = d.items.map((it, k) => {
        const color = it.l ? PALETTE[k % 4] : '#555';
        return `<span class="ritem" style="color:${color}">${rootHtml(it.r, color, 18)}<span class="rletter">（${esc(it.l || '')}）</span></span>`;
      }).join('<span class="rplus">+</span>');
      const expand = ((env.expand || {})[ver] || []).map((x) =>
        `<p>其中 ${esc(x.name)} → ${x.roots.map((r) => rootHtml(r, 'inherit', 15)).join(' + ')}，继续展开。</p>`).join('');
      return `<div class="vcard">
        <div class="vhead"><span class="vtag">${VER_LABEL[ver]}</span><span class="vcode">${vcode}</span></div>
        <div class="art" id="glyph-${ver}"></div>
        <div class="chips">${chips}</div>
        <div class="vsup">${sup}</div>
        <div class="rule-ver"><p>展开后共 ${d.items.length} 个字根：</p><div class="rlist">${ritems}</div>${expand}</div>
      </div>`;
    }).join('');

    const words = (rec.w || []).map((w) => `<a class="word" href="ci.html?w=${enc(w)}" title="查看「${esc(w)}」的词组编码与拆分">${esc(w)}</a>`).join('') || '<span class="muted">暂无</span>';
    const rels = (rec.rel || []).map((c) => `<a class="rel" href="char.html?c=${enc(c)}" title="查看「${esc(c)}」的编码与拆分">${esc(c)}</a>`).join('') || '<span class="muted">暂无</span>';
    const prev = env.prev || '';
    const next = env.next || '';

    const header = `<header><a href="./">五笔字根 · 笔画着色</a><div class="navbar">${prev ? `<a class="nav" href="char.html?c=${enc(prev)}">← ${esc(prev)}</a>` : '<span class="dim">←</span>'}<a href="./">查其它字</a>${next ? `<a class="nav" href="char.html?c=${enc(next)}">${esc(next)} →</a>` : '<span class="dim">→</span>'}</div></header>`;
    const body = `<h1>「${esc(ch)}」的五笔编码与拆分</h1>
      <div class="sub">读音 <span class="py">${esc(rec.py || '—')}</span> · 三版编码对照 · 字根拆分 · 笔画着色 · 三版编码在五笔大一统方案里都能出字</div>
      <div class="hero"><div class="vers">${cards}</div></div>
      ${keysSection(rec)}
      <h2>常用词组</h2><div class="words">${words}</div>
      <h2>相关字</h2><div class="rels">${rels}</div>
      <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮、笔顺演示和三版对比。</div><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="secondary" href="#" title="即将上线">下载练习册（即将上线）</a><a class="primary" href="https://wubi.iqiusuo.cn/">打开 wubi.iqiusuo.cn →</a></div></div>`;
    const footer = '数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）';
    page(`${ch}字五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根`,
      `「${ch}」的五笔编码：86版 ${rec.v['86'] ? rec.v['86'].code : ''}，98版 ${rec.v['98'] ? rec.v['98'].code : ''}，新世纪 ${rec.v['06'] ? rec.v['06'].code : ''}。`,
      header, body, footer);
  }

  // ---------- 词组页 ----------
  function dashOnly(inner, color) {
    return inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      const dMatch = (pre + post).match(/d="([^"]*)"/);
      if (!dMatch) return '';
      return '<path d="' + dMatch[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }

  function colorWholeDashed(svg, fillColor, dashColor) {
    return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, function (m, pre, fill, post) {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return m;
      const d = (pre + post).match(/d="([^"]*)"/);
      const base = '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
      if (!d) return base;
      return base
        + '<path d="' + d[1] + '" fill="none" stroke="#ffffff" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<path d="' + d[1] + '" fill="none" stroke="' + dashColor + '" stroke-width="14" stroke-dasharray="30 18" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }

  function colorWhole(inner, color, nextColor) {
    let matchedSecondary = false;
    const out = inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
      let f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return m;
      if (f.length === 4) f = '#' + f[1] + f[1] + f[2] + f[2] + f[3] + f[3];
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
      const dashSrc = inner.replace(/<rect[^>]*>/g, '');
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

  function recolor(inner, startPos, count) {
    return inner.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, fill) => {
      const up = fill.toUpperCase();
      if (up === '#FFF' || up === '#FFFFFF') return m;
      const idx = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'].indexOf(up);
      if (idx >= 0 && idx < count) return `fill="${PALETTE[(startPos + idx) % 4]}"`;
      return `fill="${GRAY}"`;
    });
  }

  function renderWord(rec, glyphs) {
    const n = rec.ch.length;
    const posOf = (i) => (n === 2 ? i * 2 : n === 3 ? (i < 2 ? i : 2) : n === 4 ? i : (i < 3 ? i : (i === n - 1 ? 3 : -1)));
    const cntOf = (i) => (n === 2 ? 2 : n === 3 ? (i === 2 ? 2 : 1) : 1);

    const rows = [['06', '新世纪', rec.c06, rec.r06], ['86', '86 版', rec.c86, rec.r86], ['98', '98 版', rec.c98, rec.r98]]
      .map(([ver, label, code, roots]) => {
        const imgs = rec.ch.map((c, ci) => {
          const g = glyphs[`${c}-${ver}`] || '';
          const p = posOf(ci);
          if (p < 0) return svgWrap(recolor(g, 0, 0), 96);
          const isKey = (rec.keyIdx && rec.keyIdx[`${c}-${ver}`]);
          const isKeyName = (rec.keyName && rec.keyName[`${c}-${ver}`]);
          if (isKeyName && cntOf(ci) >= 2) return svgWrap(colorWholeDashed(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);
          if (isKey && cntOf(ci) >= 2) return svgWrap(colorWhole(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);
          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci)), 96);
        }).join('');
        const rootsHtml = (roots || []).map((r, i) => `<span style="color:${PALETTE[i % 4]}">${rootHtml(r, PALETTE[i % 4], 20)}</span>`).join('<span class="plus">+</span>');
        const codeHtml = code.split('').map((L, i) => `<span style="color:${PALETTE[i % 4]}">${esc(L)}</span>`).join('');
        return `<div class="brow"><span class="vtag">${label}</span><span class="bimgs">${imgs}</span><span class="broots">${rootsHtml}</span><span class="bcode">${codeHtml}</span></div>`;
      }).join('');

    const rule = (n === 2 ? '双字词：每个字取前两码' : n === 3 ? '三字词：前两字各取首码，最后一字取前两码'
      : n === 4 ? '四字词：每个字取首码' : '五字及以上：前三字各取首码，最后一字取首码');
    const prev = rec.prev || '';
    const next = rec.next || '';

    const header = `<header><a href="./">五笔字根 · 笔画着色</a><input id="wsearch" class="wsearch" placeholder="搜索词组，回车跳转" autocomplete="off"><div class="word-nav">${prev ? `<a class="nav" href="ci.html?w=${enc(prev)}">← ${esc(prev)}</a>` : '<span class="dim">←</span>'}<a href="ci/">全部词组</a>${next ? `<a class="nav" href="ci.html?w=${enc(next)}">${esc(next)} →</a>` : '<span class="dim">→</span>'}</div></header>`;
    const body = `<h1>「${esc(rec.w)}」的五笔编码与拆分</h1>
      <div class="sub">${n} 字词 · 三版编码对照</div>
      <div class="bigbox" style="--gsize:96px">${rows}</div>
      <h2>怎么拆</h2>
      <div class="rule"><p>${esc(rec.w)} = ${rec.ch.map((c) => esc(c)).join(' + ')}</p>
      <p>${rule}：${(rec.r86 || []).map((r, i) => rootHtml(r, PALETTE[i % 4], 18) + `（${esc(rec.c86[i] || '')}）`).join(' + ')} → <strong>${esc(rec.c86)}</strong></p></div>
      <div id="mean-slot"></div>
      <h2>单字拆分</h2>
      <div class="chars">${rec.ch.map((c) => `<a class="ch" href="char.html?c=${enc(c)}">${esc(c)}</a>`).join('')}</div>
      <h2>相关词组</h2>
      <div class="words">${(rec.rel || []).length ? rec.rel.map((w) => `<a class="word" href="ci.html?w=${enc(w)}">${esc(w)}</a>`).join('') : '<span class="muted">暂无</span>'}</div>
      <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div><a class="primary" href="./">打开五笔查询 →</a></div>`;
    const footer = '数据来源：Rime 五笔码表 · 五笔大一统方案';
    page(`${rec.w}五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根`,
      `「${rec.w}」的五笔编码：86版 ${rec.c86}，98版 ${rec.c98}，新世纪 ${rec.c06}。${rule}。`,
      header, body, footer);
  }

  // ---- 本地 file:// 字形兜底：按字加载 data/glyph-js/<字>.js + 组码表重建内联 SVG ----
  // 线上（http/https）仍按原样 fetch svg/<字>-<版本>.svg，行为不变
  const SCRIPT_BASE = (function () {
    const s = document.currentScript;
    const u = (s && s.src) || '';
    return u ? u.replace(/render\.js(?:\?.*)?$/, '') : 'data/';
  })();
  const CC_FILL = { '0': '#E74C3C', '1': '#FF9800', '2': '#27AE60', '3': '#3498DB', 'w': '#FFFFFF', 'g': '#CFC8BD', 'c': '#00BCD4' };
  let groupsFallback = null;
  const charPromises = {};

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  // 笔画与组码按字拆分到 data/glyph-js/<字>.js（平均 4KB），
  // 一个词组只加载它用到的几个字，避免每次打开都读 130MB 大包。
  function ensureChar(c) {
    const sd = window.STROKE_DATA;
    if (sd && sd[c] && sd[c].strokes && sd[c].strokes.length) return Promise.resolve();
    if (!charPromises[c]) charPromises[c] = loadScript(SCRIPT_BASE + 'glyph-js/' + encodeURIComponent(c) + '.js');
    return charPromises[c];
  }
  function ensureGroupFallback() {
    if (!groupsFallback) groupsFallback = loadScript(SCRIPT_BASE + 'stroke-groups.js');
    return groupsFallback;
  }

  function innerFromBundle(c, ver) {
    const sd = window.STROKE_DATA;
    if (!sd || !sd[c]) return '';
    const vd = sd[c].v && sd[c].v[ver];
    const strokes = (vd && vd.strokes) || sd[c].strokes || [];
    if (!strokes.length) return '';
    const codes = (vd && vd.codes != null) ? vd.codes : ((window.SVG_GROUPS && window.SVG_GROUPS[c + '|' + ver]) || '');
    let out = '';
    for (let i = 0; i < strokes.length; i++) {
      out += '<path d="' + strokes[i] + '" fill="' + (CC_FILL[codes.charAt(i)] || GRAY) + '"/>';
    }
    return out ? '<g transform="translate(0,900) scale(1,-1)">' + out + '</g>' : out;
  }

  async function glyphInner(c, ver) {
    if (location.protocol !== 'file:') {
      try {
        const r = await fetch('svg/' + encodeURIComponent(c) + '-' + ver + '.svg');
        if (r.ok) {
          const t = await r.text();
          return t.replace(/<path[^>]*stroke="#c0392b"[^>]*\/>/g, '')
                  .replace(/^[\s\S]*?<svg[^>]*>/, '')
                  .replace(/<\/svg>\s*$/, '');
        }
      } catch (e) {}
      return '';
    }
    await ensureChar(c);
    const gr = window.SVG_GROUPS || {};
    if (gr[c + '|86'] === undefined && gr[c + '|98'] === undefined && gr[c + '|06'] === undefined) {
      await ensureGroupFallback();
    }
    return innerFromBundle(c, ver);
  }

  window.WubiRender = { renderChar, renderWord, svgWrap, glyphInner };
})();
