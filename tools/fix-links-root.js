// 目录搬到根后，把站内链接改成相对路径
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';

function walk(dir, cb) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

let n = 0;
for (const dir of ['char', 'ci']) {
  walk(path.join(ROOT, dir), (p) => {
    if (!p.endsWith('.html')) return;
    const before = fs.readFileSync(p, 'utf8');
    const after = before
      .replace(/href="\/"/g, 'href="../"')
      .replace(/href="\/char\/([^"\/]+?)\.html"/g, (m, c) => `href="../char.html?c=${c}"`)
      .replace(/href="\/ci\/([^"\/]+?)\.html"/g, (m, w) => `href="../ci.html?w=${w}"`);
    if (after !== before) { fs.writeFileSync(p, after, 'utf8'); n += 1; }
  });
}
console.log('static pages fixed:', n);

const renderPath = path.join(ROOT, 'data', 'render.js');
let r = fs.readFileSync(renderPath, 'utf8');
r = r.replace(/href="\/char\/"/g, 'href="char/"');
r = r.replace(/href="\/"/g, 'href="./"');
r = r.split("'/ci.html?w=").join("'ci.html?w=");
r = r.split("'/char.html?c=").join("'char.html?c=");
r = r.split('/ci.html?w=${encodeURIComponent(w)}').join('ci.html?w=${encodeURIComponent(w)}');
r = r.split('/char.html?c=${encodeURIComponent(c)}').join('char.html?c=${encodeURIComponent(c)}');
fs.writeFileSync(renderPath, r, 'utf8');
console.log('absolute hrefs left in render.js:', (r.match(/href="\//g) || []).length);

// index 页也修一下
for (const dir of ['char', 'ci']) {
  const p = path.join(ROOT, dir, 'index.html');
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/href="\/"/g, 'href="../"').replace(/href="\/ci\/"/g, 'href="../ci/"').replace(/href="\/char\/"/g, 'href="../char/"');
  if (after !== before) fs.writeFileSync(p, after, 'utf8');
}
console.log('index pages fixed');
