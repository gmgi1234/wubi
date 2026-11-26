// 生成合并后的释义 JSON，并在静态/动态词组页里显示「释义」
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

// 1) 合并释义 → tools/word-meanings.json
const dict = new Map();
for (const [file, keyField] of [['ci.json', 'ci'], ['idiom.json', 'word']]) {
  const p = path.join(process.env.TEMP, file);
  if (!fs.existsSync(p)) continue;
  for (const it of JSON.parse(fs.readFileSync(p, 'utf8'))) {
    const w = (it[keyField] || '').trim();
    let ex = (it.explanation || '').replace(/\s+/g, ' ').trim();
    if (!w || !ex) continue;
    if (ex.length > 120) ex = ex.slice(0, 118) + '…';
    if (!dict.has(w)) dict.set(w, ex);
  }
}
const words = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}
const mean = {};
for (const w of words) if (dict.has(w)) mean[w] = dict.get(w);
fs.writeFileSync(path.join(ROOT, 'tools', 'word-meanings.json'), JSON.stringify(mean), 'utf8');
console.log('释义表:', Object.keys(mean).length, '条 |', (fs.statSync(path.join(ROOT, 'tools', 'word-meanings.json')).size / 1048576).toFixed(1), 'MB');

// 2) 静态生成器加「释义」
const sp = path.join(ROOT, 'tools', 'build-static-ci.js');
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('wordMeanings')) {
  s = s.replace(
    "const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));",
    "const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));\nconst wordMeanings = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-meanings.json'), 'utf8'));"
  );
  s = s.replace(
    '  <h2>单字拆分</h2>',
    `  \${wordMeanings[w] ? \`<h2>释义</h2><div class="rule"><p>\${esc(wordMeanings[w])}</p></div>\` : ''}
  <h2>单字拆分</h2>`
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('静态生成器已加释义:', s.includes('wordMeanings[w]'));
}
