// Scan stroke data quality for every character that has an 86 code.
const fs = require('node:fs');
const path = require('node:path');

const W = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(`${W}/tools/tables.json`, 'utf8'));
const chars = Object.keys(tables.v86);

function bboxFromMedians(medians) {
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const stroke of medians) {
    for (const [x, y] of stroke) {
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
  }
  return { minx, maxx, miny, maxy };
}

const report = [];
let missing = 0;
let small = 0;
let narrow = 0;
let ok = 0;

for (const ch of chars) {
  const file = path.join(W, 'data', 'chars', `${ch}.json`);
  if (!fs.existsSync(file)) {
    missing += 1;
    report.push({ ch, status: 'missing', roots: tables.v86[ch].r });
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    missing += 1;
    report.push({ ch, status: 'broken', roots: tables.v86[ch].r });
    continue;
  }
  const medians = data.medians || [];
  if (!medians.length) {
    report.push({ ch, status: 'no-medians', roots: tables.v86[ch].r });
    continue;
  }
  const b = bboxFromMedians(medians);
  const h = Math.round(b.maxy - b.miny);
  const w = Math.round(b.maxx - b.minx);
  const cx = Math.round((b.minx + b.maxx) / 2);
  const cy = Math.round((b.miny + b.maxy) / 2);
  let status = 'ok';
  if (h < 700) { status = 'small'; small += 1; }
  else if (w < 600) { status = 'narrow'; narrow += 1; }
  else ok += 1;
  report.push({ ch, status, h, w, cx, cy, strokes: medians.length, roots: tables.v86[ch].r });
}

fs.writeFileSync(`${W}/tools/scan-report.json`, JSON.stringify(report), 'utf8');
const byStatus = (s) => report.filter((r) => r.status === s);
console.log('total', chars.length, 'ok', ok, 'small', small, 'narrow', narrow, 'missing', missing);
console.log('\n-- missing sample --');
console.log(byStatus('missing').slice(0, 20).map((r) => r.ch).join(''));
console.log('\n-- small sample --');
console.log(byStatus('small').slice(0, 30).map((r) => `${r.ch}(${r.h})`).join(' '));
console.log('\n-- narrow sample --');
console.log(byStatus('narrow').slice(0, 30).map((r) => `${r.ch}(${r.w})`).join(' '));
