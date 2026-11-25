// 统计静态页里复合字根小图占了多少字节
const fs = require('node:fs');
const path = require('node:path');
const DIR = 'D:/Users/10061/Downloads/wubi/ci';

let pages = 0, pagesWithFrag = 0, fragBytes = 0, fragCount = 0, totalBytes = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const t = fs.readFileSync(path.join(DIR, f), 'utf8');
  pages += 1;
  totalBytes += Buffer.byteLength(t);
  const re = /<svg class="frag"[\s\S]*?<\/svg>/g;
  const m = t.match(re);
  if (m) {
    pagesWithFrag += 1;
    fragCount += m.length;
    fragBytes += m.reduce((s, x) => s + Buffer.byteLength(x), 0);
  }
}
const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
console.log('静态页:', pages, '| 总大小', mb(totalBytes));
console.log('含小图的页:', pagesWithFrag, '| 小图总数', fragCount);
console.log('小图总字节:', mb(fragBytes), '| 平均每个', Math.round(fragBytes / Math.max(1, fragCount)), 'B');
const sprite = fs.statSync('D:/Users/10061/Downloads/wubi/data/root-glyphs.js').size;
console.log('共享字形库:', mb(sprite));
