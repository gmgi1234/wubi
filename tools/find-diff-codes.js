// 找一个 86 与 06 编码不同的练习词，验证切换是否生效
const fs = require('node:fs');
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/practice-2.js', 'utf8');
const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
const diff = arr.filter((r) => r[1] !== r[2]).slice(0, 5);
console.log('编码不同的词:', diff.map((r) => `${r[0]}(06:${r[1]} 86:${r[2]})`).join(' '));
