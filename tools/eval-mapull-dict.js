// 评估 mapull 词典对我们词表的覆盖率
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const raw = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, 'word2.json'), 'utf8'));
console.log('词条数:', raw.length);
const dict = new Map();
for (const it of raw) {
  const w = (it.word || '').trim();
  const ex = (it.explanation || '').replace(/\s+/g, ' ').trim();
  if (w && ex && !dict.has(w)) dict.set(w, ex);
}

const words = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}
console.log('我们的词表:', words.length);

let hit = 0;
const byLen = {};
for (const w of words) {
  const l = [...w].length;
  byLen[l] = byLen[l] || { t: 0, h: 0 };
  byLen[l].t += 1;
  if (dict.has(w)) { hit += 1; byLen[l].h += 1; }
}
console.log('命中:', hit, '/', words.length, '=', Math.round((hit / words.length) * 100) + '%');
for (const l of Object.keys(byLen).sort((a, b) => a - b)) {
  const s = byLen[l];
  console.log(`${l} 字词: ${s.h}/${s.t} = ${Math.round((s.h / s.t) * 100)}%`);
}
