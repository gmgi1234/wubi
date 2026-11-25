// 单字页版本顺序改为：新世纪 → 86 → 98
const fs = require('node:fs');

// 1) 静态单字生成器
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-char.js';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes("['06', '86', '98']")) {
  s = s.replace("const cards = ['86', '98', '06'].map((ver) => {", "const cards = ['06', '86', '98'].map((ver) => {");
  fs.writeFileSync(sp, s, 'utf8');
  console.log('static char builder order patched');
}

// 2) 动态单字渲染
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
if (!r.includes("['06', '86', '98'].map")) {
  r = r.replace("const cards = ['86', '98', '06'].map((ver, i) => {", "const cards = ['06', '86', '98'].map((ver, i) => {");
  fs.writeFileSync(rp, r, 'utf8');
  console.log('render.js order patched');
}
console.log('done');
