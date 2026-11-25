// Inspect data/wubi_roots_all.js structure.
const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/wubi_roots_all.js', 'utf8');
console.log('size', t.length);
console.log(t.slice(0, 400));
console.log('---');
console.log(t.slice(t.length - 200));
