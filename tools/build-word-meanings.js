// 生成词组释义数据（来自 chinese-xinhua 的 ci.json，开放数据）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'data');
const BUCKETS = 64;

const raw = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, 'ci.json'), 'utf8'));
const dict = new Map();
for (const it of raw) {
  const w = (it.ci || '').trim();
  let ex = (it.explanation || '').replace(/\s+/g, ' ').trim();
  if (!w || !ex) continue;
  if (ex.length > 120) ex = ex.slice(0, 118) + '…';
  if (!dict.has(w)) dict.set(w, ex);
}
console.log('词典条目（去重）:', dict.size);

// 我们的词表
const words = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}

const buckets = Array.from({ length: BUCKETS }, () => ({}));
let hit = 0;
for (const w of words) {
  const ex = dict.get(w);
  if (!ex) continue;
  hit += 1;
  buckets[w.charCodeAt(0) % BUCKETS][w] = ex;
}

let total = 0;
for (let b = 0; b < BUCKETS; b += 1) {
  const p = path.join(OUT, `word-mean-${b}.js`);
  fs.writeFileSync(p, `window.WORD_MEAN_${b}=` + JSON.stringify(buckets[b]) + ';', 'utf8');
  total += fs.statSync(p).size;
}
console.log('有释义的词:', hit, '/', words.length, '（', Math.round(hit / words.length * 100), '% ）');
console.log('数据总量:', (total / 1048576).toFixed(1), 'MB |', BUCKETS, '个文件');
