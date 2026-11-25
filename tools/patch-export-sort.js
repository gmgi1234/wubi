// 让「按字数分类」的词表按常用度排序（常用词在前）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/export-dynamic-data.js';
let t = fs.readFileSync(p, 'utf8');

const before = "  arr.sort((x, y) => x.localeCompare(y));";
const after = "  arr.sort((x, y) => freqRank(x) - freqRank(y) || x.localeCompare(y));";

if (!t.includes('freqRank')) {
  t = t.replace(before, after);
  t = t.replace('// 按字数分类的词表', 'const wordRank = new Map(words.map((x, i) => [x.w, i]));\nconst freqRank = (w) => (wordRank.has(w) ? wordRank.get(w) : 1e6);\n\n// 按字数分类的词表');
  fs.writeFileSync(p, t, 'utf8');
  console.log('patched sort by frequency');
} else {
  console.log('already patched');
}
