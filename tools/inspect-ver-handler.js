const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/practice.html', 'utf8');
const idx = t.indexOf("'[data-ver]'");
console.log('handler 位置:', idx);
if (idx >= 0) console.log(t.slice(idx - 120, idx + 380));
console.log('---- 按钮 ----');
const b = t.indexOf('data-ver="6"');
console.log(t.slice(b - 120, b + 300));
