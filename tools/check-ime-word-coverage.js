// 统计：网站词组 vs 输入法词典可输入量
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const dictLines = fs.readFileSync(path.join(ROOT, 'qingfeng/WindInput/schemas/dicts/wubi_union.dict.yaml'), 'utf8').split(/\r?\n/);
const texts = new Map(); // 词 -> 编码数组
for (const l of dictLines) {
  if (!l || l.startsWith('#') || l.startsWith(' ') || l.startsWith('-')) continue;
  const f = l.split('\t');
  const w = f[0];
  const code = f[1];
  if (!w || !code) continue;
  if (!texts.has(w)) texts.set(w, []);
  texts.get(w).push(code);
}

const siteWords = [];
for (let n = 2; n <= 12; n += 1) {
  const p = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) siteWords.push(...JSON.parse(m[1]));
}

const MAX_WORD = 10; // 方案里的 max_word_length
const byLen = {};
let missing = 0;
let tooLong = 0;
let ok = 0;
for (const w of siteWords) {
  const len = [...w].length;
  if (!texts.has(w)) { missing += 1; continue; }
  if (len > MAX_WORD) { tooLong += 1; continue; }
  ok += 1;
  byLen[len] = (byLen[len] || 0) + 1;
}

console.log('网站词组:', siteWords.length);
console.log('词典里存在的词:', siteWords.length - missing, '| 缺失:', missing);
console.log('因长度 >10 被排除:', tooLong);
console.log('实际可输入（长度≤10）:', ok);
console.log('词典总词条（去重文本）:', texts.size);
console.log('按字数分布:', JSON.stringify(byLen));
