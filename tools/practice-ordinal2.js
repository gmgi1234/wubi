// 用顺序映射替换 recolorSvg（适配 CRLF）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const start = t.indexOf('function recolorSvg(svg, start, k) {');
if (start < 0) { console.log('找不到函数'); process.exit(1); }
const endMarker = 'function colorWholeSvg';
const end = t.indexOf(endMarker, start);
if (end < 0) { console.log('找不到结尾'); process.exit(1); }

const replacement = `function recolorSvg(svg, start, k) {
    var order = [];
    svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      if (u === '#555555' || u === '#555' || u === '#CFC8BD' || u === '#999999') return m;
      if (order.indexOf(u) < 0) order.push(u);
      return m;
    });
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      if (u === '#555555' || u === '#555' || u === '#CFC8BD' || u === '#999999') return 'fill="' + GRAY + '"';
      var idx = order.indexOf(u);
      if (idx >= 0 && idx < k) return 'fill="' + PALETTE[(start + idx) % 4] + '"';
      return 'fill="' + GRAY + '"';
    });
  }

  `;

t = t.slice(0, start) + replacement + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('已替换:', t.includes('var order = [];'));
