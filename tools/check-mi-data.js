const fs = require('node:fs');
const tables = JSON.parse(fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/tables.json', 'utf8'));
for (const c of ['米', '饭', '山', '王', '人']) {
  const e = tables.v06[c] || {};
  console.log(c, '| code:', e.c, '| r:', JSON.stringify(e.r), '| r 长度:', (e.r || []).length);
}
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/practice-2.js', 'utf8');
const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
const row = arr.find((r) => r[0] === '米饭');
console.log('practice 数据里的米饭:', JSON.stringify(row));
