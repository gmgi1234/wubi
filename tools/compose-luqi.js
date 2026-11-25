// Rebuild 麡 from its own components' native stroke data: 鹿 (11) + 齊 (14).
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const read = (ch) => JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'chars', `${ch}.json`), 'utf8'));

function bbox(medians) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const m of medians) for (const [x, y] of m) {
    x1 = Math.min(x1, x); x2 = Math.max(x2, x);
    const yy = 900 - y; y1 = Math.min(y1, yy); y2 = Math.max(y2, yy);
  }
  return [x1, y1, x2, y2];
}

function transform(path, fn) {
  const out = [];
  const tokens = path.match(/[MQLCZ]|-?\d+(?:\.\d+)?/g) || [];
  let buf = [];
  for (const t of tokens) {
    if (/[A-Z]/.test(t)) { out.push(t); buf = []; continue; }
    buf.push(parseFloat(t));
    if (buf.length === 2) { const [x, y] = fn(buf[0], buf[1]); out.push(x.toFixed(1), y.toFixed(1)); buf = []; }
  }
  return out.join(' ');
}

function place(part, target) {
  const box = bbox(part.medians);
  const sx0 = (target[2] - target[0]) / Math.max(1, box[2] - box[0]);
  const sy0 = (target[3] - target[1]) / Math.max(1, box[3] - box[1]);
  const s = Math.min(sx0, sy0);
  const sx = s;
  const sy = s;
  const fn = (x, y) => {
    const yi = 900 - y;
    return [target[0] + (x - box[0]) * sx, 900 - (target[1] + (yi - box[1]) * sy)];
  };
  return {
    strokes: part.strokes.map((p) => transform(p, fn)),
    medians: part.medians.map((m) => m.map(([x, y]) => fn(x, y))),
    scale: [sx, sy],
  };
}

const lu = { strokes: read('鹿').strokes, medians: read('鹿').medians };
const qi = { strokes: read('齊').strokes, medians: read('齊').medians };

// 楷体实测：鹿 11 笔占左侧，齊 14 笔占右侧
const luPlaced = place(lu, [110, 170, 380, 900]);
const qiPlaced = place(qi, [380, 90, 915, 905]);

const out = {
  strokes: [...luPlaced.strokes, ...qiPlaced.strokes],
  medians: [...luPlaced.medians, ...qiPlaced.medians],
  boost: 5,
};
if (out.strokes.length !== 25) throw new Error('expected 25 strokes, got ' + out.strokes.length);

fs.copyFileSync(path.join(BASE, 'data', 'chars', '麡.json'), path.join(BASE, 'data', 'chars', '麡.json.bak-compose'));
fs.writeFileSync(path.join(BASE, 'data', 'chars', '麡.json'), JSON.stringify(out), 'utf8');
console.log('麡 composed:', out.strokes.length, 'strokes; 鹿 scale', luPlaced.scale.map((v) => v.toFixed(2)).join('x'), '齊 scale', qiPlaced.scale.map((v) => v.toFixed(2)).join('x'));

