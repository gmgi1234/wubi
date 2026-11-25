// Print per-stroke bounding boxes for one character from data/chars/<char>.json
// Usage: node stroke-bbox.js <char>
const fs = require('node:fs');

const ch = process.argv[2];
const file = `D:/Users/10061/Downloads/wubi/data/chars/${ch}.json`;
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const strokes = data.strokes || [];
console.log('strokes:', strokes.length);

function nums(d) {
  return (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
}

strokes.forEach((d, i) => {
  const v = nums(d);
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (let k = 0; k + 1 < v.length; k += 2) {
    const x = v[k], y = v[k + 1];
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
  const w = Math.round(maxx - minx), h = Math.round(maxy - miny);
  const cx = Math.round((minx + maxx) / 2), cy = Math.round((miny + maxy) / 2);
  console.log(
    String(i).padStart(2),
    'w=' + String(w).padStart(4),
    'h=' + String(h).padStart(4),
    'cx=' + String(cx).padStart(4),
    'cy=' + String(cy).padStart(4),
    'x=' + Math.round(minx) + '..' + Math.round(maxx),
    'y=' + Math.round(miny) + '..' + Math.round(maxy),
  );
});
