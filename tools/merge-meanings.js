// 合并三个词典，算最终覆盖率
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const dict = new Map();
function add(word, explanation) {
  const w = (word || '').trim();
  let ex = (explanation || '').replace(/\s+/g, ' ').trim();
  if (!w || !ex) return;
  if (!dict.has(w)) dict.set(w, ex);
}

// 1) 新华词典（ci.json）
const ci = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, 'ci.json'), 'utf8'));
for (const it of ci) add(it.ci, it.explanation);
console.log('ci.json →', dict.size);

// 2) 成语
const id = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, 'idiom.json'), 'utf8'));
for (const it of id) add(it.word, it.explanation);
console.log('+ idiom.json →', dict.size);

// 3) mapull 词典
const w2 = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, 'word2.json'), 'utf8'));
for (const it of w2) add(it.word, it.explanation);
console.log('+ mapull →', dict.size);

const words = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}

const out = {};
const byLen = {};
for (const w of words) {
  const l = [...w].length;
  byLen[l] = byLen[l] || { t: 0, h: 0 };
  byLen[l].t += 1;
  const ex = dict.get(w);
  if (!ex) continue;
  byLen[l].h += 1;
  out[w] = ex.length > 120 ? ex.slice(0, 118) + '…' : ex;
}
const hit = Object.keys(out).length;
console.log('\n合并后命中:', hit, '/', words.length, '=', Math.round((hit / words.length) * 100) + '%');
for (const l of Object.keys(byLen).sort((a, b) => a - b)) {
  const s = byLen[l];
  console.log(`${l} 字词: ${s.h}/${s.t} = ${Math.round((s.h / s.t) * 100)}%`);
}
fs.writeFileSync(path.join(ROOT, 'tools', 'word-meanings-merged.json'), JSON.stringify(out), 'utf8');
console.log('写盘:', (fs.statSync(path.join(ROOT, 'tools', 'word-meanings-merged.json')).size / 1048576).toFixed(1), 'MB');
