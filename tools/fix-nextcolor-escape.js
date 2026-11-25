const fs = require('node:fs');
for (const f of ['D:/Users/10061/Downloads/wubi/data/render.js', 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js']) {
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/\\\$\{nextColor\}/g) || []).length;
  t = t.split('\\${nextColor}').join('${nextColor}');
  fs.writeFileSync(f, t, 'utf8');
  console.log(f.split('/').pop(), 'fixed escapes:', before);
}
