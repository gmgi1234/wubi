// Reorder 翰's strokes into the standard writing order: 龺(8) → 人(2) → 羽(6).
// Old order: 龺, 羽-left(3), 人撇, 羽(2), 人捺, 羽(1) — the two 人 strokes were split.
const fs = require('node:fs');

const ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 11, 14, 10, 8, 9, 13, 15, 12]; // old indices, new sequence
const file = 'D:/Users/10061/Downloads/wubi/data/chars/翰.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (data.strokes.length !== 16 || data.medians.length !== 16) {
  throw new Error('unexpected stroke count: ' + data.strokes.length);
}

const strokes = ORDER.map((i) => data.strokes[i]);
const medians = ORDER.map((i) => data.medians[i]);
const out = { ...data, strokes, medians };
fs.writeFileSync(file, JSON.stringify(out), 'utf8');
console.log('reordered', ORDER.length, 'strokes ->', file);
