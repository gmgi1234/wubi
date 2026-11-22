// Compare two harness dumps and report per-char differences.
// Usage: node compare.js <before.ndjson> <after.ndjson>
const fs = require('node:fs');

function load(file) {
  const map = new Map();
  let meta = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);
    if (rec._meta) { meta = rec._meta; continue; }
    if (!rec.c) continue;
    map.set(rec.c, rec);
  }
  map.meta = meta;
  return map;
}

const before = load(process.argv[2]);
const after = load(process.argv[3]);
const keys = new Set([...before.keys(), ...after.keys()]);

const diffs = [];
for (const key of keys) {
  const a = before.get(key);
  const b = after.get(key);
  if (!a || !b) { diffs.push({ key, kind: a ? 'missing-after' : 'new-after' }); continue; }
  const fields = [];
  if (a.n !== b.n) fields.push(`n ${a.n}->${b.n}`);
  if (JSON.stringify(a.map) !== JSON.stringify(b.map)) fields.push(`map ${JSON.stringify(a.map)} -> ${JSON.stringify(b.map)}`);
  if (JSON.stringify(a.roots) !== JSON.stringify(b.roots)) fields.push('roots');
  if (a.code !== b.code) fields.push(`code ${a.code}->${b.code}`);
  if (a.error || b.error) fields.push(`error ${a.error || ''}${b.error || ''}`);
  if (fields.length) diffs.push({ key, kind: fields.join('; ') });
}

console.log('before', before.size, 'after', after.size, 'diff', diffs.length);
if (before.meta) console.log('  baseline:', before.meta.source, '|', before.meta.note);
if (after.meta) console.log('  candidate:', after.meta.source, '|', after.meta.note);
for (const d of diffs.slice(0, 40)) console.log('  ', d.key, d.kind);
if (diffs.length > 40) console.log('  ...');
process.exitCode = diffs.length ? 1 : 0;
