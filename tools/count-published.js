// 统计 GitHub Pages 实际发布体积（排除 .gitignore 里的 stroke-bundle.js）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const IGNORE = new Set(['data/stroke-bundle.js']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
}

const files = [];
for (const d of ['char', 'ci', 'data', 'svg', 'dist', 'fonts']) {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p)) walk(p, files);
}
for (const f of ['index.html', 'char.html', 'ci.html', 'sitemap.xml', 'robots.txt', 'CNAME', '20261122wubi-stroke-colorV24.17.html']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) files.push(p);
}

let total = 0;
let skipped = 0;
const big = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (IGNORE.has(rel)) { skipped += fs.statSync(f).size; continue; }
  const s = fs.statSync(f).size;
  total += s;
  if (s > 3 * 1024 * 1024) big.push(`${rel} ${(s / 1048576).toFixed(1)} MB`);
}
console.log('发布文件数:', files.length);
console.log('发布体积:', (total / 1048576).toFixed(1), 'MB');
console.log('被忽略（不发布）:', (skipped / 1048576).toFixed(1), 'MB');
console.log('大于 3MB 的文件:', big.length ? big.join('\n  ') : '无');
