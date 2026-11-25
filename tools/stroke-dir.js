// Print stroke direction (first/last median point) for one character.
const fs = require('node:fs');

const ch = process.argv[2];
const data = JSON.parse(fs.readFileSync(`D:/Users/10061/Downloads/wubi/data/chars/${ch}.json`, 'utf8'));
const strokes = data.medians || [];
console.log('medians:', strokes.length);

strokes.forEach((m, i) => {
  if (!m || !m.length) { console.log(i, 'no median'); return; }
  const [x0, y0] = m[0];
  const [x1, y1] = m[m.length - 1];
  const dx = Math.round(x1 - x0);
  const dy = Math.round(y1 - y0);
  let dir = '';
  if (Math.abs(dx) > Math.abs(dy) * 1.5) dir = 'horizontal';
  else if (Math.abs(dy) > Math.abs(dx) * 1.5) dir = 'vertical';
  else dir = dx * dy > 0 ? 'diag ↘' : 'diag ↗';
  console.log(
    String(i).padStart(2),
    `(${Math.round(x0)},${Math.round(y0)}) -> (${Math.round(x1)},${Math.round(y1)})`,
    `d=(${dx},${dy})`,
    dir,
  );
});
