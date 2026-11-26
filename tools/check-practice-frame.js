const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/practice.html', 'utf8');
console.log('含 896 外框:', t.includes('width="896"'));
const i = t.indexOf('function colorWholeDashed');
console.log(t.slice(i, i + 620));
