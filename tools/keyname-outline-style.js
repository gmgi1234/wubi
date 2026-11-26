// 键名字的虚线改为「沿笔画描边」的样式（和米/西一致：白晕 + 彩色虚线）
const fs = require('node:fs');

const oldTail = `      return '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
    }) + '<rect x="64" y="64" width="896" height="896" rx="64" fill="none" stroke="' + dashColor + '" stroke-width="18" stroke-dasharray="40 24"/>';`;

const newTail = `      var base = '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
      if (!d) return base;
      return base
        + '<path d="' + d[1] + '" fill="none" stroke="#ffffff" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/>'
        + '<path d="' + d[1] + '" fill="none" stroke="' + dashColor + '" stroke-width="14" stroke-dasharray="30 18" stroke-linejoin="round" stroke-linecap="round"/>';
    });`;

for (const f of [
  'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js',
  'D:/Users/10061/Downloads/wubi/data/render.js',
  'D:/Users/10061/Downloads/wubi/practice.html',
]) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('stroke-dasharray="30 18"') && t.includes(oldTail)) {
    t = t.replace(oldTail, newTail);
    fs.writeFileSync(f, t, 'utf8');
    console.log(f.split('/').pop(), '已改为描边样式');
  } else {
    console.log(f.split('/').pop(), t.includes('stroke-dasharray="30 18"') ? '已是描边样式' : '未匹配');
  }
}
