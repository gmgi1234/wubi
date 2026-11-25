// 把复合字根小图接入动态渲染（char / word 页面）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/data/render.js';
let t = fs.readFileSync(p, 'utf8');

const helper = `
  // 复合字根（多字描述、扩展区字）：有字形就画成小图，不显示文字
  const isFragName = (n) => { const a = [...String(n)]; return a.length !== 1 || a[0].codePointAt(0) > 0xffff; };
  function rootHtml(name, color, size) {
    const g = window.ROOT_GLYPHS && window.ROOT_GLYPHS[name];
    if (isFragName(name) && g) {
      return '<svg class="frag" viewBox="0 0 1024 1024" width="' + (size || 20) + '" height="' + (size || 20) + '" style="vertical-align:-4px"><g transform="translate(0,900) scale(1,-1)"><g transform="translate(512,512) scale(' + g.scale + ') translate(' + (-g.cx) + ',' + (-g.cy) + ')">' + g.paths.map(function (pp) { return '<path d="' + pp + '" fill="' + color + '"/>'; }).join('') + '</g></g></svg>';
    }
    return esc(name);
  }
`;

if (!t.includes('rootHtml(name, color, size)')) {
  t = t.replace('  const svgWrap = (inner, size) =>', helper + '  const svgWrap = (inner, size) =>');
}

// 单字页：字根条 + 展开列表
t = t.replace('<span class="chip" style="color:${PALETTE[k % 4]};border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:15px">${esc(it.r)}</span>',
  '<span class="chip" style="color:${PALETTE[k % 4]};border:1px solid var(--line);border-radius:999px;padding:2px 9px;font-size:15px">${rootHtml(it.r, PALETTE[k % 4], 20)}</span>');
t = t.replace('<span style="color:${PALETTE[k % 4]}">${esc(it.r)}<span style="color:var(--muted);font-size:13px">',
  '<span style="color:${PALETTE[k % 4]}">${rootHtml(it.r, PALETTE[k % 4], 18)}<span style="color:var(--muted);font-size:13px">');

// 词组页：字根行
t = t.replace("const rootHtml = roots.map((r, i) => `<span style=\"color:${PALETTE[i % 4]}\">${esc(r)}</span>`).join('<span class=\"plus\">+</span>');",
  "const rootsHtml = roots.map((r, i) => `<span style=\"color:${PALETTE[i % 4]}\">${rootHtml(r, PALETTE[i % 4], 20)}</span>`).join('<span class=\"plus\">+</span>');");
t = t.replace('<span class="broots">${rootHtml}</span>', '<span class="broots">${rootsHtml}</span>');

// 词组页：怎么拆那一行
t = t.replace("${rec.r86.map((r, i) => `${esc(r)}（${esc(rec.c86[i] || '')}）`).join(' + ')}",
  "${rec.r86.map((r, i) => rootHtml(r, PALETTE[i % 4], 18) + `（${esc(rec.c86[i] || '')}）`).join(' + ')}");

fs.writeFileSync(p, t, 'utf8');
console.log('patched render.js');
console.log('has helper:', t.includes('function rootHtml(name, color, size)'));
console.log('uses rootsHtml:', t.includes('rootsHtml'));
console.log('chips use rootHtml:', t.includes('rootHtml(it.r, PALETTE[k % 4], 20)'));
