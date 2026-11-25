// 词组页版本顺序改为：新世纪 → 86 → 98
const fs = require('node:fs');

const targets = [
  ['D:/Users/10061/Downloads/wubi/data/render.js', "const rows = [['86', '86 版', rec.c86], ['98', '98 版', rec.c98], ['06', '新世纪', rec.c06]]"],
  ['D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', "const rows = [['86', '86 版', rec.c86, wordRootsOf(chars, 'v86')], ['98', '98 版', rec.c98, wordRootsOf(chars, 'v98')], ['06', '新世纪', rec.c06, wordRootsOf(chars, 'v06')]]"],
];

// 直接把三行数组的顺序换掉
function reorder(file) {
  let t = fs.readFileSync(file, 'utf8');
  const m = t.match(/\[\[?'86', '86 版', rec\.c86[^\]]*?\],\s*\['98', '98 版', rec\.c98[^\]]*?\],\s*\['06', '新世纪', rec\.c06[^\]]*?\]\]/);
  if (!m) { console.log(file, '未找到 rows 定义'); return; }
  const parts = m[0].slice(1, -1).split(/,\s*\n?\s*(?=\[)/).map((s) => s.trim());
  if (parts.length !== 3) { console.log(file, '解析失败', parts.length); return; }
  const reordered = `[${parts[2]}, ${parts[0]}, ${parts[1]}]`;
  t = t.replace(m[0], reordered);
  fs.writeFileSync(file, t, 'utf8');
  console.log(file.split('/').pop(), '已改为 06 → 86 → 98');
}

reorder('D:/Users/10061/Downloads/wubi/data/render.js');
reorder('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js');
