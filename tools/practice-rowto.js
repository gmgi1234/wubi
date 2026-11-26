const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');
const m = t.match(/function rowToWord\(r, len\) \{[\s\S]*?\}/);
if (!m) { console.log('未找到 rowToWord'); process.exit(1); }
console.log('原:', m[0]);
const neu = "function rowToWord(r, len) { return { w: r[0], c6: r[1], c86: r[2], c98: r[3], r6: r[4], r86: r[5], r98: r[6], keys: r[7] || '', cheng: r[8] || '', len: len }; }";
t = t.replace(m[0], neu);
fs.writeFileSync(p, t, 'utf8');
console.log('新:', neu.slice(0, 90), '…');
