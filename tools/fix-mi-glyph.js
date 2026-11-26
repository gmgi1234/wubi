// 修正「米」的字形：主体笔画被错误标成灰色，改为红色
const fs = require('node:fs');
const dir = 'D:/Users/10061/Downloads/wubi/svg/';
for (const ver of ['86', '98', '06']) {
  const f = dir + '米-' + ver + '.svg';
  if (!fs.existsSync(f)) { console.log(f, '缺失'); continue; }
  let t = fs.readFileSync(f, 'utf8');
  const before = (t.match(/#555/g) || []).length;
  t = t.split('#555').join('#E74C3C');
  fs.writeFileSync(f, t, 'utf8');
  const fills = [...t.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
  console.log('米-' + ver, '替换灰色:', before, '| 现在的配色:', fills.join(' '));
}
