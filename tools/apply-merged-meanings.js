// 用合并后的词典替换释义数据
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const merged = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-meanings-merged.json'), 'utf8'));

// 1) 静态生成器用的整表
fs.writeFileSync(path.join(ROOT, 'tools', 'word-meanings.json'), JSON.stringify(merged), 'utf8');
console.log('整表词条:', Object.keys(merged).length);

// 2) 动态页用的 64 个分片
const BUCKETS = 64;
const buckets = Array.from({ length: BUCKETS }, () => ({}));
for (const [w, ex] of Object.entries(merged)) {
  buckets[w.charCodeAt(0) % BUCKETS][w] = ex;
}
let total = 0;
for (let b = 0; b < BUCKETS; b += 1) {
  const p = path.join(ROOT, 'data', `word-mean-${b}.js`);
  fs.writeFileSync(p, `window.WORD_MEAN_${b}=` + JSON.stringify(buckets[b]) + ';', 'utf8');
  total += fs.statSync(p).size;
}
console.log('分片总量:', (total / 1048576).toFixed(1), 'MB');
