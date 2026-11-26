const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/svg';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('-86.svg'));
let total = 0;
let noRed = 0;
const samples = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const fills = [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1].toUpperCase());
  const colored = fills.filter((x) => x !== '#FFF');
  if (!colored.length) continue;
  total += 1;
  if (colored[0] !== '#E74C3C') {
    noRed += 1;
    if (samples.length < 10) samples.push(f.replace('-86.svg', '') + '(' + colored[0] + ')');
  }
}
console.log('86 版字形:', total, '| 首色不是红色:', noRed);
console.log('样例:', samples.join(' '));
