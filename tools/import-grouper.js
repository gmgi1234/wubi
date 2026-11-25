// Convert a branch-grouper export (screen coords, y down) into site JSON (data coords, y up).
// Usage: node import-grouper.js <input.json> <char>
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const src = process.argv[2];
const ch = process.argv[3];

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
if (data.strokes.length < 1) throw new Error('no strokes');

const flip = (d) => {
  const out = [];
  const tokens = d.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) || [];
  let buf = [];
  for (const t of tokens) {
    if (/[A-Za-z]/.test(t)) { out.push(t); buf = []; continue; }
    buf.push(parseFloat(t));
    if (buf.length === 2) {
      out.push(buf[0].toFixed(1), (900 - buf[1]).toFixed(1));
      buf = [];
    }
  }
  return out.join(' ');
};

const strokes = data.strokes.map((s) => flip(s.d));
const medians = data.strokes.map((s) => s.medians.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));

const target = path.join(BASE, 'data', 'chars', `${ch}.json`);
fs.copyFileSync(target, `${target}.bak-grouper`);
fs.writeFileSync(target, JSON.stringify({ strokes, medians }), 'utf8');
console.log(`${ch}: wrote ${strokes.length} strokes (backup: ${ch}.json.bak-grouper)`);
