// 给所有静态页补上「全部单字 / 全部词组」入口
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const links = '<span style="margin-left:12px"><a href="../char/">全部单字</a>　<a href="../ci/">全部词组</a></span>';

let n = 0;
for (const dir of ['ci', 'char']) {
  const d = path.join(ROOT, dir);
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.html') || f === 'index.html') continue;
    const p = path.join(d, f);
    let t = fs.readFileSync(p, 'utf8');
    if (t.includes('全部词组')) continue;
    if (dir === 'ci') {
      t = t.replace('<a href="../char/">全部单字</a></header>', `<a href="../char/">全部单字</a>${links}</header>`);
    } else {
      t = t.replace('</header>', `${links}</header>`);
    }
    fs.writeFileSync(p, t, 'utf8');
    n += 1;
  }
}
console.log('static pages updated:', n);
