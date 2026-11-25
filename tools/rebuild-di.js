// Rebuild 坘 = 土 (3 strokes, from 坘) + 氐 (5 strokes, from 低), then leave fitting to fit2.py.
const fs = require('node:fs');

const BASE = 'D:/Users/10061/Downloads/wubi';
const read = (ch) => JSON.parse(fs.readFileSync(`${BASE}/data/chars/${ch}.json`, 'utf8'));

const tu = read('坘');   // 土 3 + 氐 4（缺一笔）
const di = read('低');   // 亻 2 + 氐 5

console.log('坘 strokes', tu.strokes.length, '低 strokes', di.strokes.length);
if (tu.strokes.length !== 7 || di.strokes.length !== 7) throw new Error('unexpected counts');

const strokes = [...tu.strokes.slice(0, 3), ...di.strokes.slice(2)];
const medians = [...tu.medians.slice(0, 3), ...di.medians.slice(2)];
if (strokes.length !== 8) throw new Error('expected 8 strokes');

fs.copyFileSync(`${BASE}/data/chars/坘.json`, `${BASE}/data/chars/坘.json.bak-20261122`);
fs.writeFileSync(`${BASE}/data/chars/坘.json`, JSON.stringify({ strokes, medians }), 'utf8');
console.log('坘 rebuilt with', strokes.length, 'strokes');
