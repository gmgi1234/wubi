// 练习页：键名字合并成一格（整字上色 + 整字虚线）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 新增 colorWholeDashed
if (!t.includes('function colorWholeDashed')) {
  const fn = `
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
  t = t.replace('  function dashOnSecondRoot(', fn + '\r\n  function dashOnSecondRoot(');
}

// 2) 生成槽位时不再加第二个虚线格
const cellOld = `      if (isKeyName) {
        cell += '<span class="zislot" data-c="' + chars[i] + '" data-v="' + ver + '" data-start="' + (startPos + 1) + '" data-k="0" data-key="dash"></span>';
      }
`;
if (t.includes(cellOld)) {
  t = t.replace(cellOld, '');
  console.log('已移除键名字的第二格');
} else {
  console.log('未找到第二格代码');
}

// 3) 着色分支：键名字 → 整字上色 + 整字虚线
t = t.replace(
  "} else if (slot.dataset.key === '1') {\r\n            out = colorWholeSvg(inner, PALETTE[st % 4]);",
  "} else if (slot.dataset.key === '1') {\r\n            out = colorWholeDashed(inner, PALETTE[st % 4], PALETTE[(st + 1) % 4]);"
);
t = t.replace(
  "} else if (slot.dataset.key === '1') {\n            out = colorWholeSvg(inner, PALETTE[st % 4]);",
  "} else if (slot.dataset.key === '1') {\n            out = colorWholeDashed(inner, PALETTE[st % 4], PALETTE[(st + 1) % 4]);"
);

fs.writeFileSync(p, t, 'utf8');
console.log('练习页已合并:', t.includes('colorWholeDashed(inner'), '| 仍有第二格:', t.includes("data-key=\"' + (isKeyName"));
