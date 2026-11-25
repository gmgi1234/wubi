// 补的词编码转小写（词典原有条目都是小写，避免大小写不匹配）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/schemas/dicts/wubi_union.dict.yaml';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
let n = 0;
const out = lines.map((l) => {
  const f = l.split('\t');
  if (f.length >= 4 && f[2] === '50000') {
    f[1] = f[1].toLowerCase();
    f[3] = (f[3] || '').toLowerCase();
    n += 1;
    return f.join('\t');
  }
  return l;
});
fs.writeFileSync(p, out.join('\n'), 'utf8');
console.log('转小写条目:', n);
