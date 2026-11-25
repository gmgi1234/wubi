// 把「玉」这个复合字根拆成「王 + 丶」，只改数据里把 玉 当作字根用的那 12 个字。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHARS = ['国', '宝', '滢', '玺', '珏', '瑩', '璧', '璺', '璽', '莹', '鈺', '钰'];
const FILES = ['data/wubi86.js', 'data/wubi98.js', 'data/wubi_xsj.js'];

let total = 0;
for (const rel of FILES) {
  const p = path.join(ROOT, rel);
  let text = fs.readFileSync(p, 'utf8');
  let changed = 0;
  for (const ch of CHARS) {
    const re = new RegExp(`("${ch}":\\{"c":"[^"]*","r":\\[)([^\\]]*)(\\]\\})`, 'g');
    text = text.replace(re, (m, head, body, tail) => {
      if (!body.includes('"玉"')) return m;
      const next = body.replace(/"玉"/g, '"王","丶"');
      changed += 1;
      return head + next + tail;
    });
  }
  fs.writeFileSync(p, text, 'utf8');
  console.log(rel, 'changed entries:', changed);
  total += changed;
}
console.log('total changed:', total);
