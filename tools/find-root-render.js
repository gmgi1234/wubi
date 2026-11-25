// Find where the page renders the root list (字根区) so we can wrap names with a font span.
const fs = require('node:fs');

const src = fs.readFileSync('D:/Users/10061/Downloads/wubi/src/app.js', 'utf8');
const lines = src.split('\n');
const needles = ['字根拆分', 'root-item', 'roots-area', 'rootArea', 'root-list', 'rootList', 'renderRoots'];

for (const n of needles) {
  const hits = [];
  lines.forEach((l, i) => { if (l.includes(n)) hits.push([i + 1, l.trim().slice(0, 120)]); });
  if (hits.length) {
    console.log('==', n, hits.length);
    for (const [ln, text] of hits.slice(0, 6)) console.log('  ', ln, text);
  }
}
