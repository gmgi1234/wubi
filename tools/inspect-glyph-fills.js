const fs = require('node:fs');
const dir = 'D:/Users/10061/Downloads/wubi/svg/';
for (const f of ['狗-86.svg', '米-86.svg', '米-98.svg', '米-06.svg', '饭-86.svg', '山-86.svg']) {
  try {
    const t = fs.readFileSync(dir + f, 'utf8');
    const fills = [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
    console.log(f, '→', fills.join(' '));
  } catch (e) { console.log(f, '缺失'); }
}
