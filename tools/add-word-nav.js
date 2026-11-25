// 给静态词组页加上「上一个 / 下一个」导航
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('word-nav')) {
  // 1) 循环里算出前后词
  t = t.replace(
    "let n = 0;\nfor (const w of keep) {",
    "let n = 0;\nfor (let wi = 0; wi < keep.length; wi += 1) {\n  const w = keep[wi];\n  const prevW = keep[wi - 1] || null;\n  const nextW = keep[wi + 1] || null;"
  );

  // 2) header 里插入导航
  t = t.replace(
    '<header><a href="../">五笔字根 · 笔画着色</a><span><a href="../char/">全部单字</a>　<a href="../ci/">全部词组</a></span></header>',
    `<header><a href="../">五笔字根 · 笔画着色</a><div class="word-nav">\${prevW ? \`<a class="nav" href="\${encodeURIComponent(prevW)}.html">← \${esc(prevW)}</a>\` : '<span class="nav dim">←</span>'}<a href="../ci/">全部词组</a>\${nextW ? \`<a class="nav" href="\${encodeURIComponent(nextW)}.html">\${esc(nextW)} →</a>\` : '<span class="nav dim">→</span>'}</div></header>`
  );

  // 3) 加点样式
  t = t.replace('  footer {', '  .word-nav { display:flex; gap:14px; align-items:center; }\n  .word-nav a { color:var(--accent); text-decoration:none; }\n  .word-nav .dim { color:#cfc8bd; }\n  footer {');

  fs.writeFileSync(p, t, 'utf8');
  console.log('已加入词组页导航');
} else {
  console.log('已有导航');
}
