const fs = require('node:fs');
for (const f of ['data/render.js', 'tools/build-static-ci.js', 'practice.html']) {
  const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/' + f, 'utf8');
  console.log(f, '| 描边样式(30 18):', t.includes('stroke-dasharray="30 18"'), '| 矩形框(896):', t.includes('width="896"'));
}
