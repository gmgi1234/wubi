// Batch-update stroke-bundle.js entries from data/chars/<char>.json (one read/write pass).
const fs = require('node:fs');

const BASE = 'D:/Users/10061/Downloads/wubi';
const BUNDLE = `${BASE}/data/stroke-bundle.js`;
const chars = process.argv.slice(2);
if (!chars.length) throw new Error('no chars given');

const text = fs.readFileSync(BUNDLE, 'utf8');
const edits = [];

for (const ch of chars) {
  const needle = `"${ch}":{`;
  const start = text.indexOf(needle);
  if (start < 0) { console.log(ch, 'not found'); continue; }
  const objStart = start + needle.length - 1;

  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = objStart; i < text.length; i += 1) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) { console.log(ch, 'unbalanced'); continue; }

  const entry = JSON.parse(text.slice(objStart, end + 1));
  const data = JSON.parse(fs.readFileSync(`${BASE}/data/chars/${ch}.json`, 'utf8'));
  entry.strokes = data.strokes;
  entry.medians = data.medians;
  if (data.boost) entry.boost = data.boost; else delete entry.boost;
  edits.push({ ch, start: objStart, end: end + 1, text: JSON.stringify(entry) });
}

edits.sort((a, b) => b.start - a.start);
let out = text;
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

fs.writeFileSync(BUNDLE, out, 'utf8');
console.log('updated', edits.length, 'entries:', edits.map((e) => e.ch).join(' '));
