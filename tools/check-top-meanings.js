// 常用词（静态页那 2000 个）的释义覆盖率
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'word-meanings-merged.json'), 'utf8'));
const keep = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8'));
const hit = keep.filter((w) => all[w]).length;
console.log('静态 2000 词覆盖率:', hit, '/', keep.length, '=', Math.round((hit / keep.length) * 100) + '%');
const miss = keep.filter((w) => !all[w]).slice(0, 10);
console.log('未覆盖示例:', miss.join(' '));
