// 删除练习页里键名字的第二个虚线格
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const start = t.indexOf("      if (isKeyName) {");
if (start < 0) { console.log('未找到 if (isKeyName) 块'); process.exit(1); }
const end = t.indexOf('      cell = ', start);
if (end < 0) { console.log('未找到结束位置'); process.exit(1); }

const removed = t.slice(start, end);
t = t.slice(0, start) + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('已删除的代码:\n' + removed.trim());
console.log('剩余第二格标记:', t.includes("data-start=\"' + (startPos + 1)"));
