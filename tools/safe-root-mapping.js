// Decide which roots may safely use the chart font:
// only characters outside the BMP whose chart position also agrees with the alignment.
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const CHART = 'D:/Users/10061/Downloads/Hermes/五笔码表/新世纪字根/xsj_zigen/新世纪五笔字根图-v1.1/components.txt';
const lines = fs.readFileSync(CHART, 'utf8').split(/\r?\n/).filter((l) => l.trim());
const names = lines.map((l) => l.replace(/^\*?\s*/, '').replace(/\s+[a-z]\+\d+\s*$/, '').trim());
const map = JSON.parse(fs.readFileSync(path.join(BASE, 'tools/root-pua-map.json'), 'utf8'));

const byPua = new Map();
for (const [ch, v] of Object.entries(map)) byPua.set(v.pua, { ch, ...v });

const safe = [];
const stats = { bmpAgree: 0, bmpDisagree: 0, extSafe: 0, extUnsafe: 0 };

names.forEach((name, i) => {
  if (!name) return;
  const pua = 'U+' + (0xE100 + i).toString(16).toUpperCase();
  const entry = byPua.get(pua);
  const isExt = [...name].length === 1 && name.codePointAt(0) > 0xffff;
  if (!entry) return;
  const agree = entry.name === name;
  if (isExt) {
    if (agree) { safe.push([name, pua]); stats.extSafe += 1; } else stats.extUnsafe += 1;
  } else if (agree) stats.bmpAgree += 1; else stats.bmpDisagree += 1;
});

console.log('stats', JSON.stringify(stats));
console.log('safe ext-B roots:', safe.length, safe.map(([n, p]) => `${n}->${p}`).join(' '));
