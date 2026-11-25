const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/char/狗.html', 'utf8');
const order = [...t.matchAll(/class="vtag">([^<]+)</g)].map((m) => m[1]);
console.log('静态页版本顺序:', order.join(' → '));
