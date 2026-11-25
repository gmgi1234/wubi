// Verify that stroke-bundle.js entries match data/chars/*.json for given characters.
const fs = require('node:fs');

const BASE = 'D:/Users/10061/Downloads/wubi';
const text = fs.readFileSync(`${BASE}/data/stroke-bundle.js`, 'utf8');
const chars = process.argv.slice(2);

for (const ch of chars) {
  const needle = `"${ch}":{`;
  const start = text.indexOf(needle);
  if (start < 0) { console.log(ch, 'MISSING'); continue; }
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
    else if (c === '}') { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  const entry = JSON.parse(text.slice(objStart, end + 1));
  const data = JSON.parse(fs.readFileSync(`${BASE}/data/chars/${ch}.json`, 'utf8'));
  const sameStrokes = JSON.stringify(entry.strokes) === JSON.stringify(data.strokes);
  const sameMedians = JSON.stringify(entry.medians) === JSON.stringify(data.medians);
  console.log(`${ch} strokes=${entry.strokes.length} same=${sameStrokes && sameMedians}`);
}
