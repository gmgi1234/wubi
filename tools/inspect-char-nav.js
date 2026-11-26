const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/char/大.html', 'utf8');
const links = [...t.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)</g)].map((m) => m[1] + ' → ' + m[2].trim());
console.log('页面里的链接:', links.slice(0, 20).join('\n'));
