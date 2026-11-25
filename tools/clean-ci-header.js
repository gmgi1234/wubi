// 规范化静态词组页的页头（去掉重复的「全部单字」）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const d = path.join(ROOT, 'ci');
const clean = '<header><a href="../">五笔字根 · 笔画着色</a><span><a href="../char/">全部单字</a>　<a href="../ci/">全部词组</a></span></header>';

let n = 0;
for (const f of fs.readdirSync(d)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(d, f);
  const t = fs.readFileSync(p, 'utf8');
  const next = t.replace(/<header>[\s\S]*?<\/header>/, clean);
  if (next !== t) { fs.writeFileSync(p, next, 'utf8'); n += 1; }
}
console.log('ci headers normalized:', n);

// 抽查
const sample = fs.readFileSync(path.join(d, '中国.html'), 'utf8').match(/<header>[\s\S]*?<\/header>/);
console.log(sample[0].replace(/\s+/g, ' '));
