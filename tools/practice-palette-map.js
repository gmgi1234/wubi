// 着色改回「按调色板序号」映射，同时兼容两种蓝与灰色
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const start = t.indexOf('function recolorSvg(svg, start, k) {');
const end = t.indexOf('function colorWholeSvg', start);
if (start < 0 || end < 0) { console.log('定位失败'); process.exit(1); }

const replacement = `function recolorSvg(svg, start, k) {
    var MAP = { '#E74C3C': 0, '#FF9800': 1, '#27AE60': 2, '#2980B9': 3, '#3498DB': 3 };
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      if (u === '#555555' || u === '#555' || u === '#CFC8BD' || u === '#999999') return 'fill="' + GRAY + '"';
      var i = MAP[u];
      if (i !== undefined && i < k) return 'fill="' + PALETTE[(start + i) % 4] + '"';
      return 'fill="' + GRAY + '"';
    });
  }

  `;

t = t.slice(0, start) + replacement + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('已改为调色板映射:', t.includes("'#3498DB': 3"));
