// 从练习题库里找出「成字字根占两码」的词，供人工验证
const fs = require('node:fs');
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/practice-2.js', 'utf8');
const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
const out = [];
for (const r of arr) {
  const w = r[0];
  const keys = r[7] || '';
  const cheng = r[8] || '';
  const n = [...w].length;
  const cnt = n === 2 ? [2, 2] : [1, 1];
  for (let i = 0; i < n; i++) {
    if (cheng[i] === '1' && keys[i] !== '1' && cnt[i] >= 2) {
      out.push(w);
      break;
    }
  }
  if (out.length >= 12) break;
}
console.log('样例词:', out.join(' '));
