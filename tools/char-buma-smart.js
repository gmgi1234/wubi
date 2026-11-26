// 单字页补码处理：只有「灰色未着色」的补码笔画才改青色；已着色的保持原色
const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';

let pages = 0;
let cyan = 0;
let removed = 0;

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  if (!t.includes('#c0392b') || !t.includes('stroke-dasharray')) continue;
  const before = t;

  // 逐个处理虚线段
  t = t.replace(/<path([^>]*?)d="([^"]*)"([^>]*?)stroke="#c0392b"([^>]*?)\/>/g, (m, pre, d, mid, post) => {
    // 找同一 d 的灰色笔画（fill="#555" 或 #555555）
    const grayRe = new RegExp('<path[^>]*?d="' + d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*?fill="#(?:555|555555)"[^>]*?\\/>');
    if (grayRe.test(t)) {
      cyan += 1;
      return '<path d="' + d + '" fill="#00BCD4"/>';
    }
    removed += 1;
    return ''; // 已着色的笔画：只去掉虚线
  });

  // 移除刚才被替换成青色的那一笔的灰色副本
  t = t.replace(/<path[^>]*?fill="#(?:555|555555)"[^>]*?\/>/g, (m) => {
    // 如果存在同 d 的青色版本，删除灰色副本
    const dm = m.match(/d="([^"]*)"/);
    if (dm && t.includes('d="' + dm[1] + '" fill="#00BCD4"')) return '';
    return m;
  });

  if (t !== before) { fs.writeFileSync(p, t, 'utf8'); pages += 1; }
}
console.log('处理页面:', pages, '| 改青色:', cyan, '| 仅移除虚线:', removed);
