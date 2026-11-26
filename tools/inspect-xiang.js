const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/象-06.svg', 'utf8');
console.log('象-06 fill:', [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]).join(' '));
const tb = JSON.parse(fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/tables.json', 'utf8'));
for (const v of ['v86', 'v98', 'v06']) {
  const e = tb[v]['象'] || {};
  console.log(v, 'code:', e.c, '| r:', JSON.stringify(e.r));
}
