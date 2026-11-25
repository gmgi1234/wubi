// 键名字占两码时：拆成两个字形格子（实心 + 虚线框），并给词组页加前后导航
const fs = require('node:fs');

// ---------- 1) 静态词组生成器 ----------
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');

if (!s.includes('function dashOnly')) {
  s = s.replace(
    'function colorWhole(svg, color, nextColor) {',
    `function dashOnly(svg, color) {
  if (!svg) return '';
  return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
    const f = fill.toUpperCase();
    if (f === '#FFF' || f === '#FFFFFF') return '';
    const dMatch = (pre + post).match(/d="([^"]*)"/);
    if (!dMatch) return '';
    return '<path d="' + dMatch[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
  });
}

function colorWhole(svg, color, nextColor) {`
  );
}

// 键名字：两码 → 两个格子
s = s.replace(
  "        return isKey ? colorWhole(g, PALETTE[p % 4], cntOf(ci) >= 2 ? PALETTE[(p + 1) % 4] : null) : recolor(g, p, cntOf(ci));",
  `        if (isKey && cntOf(ci) >= 2) {
          return colorWhole(g, PALETTE[p % 4], null) + dashOnly(g, PALETTE[(p + 1) % 4]);
        }
        return isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci));`
);

fs.writeFileSync(sp, s, 'utf8');
console.log('静态生成器已更新');

// ---------- 2) 动态渲染器 ----------
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');

if (!r.includes('function dashOnly')) {
  r = r.replace(
    '  function colorWhole(inner, color, nextColor) {',
    `  function dashOnly(inner, color) {
    return inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      const dMatch = (pre + post).match(/d="([^"]*)"/);
      if (!dMatch) return '';
      return '<path d="' + dMatch[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }

  function colorWhole(inner, color, nextColor) {`
  );
}

r = r.replace(
  "          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], cntOf(ci) >= 2 ? PALETTE[(p + 1) % 4] : null) : recolor(g, p, cntOf(ci)), 96);",
  `          if (isKey && cntOf(ci) >= 2) {
            return svgWrap(colorWhole(g, PALETTE[p % 4], null), 96) + svgWrap(dashOnly(g, PALETTE[(p + 1) % 4]), 96);
          }
          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci)), 96);`
);

fs.writeFileSync(rp, r, 'utf8');
console.log('动态渲染器已更新 | dashOnly:', r.includes('function dashOnly'));
