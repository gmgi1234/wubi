const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/从-06.svg', 'utf8');
const fills = [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
console.log('从-06 fill 序列:', fills.join(' '), '| path 数:', (t.match(/<path/g) || []).length);

const tb = JSON.parse(fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/tables.json', 'utf8'));
for (const c of ['从', '无']) {
  const e = tb.v06[c] || {};
  console.log(c, '| code:', e.c, '| r:', JSON.stringify(e.r));
}
