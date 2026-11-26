// 把「字根标注」和「编码」合并到同一个框里
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) HTML：wordbox 与 codline 包进一个容器
const oldBlock = /<div class="wordbox" id="wordbox"><\/div>\s*<div class="codline" id="codline"><\/div>/;
if (!oldBlock.test(t)) { console.log('未找到 wordbox/codline 结构'); process.exit(1); }
t = t.replace(oldBlock, '<div class="wordblock"><div class="wordbox" id="wordbox"></div><div class="codline" id="codline"></div></div>');

// 2) 样式
if (!t.includes('.wordblock')) {
  t = t.replace('</style>', ` .wordblock { border:1px solid var(--line); border-radius:14px; padding:14px 16px 10px; margin:16px auto 6px; max-width:760px; background:var(--paper); }\r\n .wordblock .wordbox { margin:0; }\r\n .wordblock .codline { margin-top:6px; }\r\n</style>`);
}

fs.writeFileSync(p, t, 'utf8');
console.log('已合并为同一框:', t.includes('class="wordblock"'));
