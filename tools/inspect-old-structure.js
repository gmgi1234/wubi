const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/char/狗.html', 'utf8');
const i = t.indexOf('class="vers"');
console.log('vers 容器:', i);
console.log('前后 120 字:', JSON.stringify(t.slice(Math.max(0, i - 20), i + 100)));
const marks = [...t.matchAll(/<div class="vcard">/g)].map((m) => m.index);
console.log('vcard 位置:', marks);
const labels = [...t.matchAll(/class="vtag">([^<]+)</g)].map((m) => m[1]);
console.log('标签顺序:', labels.join(' | '));
