// 统一第 4 色：主站用 #3498DB，我们用的是 #2980B9 → 改成主站色
const fs = require('node:fs');

const files = [
  'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js',
  'D:/Users/10061/Downloads/wubi/data/render.js',
  'D:/Users/10061/Downloads/wubi/practice.html',
];

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/#2980B9/g) || []).length;
  t = t.split('#2980B9').join('#3498DB');
  fs.writeFileSync(f, t, 'utf8');
  console.log(f.split('/').pop(), '替换 #2980B9 →', before, '处');
}
