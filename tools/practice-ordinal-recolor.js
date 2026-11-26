// 练习页着色：按「颜色出现顺序」重映射，避免字形文件配色顺序不一致
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const oldFn = `  function recolorSvg(svg, start, k) {
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      var i = PALETTE.map(function (x) { return x.toUpperCase(); }).indexOf(u);
      if (i >= 0 && i < k) return 'fill="' + PALETTE[(start + i) % 4] + '"';
      return 'fill="' + GRAY + '"';
    });
  }`;

const newFn = `  function recolorSvg(svg, start, k) {
    // 先按出现顺序收集所有彩色（白底、灰色不算），再依次映射到词组的位置色
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
  }`;

if (t.includes(oldFn)) {
  t = t.replace(oldFn, newFn);
  fs.writeFileSync(p, t, 'utf8');
  console.log('recolor 已改为顺序映射');
} else {
  console.log('未找到旧函数');
}
