// Switch WindInput to the mixed 五笔+拼音 scheme.
const fs = require('node:fs');

const p = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('active = "wubi_union_pinyin"')) {
  t = t.replace(/active = "wubi_union"/, 'active = "wubi_union_pinyin"');
}
if (!t.includes('"wubi_union_pinyin"')) {
  t = t.replace('available = ["wubi_union"', 'available = ["wubi_union_pinyin", "wubi_union"');
}

fs.writeFileSync(p, t, 'utf8');
console.log(t.slice(t.indexOf('[schema]'), t.indexOf('[schema]') + 200));
