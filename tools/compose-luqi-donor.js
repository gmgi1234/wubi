// 麡 = 鹿 (from 麒, left component) + 齊 (from 擠, right component).
// Both parts already sit at component size in their host characters, so only translation is needed.
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

function shift(pathD, dx, dy) {
  const out = [];
  const tokens = pathD.match(/[MQLCZ]|-?\d+(?:\.\d+)?/g) || [];
  let buf = [];
  for (const t of tokens) {
    if (/[A-Z]/.test(t)) { out.push(t); buf = []; continue; }
    buf.push(parseFloat(t));
    if (buf.length === 2) { out.push((buf[0] + dx).toFixed(1), (buf[1] + dy).toFixed(1)); buf = []; }
  }
  return out.join(' ');
}

const qi = read('麒');   // 鹿(11) + 其(8)
const ji = read('擠');   // 扌(3) + 齊(14)

const lu = { strokes: qi.strokes.slice(0, 11), medians: qi.medians.slice(0, 11) };
const qi2 = { strokes: ji.strokes.slice(3), medians: ji.medians.slice(3) };
if (lu.strokes.length !== 11 || qi2.strokes.length !== 14) throw new Error('slice mismatch');

const luBox = bbox(lu.medians);
const qiBox = bbox(qi2.medians);
console.log('鹿 box', luBox.map(Math.round).join(','), '| 齊 box', qiBox.map(Math.round).join(','));

// targets measured from KaiTi 麡: 鹿 left ~110..375, 齊 right ~380..915
const luTarget = [110, 170, 375, 900];
const qiTarget = [380, 90, 915, 905];

const dxLu = (luTarget[0] + luTarget[2]) / 2 - (luBox[0] + luBox[2]) / 2;
const dyLu = (luTarget[1] + luTarget[3]) / 2 - (luBox[1] + luBox[3]) / 2;
const dxQi = (qiTarget[0] + qiTarget[2]) / 2 - (qiBox[0] + qiBox[2]) / 2;
const dyQi = (qiTarget[1] + qiTarget[3]) / 2 - (qiBox[1] + qiBox[3]) / 2;

const strokes = [
  ...lu.strokes.map((d) => shift(d, dxLu, dyLu)),
  ...qi2.strokes.map((d) => shift(d, dxQi, dyQi)),
];
const medians = [
  ...lu.medians.map((m) => m.map(([x, y]) => [x + dxLu, y + dyLu])),
  ...qi2.medians.map((m) => m.map(([x, y]) => [x + dxQi, y + dyQi])),
];

if (strokes.length !== 25) throw new Error('expected 25');

fs.copyFileSync(path.join(BASE, 'data', 'chars', '麡.json'), path.join(BASE, 'data', 'chars', '麡.json.bak-donor'));
fs.writeFileSync(path.join(BASE, 'data', 'chars', '麡.json'), JSON.stringify({ strokes, medians, boost: 3 }), 'utf8');
console.log('麡 composed from donors: 25 strokes, shifts', dxLu.toFixed(0), dyLu.toFixed(0), '|', dxQi.toFixed(0), dyQi.toFixed(0));
