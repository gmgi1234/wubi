// 检查静态词组页：复合字根是否为小图、键名字字根是否正确
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

for (const w of process.argv.slice(2)) {
  const p = path.join(ROOT, 'ci', `${w}.html`);
  if (!fs.existsSync(p)) { console.log(w, '缺页'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  const firstRoots = (t.match(/<span class="broots">([\s\S]*?)<\/span><span class="bcode">/) || [])[1] || '';
  const text = firstRoots.replace(/<svg[\s\S]*?<\/svg>/g, '[图]').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  console.log(w, '| 字根:', text, '| 小图:', (firstRoots.match(/<svg/g) || []).length, '| 补码虚线:', t.includes('c0392b'));
}
