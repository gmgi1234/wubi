const fs = require('node:fs');
for (const v of ['86', '98', '06']) {
  const t = fs.readFileSync(`D:/Users/10061/Downloads/wubi/svg/象-${v}.svg`, 'utf8');
  const fills = [...new Set([...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]))];
  console.log(v, 'fills:', fills.join(' '), '| path:', (t.match(/<path/g) || []).length);
}
