// 分析：哪些汉字的拆分会出现「前两个字根同名」，会被旧的启发式误判
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const practiceWords = new Set();
for (let n = 2; n <= 6; n += 1) {
  const f = path.join(ROOT, 'data', `practice-${n}.js`);
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  for (const r of arr) practiceWords.add(r[0]);
}

const sameFirstTwo = [];
const allSame = [];
const keyNames = [];
for (const c of Object.keys(tables.v06)) {
  const r = (tables.v06[c] || {}).r || [];
  if (!r.length) continue;
  if (r.length === 1) { keyNames.push(c); continue; }
  if (r[0] === r[1]) {
    sameFirstTwo.push(c);
    if (r.every((x) => x === r[0])) allSame.push(c);
  }
}

console.log('单字根（真键名字）:', keyNames.length, keyNames.join(''));
console.log('前两个字根同名（会被旧启发式误判）:', sameFirstTwo.length);
console.log('样例:', sameFirstTwo.slice(0, 40).join(' '));
console.log('全部字根都同名:', allSame.length, allSame.join(' '));

// 这些字在练习题库里出现在哪些词中
const hitWords = [];
for (const w of practiceWords) {
  for (const ch of w) {
    if (sameFirstTwo.includes(ch)) { hitWords.push(w + '(' + ch + ')'); break; }
  }
}
console.log('练习题库中受影响的词:', hitWords.length);
console.log('样例:', hitWords.slice(0, 25).join(' '));
