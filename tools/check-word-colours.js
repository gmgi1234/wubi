// 打印某个词组页里每个字的字形颜色分布，用于核对着色。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const word = process.argv[2] || '天安门';
const html = fs.readFileSync(path.join(ROOT, 'site', 'ci', `${word}.html`), 'utf8');

const glyphs = [...html.matchAll(/<svg class="glyph"[\s\S]*?<\/svg>/g)].map((m) => m[0]);
console.log('glyph count:', glyphs.length);
glyphs.slice(0, 6).forEach((g, i) => {
  const counts = {};
  for (const m of g.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)) {
    const c = m[1].toUpperCase();
    counts[c] = (counts[c] || 0) + 1;
  }
  console.log(i, JSON.stringify(counts));
});
