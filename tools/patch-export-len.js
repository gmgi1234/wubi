// 在导出脚本里补充「按字数分类」的词表（供 /ci/ 分类浏览）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/export-dynamic-data.js';
let t = fs.readFileSync(p, 'utf8');

const marker = "console.log('char index:'";
const addition = `
// 按字数分类的词表：word-len-<n>.js（n = 2..12）
const byLen = new Map();
for (const w of allWords) {
  const n = [...w].length;
  if (!byLen.has(n)) byLen.set(n, []);
  byLen.get(n).push(w);
}
const lenSummary = [];
for (const [n, arr] of [...byLen.entries()].sort((a, b) => a[0] - b[0])) {
  arr.sort((x, y) => x.localeCompare(y));
  fs.writeFileSync(path.join(OUT, \`word-len-\${n}.js\`), \`window.WORD_LEN_\${n}=\` + JSON.stringify(arr) + ';', 'utf8');
  lenSummary.push(n + ':' + arr.length);
}
console.log('word lengths:', lenSummary.join(' | '));

`;

if (!t.includes('word-len-')) {
  t = t.replace(marker, addition + marker);
  fs.writeFileSync(p, t, 'utf8');
  console.log('patched export');
} else {
  console.log('already patched');
}
