// 练习页：成字字根占两码时，整字上色 + 第二个字根虚线框
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 读取 cheng 标记
t = t.replace("    var keysStr = w.keys || '';", "    var keysStr = w.keys || '';\r\n    var chengStr = w.cheng || '';");
t = t.replace("    var keysStr = w.keys || '';\n", "    var keysStr = w.keys || '';\n    var chengStr = w.cheng || '';\n");

// 2) 槽位加 data-cheng
const cellOld = "data-k=\"' + k + '\" data-key=\"' + (isKeyName ? '1' : '0') + '\"></span>';";
const cellNew = "data-k=\"' + k + '\" data-key=\"' + (isKeyName ? '1' : '0') + '\" data-cheng=\"' + (chengStr.charAt(i) === '1' ? '1' : '0') + '\"></span>';";
if (t.includes(cellOld)) t = t.replace(cellOld, cellNew);

// 3) 着色分支
const branchOld = `          if (slot.dataset.key === 'dash') {
            out = dashOnlySvg(inner, PALETTE[st % 4]);
          } else if (slot.dataset.key === '1') {
            out = colorWholeSvg(inner, PALETTE[st % 4]);
          } else {
            out = recolorSvg(inner, st, k);
          }`;
const branchNew = `          if (slot.dataset.key === 'dash') {
            out = dashOnlySvg(inner, PALETTE[st % 4]);
          } else if (slot.dataset.key === '1') {
            out = colorWholeSvg(inner, PALETTE[st % 4]);
          } else if (slot.dataset.cheng === '1' && k >= 2) {
            out = colorWholeSvg(inner, PALETTE[st % 4]) + dashOnSecondRoot(inner, PALETTE[(st + 1) % 4]);
          } else {
            out = recolorSvg(inner, st, k);
          }`;
if (t.includes(branchOld)) t = t.replace(branchOld, branchNew);
else console.log('未找到着色分支');

// 4) 新增 dashOnSecondRoot（只给原橙色字根描虚线）
if (!t.includes('function dashOnSecondRoot')) {
  const fn = `
  function dashOnSecondRoot(svg, color) {
    return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, function (m, pre, fill, post) {
      var f = fill.toUpperCase();
      if (f !== '#FF9800') return '';
      var d = (pre + post).match(/d="([^"]*)"/);
      if (!d) return '';
      return '<path d="' + d[1] + '" fill="none" stroke="#ffffff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>' +
             '<path d="' + d[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }
`;
  t = t.replace('  function dashOnlySvg(', fn + '\r\n  function dashOnlySvg(');
}

fs.writeFileSync(p, t, 'utf8');
console.log('cheng 支持:', t.includes('chengStr'), '| 函数:', t.includes('function dashOnSecondRoot'), '| 分支:', t.includes("dataset.cheng === '1'"));
