const fs = require('node:fs');
for (const ch of ['大', '象', '成', '米']) {
  const t = fs.readFileSync(`D:/Users/10061/Downloads/wubi/char/${ch}.html`, 'utf8');
  const dash = (t.match(/stroke="#c0392b"/g) || []).length;
  const cyan = (t.match(/#00BCD4/g) || []).length;
  console.log(ch, '| 红虚线:', dash, '| 青色:', cyan, '| 键位表:', t.includes('涉及的键位'));
}
