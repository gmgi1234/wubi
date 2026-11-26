// 生成单字的两个标记：键名字 / 成字字根，供页面计算词组着色用
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));

const out = {};
for (const c of Object.keys(tables.v06)) {
  const r = (tables.v06[c] || {}).r || [];
  if (!r.length) continue;
  const key = r.length === 1 && r[0] === c ? 1 : 0;
  const cheng = r[0] === c ? 1 : 0;
  if (key || cheng) out[c] = String(key) + String(cheng);
}
const f = path.join(ROOT, 'data', 'char-flags.js');
fs.writeFileSync(f, 'window.CHAR_FLAGS=' + JSON.stringify(out) + ';', 'utf8');
console.log('标记字:', Object.keys(out).length, '|', Math.round(fs.statSync(f).size / 1024), 'KB');
