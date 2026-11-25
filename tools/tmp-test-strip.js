const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/样-86.svg', 'utf8');
const re = /<path[^>]*stroke="#c0392b"[^>]*\/>/g;
const m = t.match(re);
console.log('matches:', m ? m.length : 0);
const out = t.replace(re, '');
console.log('after strip still has c0392b:', out.includes('c0392b'));
