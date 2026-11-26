const fs = require('node:fs');
const lib = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/kb-root-glyphs.js', 'utf8');
const json = JSON.parse(lib.slice(lib.indexOf('{'), lib.lastIndexOf('}') + 1));
for (const t of ['八', '亻', '金', '勹', '儿']) {
  const v = json[t];
  console.log(t, '→', v ? v.slice(0, 120) : '缺');
}
const src = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/八-06.svg', 'utf8');
console.log('源 八-06 前 200:', src.slice(0, 200));
