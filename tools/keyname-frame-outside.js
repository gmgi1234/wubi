// 键名字的虚线框改为整格外框（往外扩，明显可见）
const fs = require('node:fs');

const oldBody = `      var base = '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
      if (!d) return base;
      return base + '<path d="' + d[1] + '" fill="none" stroke="' + dashColor + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });`;

const newBody = `      return '<path' + pre + 'fill="' + fillColor + '"' + post + '/>';
    }) + '<rect x="64" y="64" width="896" height="896" rx="64" fill="none" stroke="' + dashColor + '" stroke-width="18" stroke-dasharray="40 24"/>';`;

for (const f of [
  'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js',
  'D:/Users/10061/Downloads/wubi/data/render.js',
  'D:/Users/10061/Downloads/wubi/practice.html',
]) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('width="896"') && t.includes(oldBody)) {
    t = t.replace(oldBody, newBody);
    fs.writeFileSync(f, t, 'utf8');
    console.log(f.split('/').pop(), '已改为外框');
  } else {
    console.log(f.split('/').pop(), t.includes('width="896"') ? '已有外框' : '未匹配');
  }
}
