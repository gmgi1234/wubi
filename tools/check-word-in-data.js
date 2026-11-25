// 检查组词是否存在于动态数据中
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const targets = process.argv.slice(2);
for (const w of targets) {
  const b = w.charCodeAt(0) % 64;
  const p = path.join(ROOT, 'data', `word-${b}.js`);
  const t = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const needle = JSON.stringify(w);
  console.log(w, '| bucket', b, '| found:', t.includes(needle));
}
