const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/char/狗.html', 'utf8');
console.log('大小 KB:', Math.round(t.length / 1024));
console.log('键位:', t.includes('涉及的键位'), '| 内联小图:', (t.match(/svg class="frag"/g) || []).length);
console.log('版本顺序:', [...t.matchAll(/class="vtag">([^<]+)</g)].map((m) => m[1]).join(' | '));
