// 键名字整字描边：去掉白色外圈，只保留虚线框，避免遮住填充色
const fs = require('node:fs');
for (const f of ['D:/Users/10061/Downloads/wubi/data/render.js', 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js']) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t.includes('return halo + out + dash;');
  t = t.split('return halo + out + dash;').join('return out + dash;');
  fs.writeFileSync(f, t, 'utf8');
  console.log(f.split('/').pop(), 'halo removed:', before);
}
