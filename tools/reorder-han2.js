// Reorder 瀚's strokes into standard order: 氵(3) → 龺(8) → 人(2) → 羽(6).
// Old order had 羽's left strokes before 人, and the two 人 strokes split (14, 17).
const fs = require('node:fs');

const ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 17, 13, 11, 12, 16, 18, 15];
const ch = '瀚';
const file = `D:/Users/10061/Downloads/wubi/data/chars/${ch}.json`;
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (data.strokes.length !== ORDER.length) throw new Error('unexpected count ' + data.strokes.length);

const out = {
  ...data,
  strokes: ORDER.map((i) => data.strokes[i]),
  medians: ORDER.map((i) => data.medians[i]),
};
fs.writeFileSync(file, JSON.stringify(out), 'utf8');
console.log('reordered', ch, ORDER.length, 'strokes');
