// 取高频前 2000 个词做静态页
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const top = words.slice(0, 2000).map((x) => x.w);
fs.writeFileSync(path.join(ROOT, 'tools', 'keep-words.json'), JSON.stringify(top), 'utf8');
console.log('静态词组:', top.length, '| 前 5 个:', top.slice(0, 5).join(' '));
