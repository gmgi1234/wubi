// 合并 ci.json 与 idiom.json，统计各字数覆盖率
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const BUCKETS = 64;

const dict = new Map();
function load(file, keyField) {
  const raw = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, file), 'utf8'));
  let n = 0;
  for (const it of raw) {
    const w = (it[keyField] || '').trim();
    let ex = (it.explanation || '').replace(/\s+/g, ' ').trim();
    if (!w || !ex) continue;
    if (ex.length > 120) ex = ex.slice(0, 118) + '…';
    if (!dict.has(w)) { dict.set(w, ex); n += 1; }
  }
  console.log(file, '新增', n, '| 累计', dict.size);
}
load('ci.json', 'ci');
if (fs.existsSync(path.join(process.env.TEMP, 'idiom.json'))) load('idiom.json', 'word');

const words = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}

const buckets = Array.from({ length: BUCKETS }, () => ({}));
const stat = {};
let hit = 0;
for (const w of words) {
  const len = [...w].length;
  stat[len] = stat[len] || { total: 0, hit: 0 };
  stat[len].total += 1;
  const ex = dict.get(w);
  if (!ex) continue;
  hit += 1;
  stat[len].hit += 1;
  buckets[w.charCodeAt(0) % BUCKETS][w] = ex;
}

let total = 0;
for (let b = 0; b < BUCKETS; b += 1) {
  const p = path.join(ROOT, 'data', `word-mean-${b}.js`);
  fs.writeFileSync(p, `window.WORD_MEAN_${b}=` + JSON.stringify(buckets[b]) + ';', 'utf8');
  total += fs.statSync(p).size;
}
console.log('\n总覆盖率:', hit, '/', words.length, '=', Math.round(hit / words.length * 100) + '%');
for (const len of Object.keys(stat).sort((a, b) => a - b)) {
  const s = stat[len];
  console.log(`${len} 字词: ${s.hit}/${s.total} = ${Math.round(s.hit / s.total * 100)}%`);
}
console.log('数据量:', (total / 1048576).toFixed(1), 'MB');
