const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/米-06.svg', 'utf8');
console.log('长度:', t.length, '| path 数:', (t.match(/<path/g) || []).length);
const fills = [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
console.log('fill 序列:', fills.join(' '));
