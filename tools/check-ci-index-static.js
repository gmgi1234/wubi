const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/ci/index.html', 'utf8');
console.log('页面大小 KB:', Math.round(t.length / 1024));
console.log('含 .html 链接:', t.includes(".html'"));
console.log('含 STATIC 集合:', t.includes('STATIC='));
const m = t.match(/var STATIC=new Set\([^)]*\)/);
console.log('STATIC 片段:', m ? m[0].slice(0, 80) + '…' : '未找到');
