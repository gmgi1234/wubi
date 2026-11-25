// 修正：只有「一个字根」的键名字才拆成两个格子；成字字根（八、门…）保持单格
const fs = require('node:fs');

// 1) 静态生成器
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');
s = s.replace(
  "        const isKey = (tables[KEY_VER[ver]][c] || {}).r && (tables[KEY_VER[ver]][c].r[0] === c);",
  "        const rArr = (tables[KEY_VER[ver]][c] || {}).r || [];\n        const isKeyName = rArr.length === 1 && rArr[0] === c;\n        const isKey = rArr[0] === c;"
);
s = s.replace(
  "        if (isKey && cntOf(ci) >= 2) {",
  "        if (isKeyName && cntOf(ci) >= 2) {"
);
fs.writeFileSync(sp, s, 'utf8');
console.log('静态生成器:', s.includes('isKeyName'));

// 2) 动态渲染器：keyIdx 改由 ci.html 传入 split 长度信息
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
r = r.replace(
  "          const isKey = (rec.keyIdx && rec.keyIdx[`${c}-${ver}`]);",
  "          const isKey = (rec.keyIdx && rec.keyIdx[`${c}-${ver}`]);\n          const isKeyName = (rec.keyName && rec.keyName[`${c}-${ver}`]);"
);
r = r.replace(
  "          if (isKey && cntOf(ci) >= 2) {",
  "          if (isKeyName && cntOf(ci) >= 2) {"
);
fs.writeFileSync(rp, r, 'utf8');
console.log('动态渲染器:', r.includes('isKeyName'));

// 3) ci.html 里补 keyName 计算
const cp = 'D:/Users/10061/Downloads/wubi/ci.html';
let c = fs.readFileSync(cp, 'utf8');
if (!c.includes('keyName')) {
  c = c.replace(
    "      if (d && d.split && d.split[0] === c) keyIdx[c + '-' + ver] = true;",
    "      if (d && d.split && d.split[0] === c) keyIdx[c + '-' + ver] = true;\n      if (d && d.split && d.split.length === 1 && d.split[0] === c) keyNameIdx[c + '-' + ver] = true;"
  );
  c = c.replace('const keyIdx = {};', 'const keyIdx = {};\n  const keyNameIdx = {};');
  c = c.replace('rec.keyIdx = keyIdx;', 'rec.keyIdx = keyIdx;\n  rec.keyName = keyNameIdx;');
  fs.writeFileSync(cp, c, 'utf8');
  console.log('ci.html:', c.includes('keyNameIdx'));
}
