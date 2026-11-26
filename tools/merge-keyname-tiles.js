// 键名字占两码时合并成一格：整字上色 + 整字虚线（不再拆两格）
const fs = require('node:fs');

const helper = `
  function colorWholeDashed(svg, fillColor, dashColor) {
    return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, function (m, pre, fill, post) {
      var f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return m;
      var d = (pre + post).match(/d="([^"]*)"/);
      var base = '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
      if (!d) return base;
      return base + '<path d="' + d[1] + '" fill="none" stroke="' + dashColor + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }
`;

// ---------- 静态词组页 ----------
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('colorWholeDashed')) {
  s = s.replace('function colorWhole(svg, color, nextColor) {', helper + '\nfunction colorWhole(svg, color, nextColor) {');
  s = s.replace(
    "          return colorWhole(g, PALETTE[p % 4], null) + dashOnly(g, PALETTE[(p + 1) % 4]);",
    "          return colorWholeDashed(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]);"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('静态生成器已合并:', s.includes('colorWholeDashed(g'));
}

// ---------- 动态词组页 ----------
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
if (!r.includes('colorWholeDashed')) {
  r = r.replace('  function colorWhole(inner, color, nextColor) {', helper.replace(/^ {2}/gm, '  ') + '\n  function colorWhole(inner, color, nextColor) {');
  r = r.replace(
    "            return svgWrap(colorWhole(g, PALETTE[p % 4], null), 96) + svgWrap(dashOnly(g, PALETTE[(p + 1) % 4]), 96);",
    "            return svgWrap(colorWholeDashed(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);"
  );
  fs.writeFileSync(rp, r, 'utf8');
  console.log('动态渲染器已合并:', r.includes('colorWholeDashed(g'));
}
