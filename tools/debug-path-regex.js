const fs = require('node:fs');
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/象-86.svg', 'utf8');
let inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect[^>]*>/g, '');
console.log('inner 长度:', inner.length, '| path 数:', (inner.match(/<path/g) || []).length);
const m1 = [...inner.matchAll(/<path[^>]*?d="([^"]*)"[^>]*?\/>/g)];
console.log('正则匹配:', m1.length);
const m2 = [...inner.matchAll(/<path[^>]*d="([^"]*)"/g)];
console.log('宽松匹配:', m2.length);
console.log('末尾片段:', JSON.stringify(inner.slice(-120)));
