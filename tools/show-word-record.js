// 查看某个词组在动态数据里的记录
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
for (const w of process.argv.slice(2)) {
  const b = w.charCodeAt(0) % 64;
  const p = path.join(ROOT, 'data', `word-${b}.js`);
  const t = fs.readFileSync(p, 'utf8');
  const key = JSON.stringify(w) + ':{';
  const i = t.indexOf(key);
  if (i < 0) { console.log(w, '-> 未找到（bucket', b, '）'); continue; }
  console.log(w, '->', t.slice(i + key.length - 1, i + key.length + 200));
}
