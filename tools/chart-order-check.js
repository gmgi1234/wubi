// Cross-check: chart cell order (components.txt) vs the alignment-derived PUA map.
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const CHART = 'D:/Users/10061/Downloads/Hermes/五笔码表/新世纪字根/xsj_zigen/新世纪五笔字根图-v1.1/components.txt';

const lines = fs.readFileSync(CHART, 'utf8').split(/\r?\n/).filter((l) => l.trim());
const map = JSON.parse(fs.readFileSync(path.join(BASE, 'tools/root-pua-map.json'), 'utf8'));

// strip a leading "* " marker
const names = lines.map((l) => l.replace(/^\*?\s*/, '').replace(/\s+[a-z]\+\d+\s*$/, '').trim());
console.log('chart cells:', names.length);

let agree = 0;
let disagree = 0;
let blank = 0;
const disagreements = [];
names.forEach((name, i) => {
  if (!name) { blank += 1; return; }
  const pua = 'U+' + (0xE100 + i).toString(16).toUpperCase();
  // find the map entry for this pua
  const entry = Object.entries(map).find(([ch, v]) => v.pua === pua);
  if (!entry) return;
  const mapped = entry[1].name;
  if (mapped === name) agree += 1;
  else {
    disagree += 1;
    if (disagreements.length < 15) disagreements.push([i, pua, name, mapped]);
  }
});
console.log('agree:', agree, 'disagree:', disagree, 'blank names:', blank);
console.log('sample disagreements (idx, pua, chart name, aligned name):');
for (const d of disagreements) console.log('  ', d.join(' | '));
