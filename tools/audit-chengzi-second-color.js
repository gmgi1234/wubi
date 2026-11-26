// 检查：成字字根占两码时，字形里有没有第二色（橙色）可供描虚线
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));

// 收集所有「成字字根」且有 2 个字根的字
const cheng = [];
for (const c of Object.keys(tables.v06)) {
  const e = tables.v06[c] || {};
  const arr = e.r || [];
  if (arr.length >= 2 && arr[0] === c) cheng.push(c);
}
console.log('成字字根（多字根）:', cheng.length, '| 前 20:', cheng.slice(0, 20).join(''));

let noOrange = [];
let withOrange = 0;
for (const c of cheng) {
  const f = path.join(ROOT, 'svg', `${c}-06.svg`);
  if (!fs.existsSync(f)) { noOrange.push(c + '(无字形)'); continue; }
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes('#FF9800')) withOrange += 1;
  else noOrange.push(c);
}
console.log('有橙色（可描第二根虚线）:', withOrange, '| 没有橙色:', noOrange.length);
console.log('没有橙色的样例:', noOrange.slice(0, 30).join(' '));
