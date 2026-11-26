const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/svg';
const files = fs.readdirSync(dir);
let total = 0;
let odd = 0;
const samples = [];
for (const f of files) {
  if (!f.endsWith('.svg')) continue;
  total += 1;
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  // 正常单字页配色：红橙绿蓝；异常：出现 #3498DB / #555 / #cfc8bd
  if (t.includes('#3498DB') || t.includes('#555') || t.includes('#cfc8bd')) {
    odd += 1;
    if (samples.length < 8) samples.push(f);
  }
}
console.log('SVG 总数:', total, '| 配色异常:', odd, '| 样例:', samples.join(' '));
