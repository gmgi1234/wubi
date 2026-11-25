const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  if (t.includes('frag-sprite')) continue;
  console.log('样本:', f, '| 大小 KB:', Math.round(t.length / 1024));
  const frags = (t.match(/class="frag"/g) || []).length;
  console.log('frag 出现次数:', frags);
  const i = t.indexOf('class="frag"');
  console.log('frag 上下文:', i >= 0 ? JSON.stringify(t.slice(i - 60, i + 160)) : '无');
  const svgs = (t.match(/<svg/g) || []).length;
  console.log('svg 数:', svgs);
  break;
}
