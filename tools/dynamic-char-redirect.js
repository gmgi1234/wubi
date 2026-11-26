// 动态单字页：有静态页时直接跳过去，保证版式一致
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/char.html';
let t = fs.readFileSync(p, 'utf8');

const anchor = "  const ch = new URLSearchParams(location.search).get('c') || '狗';";
if (!t.includes('静态完整页')) {
  t = t.replace(
    anchor,
    anchor + `

  // 有静态完整页就直接跳过去（版式与单字页一致）
  const staticTarget = 'char/' + encodeURIComponent(ch) + '.html';
  try {
    const head = await fetch(staticTarget, { method: 'HEAD' });
    if (head.ok) { location.replace(staticTarget); return; }
  } catch (e) {}`
  );
  fs.writeFileSync(p, t, 'utf8');
}
console.log('已加入跳转:', t.includes('const staticTarget'));
