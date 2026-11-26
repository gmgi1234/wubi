// 动态页面渲染：一个模板 + 数据，地址栏传参
(function () {
  const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'];
  const GRAY = '#cfc8bd';
  const KEY_VER = { '86': 'v86', '98': 'v98', '06': 'v06' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  const CSS = `
  :root { --ink:#2a2320; --muted:#8a7b6c; --line:#e6dcc9; --bg:#fbf7ef; --accent:#a33c2f; --paper:#fffdf8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:12px 20px; display:flex; justify-content:space-between; font-size:15px; }
  header a { color:var(--muted); text-decoration:none; }
  .wsearch { font-family:inherit; font-size:14px; padding:5px 10px; border:1px solid var(--line); border-radius:8px; background:#fffdf8; width:220px; }
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
  .wnav { display:flex; gap:14px; align-items:center; color:var(--accent); font-size:15px; margin-bottom:6px; }
  .wnav a { color:var(--accent); text-decoration:none; }
  .wnav .dim { color:#cfc8bd; }
  .cta { margin-top:30px; border:1px solid var(--line); border-radius:14px; padding:18px 22px; display:flex; gap:16px; align-items:center; justify-content:space-between; flex-wrap:wrap; background:#fff; }
  .cta a.primary { background:var(--accent); color:#fff; text-decoration:none; padding:10px 18px; border-radius:9px; }
  footer { text-align:center; color:var(--muted); font-size:13px; padding:18px; }
  @media (max-width:640px){ h1{font-size:26px} main{padding:18px 14px 36px} svg.glyph{width:70px;height:70px} .vtag{width:44px} }
  `;

  function shell(title, desc, body) {
    document.title = title;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', desc);
    const app = document.getElementById('app');
    app.innerHTML = `<style>${CSS}</style>
      <header><a href="./">五笔字根 · 笔画着色</a><input id="wsearch" class="wsearch" placeholder="搜索词组，回车跳转" autocomplete="off"><span><a href="char/">全部单字</a>　<a href="ci/">全部词组</a></span></header>
      <main>${body}</main>
      <footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>`;
    wireSearch();
  }


  // 复合字根（多字描述、扩展区字）：有字形就画成小图，不显示文字
  const isFragName = (n) => { const a = [...String(n)]; return a.length !== 1 || a[0].codePointAt(0) > 0xffff; };
  function rootHtml(name, color, size) {
    const map = window.FRAG_MAP || {};
    const i = map[name];
    if (isFragName(name) && i !== undefined) {
      const s = size || 20;
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

  const svgWrap = (inner, size) => inner
    ? `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="--gsize:${size || 96}px">${inner}</svg>`
    : '';

  // ---------- 单字页 ----------
  function renderChar(rec) {
    const ch = rec.c;
    const cards = ['06', '86', '98'].map((ver, i) => {
      const d = rec.v[ver];
      if (!d) return '';
      const label = ver === '86' ? '86 版' : ver === '98' ? '98 版' : '新世纪';
      const supIdx = (d.sup || []).map((s) => s.i);
      const codeHtml = d.code.split('').map((L, k) => supIdx.includes(k) ? `<span class="supcode" style="color:#c0392b;border-bottom:2px solid currentColor">${esc(L)}</span>` : esc(L)).join('');
      const chips = d.items.map((it, k) => `<span class="chip" style="color:${PALETTE[k % 4]};border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:15px">${rootHtml(it.r, PALETTE[k % 4], 20)}</span>`).join(' ');
      const supHtml = (d.sup || []).length
        ? `<div class="vsup" style="text-align:center;font-size:12px;color:var(--muted)">补码 ${d.sup.map((s) => `${esc(s.l)}（末笔${esc(s.last)} · ${esc(s.st)}结构）`).join('、')}</div>`
        : '<div class="vsup" style="text-align:center;font-size:12px;color:var(--muted)">无补码</div>';
      const rootLine = d.items.map((it, k) => `<span style="color:${PALETTE[k % 4]}">${rootHtml(it.r, PALETTE[k % 4], 18)}<span style="color:var(--muted);font-size:13px">（${esc(it.l)}）</span></span>`).join('<span class="plus">+</span>');
      return `<div class="vcard" style="flex:1;min-width:240px;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff;margin-bottom:10px">
        <div class="vhead" style="display:flex;justify-content:space-between"><span class="vtag">${label}</span><span class="bcode">${codeHtml}</span></div>
        <div style="text-align:center;margin:8px 0" id="glyph-${ver}"></div>
        <div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${chips}</div>
        ${supHtml}
        <div class="rule" style="margin-top:10px"><p>展开后共 ${d.items.length} 个字根：</p><div>${rootLine}</div></div>
      </div>`;
    }).join('');

    const words = (rec.w || []).map((w) => `<a class="word" href="ci.html?w=${encodeURIComponent(w)}">${esc(w)}</a>`).join('') || '<span style="color:var(--muted)">暂无</span>';
    const rels = (rec.rel || []).map((c) => `<a class="word" href="char.html?c=${encodeURIComponent(c)}">${esc(c)}</a>`).join('') || '<span style="color:var(--muted)">暂无</span>';

    shell(`${ch}字五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根`,
      `「${ch}」的五笔编码：86版 ${rec.v['86'] ? rec.v['86'].code : ''}，98版 ${rec.v['98'] ? rec.v['98'].code : ''}，新世纪 ${rec.v['06'] ? rec.v['06'].code : ''}。`,
      `<h1>「${esc(ch)}」的五笔编码与拆分</h1>
       <div class="sub">读音 ${esc(rec.py || '—')} · 三版编码对照 · 字根拆分 · 笔画着色</div>
       ${'<div class="vers" style="display:flex;gap:16px;flex-wrap:wrap">' + cards + '</div>'}
       <h2>常用词组</h2><div class="words">${words}</div>
       <h2>相关字</h2><div class="words">${rels}</div>
       <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div><a class="primary" href="./">打开五笔查询 →</a></div>`);
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

  function colorWhole(inner, color, nextColor) {
    let matchedSecondary = false;
    const out = inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g, (m, pre, fill, post) => {
      let f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return m;
      if (f.length === 4) f = '#' + f[1] + f[1] + f[2] + f[2] + f[3] + f[3];
      const ok = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'].includes(f);
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
    const same = (a, b) => a === b;

    const rows = [['06', '新世纪', rec.c06, rec.r06], ['86', '86 版', rec.c86, rec.r86], ['98', '98 版', rec.c98, rec.r98]]
      .map(([ver, label, code, roots]) => {
        const imgs = rec.ch.map((c, ci) => {
          const g = glyphs[`${c}-${ver}`] || '';
          const p = posOf(ci);
          if (p < 0) return svgWrap(recolor(g, 0, 0), 96);
          const isKey = (rec.keyIdx && rec.keyIdx[`${c}-${ver}`]);
          const isKeyName = (rec.keyName && rec.keyName[`${c}-${ver}`]);
          if (isKeyName && cntOf(ci) >= 2) {
            return svgWrap(colorWholeDashed(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);
          }
          if (isKey && cntOf(ci) >= 2) return svgWrap(colorWhole(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);
          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci)), 96);
        }).join('');
        const rootsHtml = roots.map((r, i) => `<span style="color:${PALETTE[i % 4]}">${rootHtml(r, PALETTE[i % 4], 20)}</span>`).join('<span class="plus">+</span>');
        const codeHtml = code.split('').map((L, i) => `<span style="color:${PALETTE[i % 4]}">${esc(L)}</span>`).join('');
        return `<div class="brow"><span class="vtag">${label}</span><span class="bimgs">${imgs}</span><span class="broots">${rootsHtml}</span><span class="bcode">${codeHtml}</span></div>`;
      }).join('');

    const rule = (n === 2 ? '双字词：每个字取前两码' : n === 3 ? '三字词：前两字各取首码，最后一字取前两码'
      : n === 4 ? '四字词：每个字取首码' : '五字及以上：前三字各取首码，最后一字取首码');

    shell(`${rec.w}五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根`,
      `「${rec.w}」的五笔编码：86版 ${rec.c86}，98版 ${rec.c98}，新世纪 ${rec.c06}。${rule}。`,
      `${(rec.prev || rec.next) ? `<div class="wnav">${rec.prev ? `<a href="ci.html?w=${encodeURIComponent(rec.prev)}">← ${esc(rec.prev)}</a>` : '<span class="dim">←</span>'}<a href="ci/">全部词组</a>${rec.next ? `<a href="ci.html?w=${encodeURIComponent(rec.next)}">${esc(rec.next)} →</a>` : '<span class="dim">→</span>'}</div>` : ''}
       <h1>「${esc(rec.w)}」的五笔编码与拆分</h1>
       <div class="sub">${n} 字词 · 三版编码对照</div>
       <div class="bigbox" style="--gsize:96px">${rows}</div>
       <h2>怎么拆</h2>
       <div class="rule"><p>${esc(rec.w)} = ${rec.ch.map((c) => esc(c)).join(' + ')}</p>
       <p>${rule}：${rec.r86.map((r, i) => rootHtml(r, PALETTE[i % 4], 18) + `（${esc(rec.c86[i] || '')}）`).join(' + ')} → <strong>${esc(rec.c86)}</strong></p></div>
       <div id="mean-slot"></div>
       <h2>单字拆分</h2>
       <div class="chars">${rec.ch.map((c) => `<a class="ch" href="char.html?c=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</div>
       <h2>相关词组</h2>
       <div class="words">${(rec.rel || []).length ? rec.rel.map((w) => `<a class="word" href="ci.html?w=${encodeURIComponent(w)}">${esc(w)}</a>`).join('') : '<span style="color:var(--muted)">暂无</span>'}</div>
       <div class="cta"><div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div><a class="primary" href="./">打开五笔查询 →</a></div>`);
  }

  window.WubiRender = { renderChar, renderWord, svgWrap };
})();
