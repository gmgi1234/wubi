// 生成单字基础数据：三版编码 + 三版展开字根，供「词库没有的词」现场计算
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));

function expand(v, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[v] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) out.push(...expand(v, e.r, depth + 1));
    else out.push(r);
  }
  return out;
}

const out = {};
for (const c of Object.keys(tables.v06)) {
  const e6 = tables.v06[c] || {};
  const e86 = tables.v86[c] || {};
  const e98 = tables.v98[c] || {};
  if (!e6.c) continue;
  out[c] = [
    (e86.c || '').toLowerCase(),
    (e98.c || '').toLowerCase(),
    e6.c.toLowerCase(),
    expand('v86', e86.r || []).join(' '),
    expand('v98', e98.r || []).join(' '),
    expand('v06', e6.r || []).join(' '),
  ];
}
const f = path.join(ROOT, 'data', 'char-basic.js');
fs.writeFileSync(f, 'window.CHAR_BASIC=' + JSON.stringify(out) + ';', 'utf8');
console.log('单字:', Object.keys(out).length, '|', Math.round(fs.statSync(f).size / 1024), 'KB');
