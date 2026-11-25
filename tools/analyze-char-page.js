// 分析单字页体积构成
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi/char';

const sample = ['狗.html', '王.html', '国.html'];
for (const f of sample) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const t = fs.readFileSync(p, 'utf8');
  const total = Buffer.byteLength(t);
  const glyphs = t.match(/<svg class="glyph"[\s\S]*?<\/svg>/g) || [];
  const glyphBytes = glyphs.reduce((s, x) => s + Buffer.byteLength(x), 0);
  const frags = (t.match(/<svg class="frag"/g) || []).length;
  console.log(f, '| 总', Math.round(total / 1024) + ' KB', '| 字形', glyphs.length, '个', Math.round(glyphBytes / 1024) + ' KB', '| 复合字根引用', frags);
}

// 全部静态单字页平均
let n = 0, sum = 0;
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  sum += fs.statSync(path.join(ROOT, f)).size;
  n += 1;
}
console.log('静态单字页:', n, '| 平均', Math.round(sum / n / 1024) + ' KB', '| 合计', (sum / 1048576).toFixed(1) + ' MB');
