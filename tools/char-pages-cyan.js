// 旧版单字页：补码虚线换成青色实心
const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';
let pages = 0;
let paths = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  if (!t.includes('c0392b')) continue;
  const before = t;
  t = t.replace(/<path([^>]*?)d="([^"]*)"([^>]*?)stroke="#c0392b"([^>]*?)\/>/g, (m, pre, d, mid, post) => {
    paths += 1;
    return '<path d="' + d + '" fill="#00BCD4"/>';
  });
  if (t !== before) { fs.writeFileSync(p, t, 'utf8'); pages += 1; }
}
console.log('处理页面:', pages, '| 替换补码笔画:', paths);
