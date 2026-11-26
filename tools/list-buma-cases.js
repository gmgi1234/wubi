// 统计：哪些字是「补码转青色」，哪些是「补码保持原色」
const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';

const cyanChars = [];
const keepChars = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const ch = f.replace(/\.html$/, '');
  if (t.includes('#00BCD4')) cyanChars.push(ch);
  else if (t.includes('补码')) keepChars.push(ch);
}
console.log('补码转青色（象类）:', cyanChars.length, cyanChars.join(''));
console.log('补码保持原色（大类）:', keepChars.length);
console.log('样例:', keepChars.slice(0, 40).join(' '));
