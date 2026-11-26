// 单字页的「上一个/下一个」改为指向静态页（存在时），否则保留动态页
const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';
const files = new Set(fs.readdirSync(dir).filter((f) => f.endsWith('.html')));

let pages = 0;
let changed = 0;

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  const before = t;

  // ../char.html?c=XXX → 静态页
  t = t.replace(/\.\.\/char\.html\?c=([^"&]+)/g, (m, enc) => {
    let ch;
    try { ch = decodeURIComponent(enc); } catch (e) { return m; }
    const target = `${ch}.html`;
    if (files.has(target) && target !== f) { changed += 1; return encodeURIComponent(target); }
    return m;
  });

  if (t !== before) { fs.writeFileSync(p, t, 'utf8'); pages += 1; }
}
console.log('更新页面:', pages, '| 改成静态链接:', changed);
