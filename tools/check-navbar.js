const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/char/京.html', 'utf8');
console.log('有 navbar:', t.includes('navbar'));
console.log('有 上一个/下一个:', t.includes('上一个') || t.includes('←'));
const m = t.match(/<div class="navbar">[\s\S]*?<\/div>/);
console.log('navbar 片段:', m ? m[0].replace(/\s+/g, ' ').slice(0, 200) : '无');
const h = t.match(/<header>[\s\S]*?<\/header>/);
console.log('header:', h ? h[0].replace(/\s+/g, ' ').slice(0, 160) : '无');
