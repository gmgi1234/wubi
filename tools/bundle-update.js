// Replace one character's stroke data inside data/stroke-bundle.js (file:// offline pack).
// Usage: node bundle-update.js <char>
const fs = require('node:fs');

const ch = process.argv[2];
const BUNDLE = 'D:/Users/10061/Downloads/wubi/data/stroke-bundle.js';
const json = JSON.parse(fs.readFileSync(`D:/Users/10061/Downloads/wubi/data/chars/${ch}.json`, 'utf8'));

const text = fs.readFileSync(BUNDLE, 'utf8');
const needle = `"${ch}":{`;
const start = text.indexOf(needle);
if (start < 0) throw new Error('entry not found');
const objStart = start + needle.length - 1;

// find the matching closing brace
let depth = 0;
let inString = false;
let escaped = false;
let end = -1;
for (let i = objStart; i < text.length; i += 1) {
  const c = text[i];
  if (inString) {
    if (escaped) escaped = false;
    else if (c === '\\') escaped = true;
    else if (c === '"') inString = false;
    continue;
  }
  if (c === '"') inString = true;
  else if (c === '{') depth += 1;
  else if (c === '}') {
    depth -= 1;
    if (depth === 0) { end = i; break; }
  }
}
if (end < 0) throw new Error('unbalanced entry');

const entry = JSON.parse(text.slice(objStart, end + 1));
entry.strokes = json.strokes;
entry.medians = json.medians;
const replaced = JSON.stringify(entry);

const out = text.slice(0, objStart) + replaced + text.slice(end + 1);
fs.writeFileSync(BUNDLE, out, 'utf8');
console.log('bundle updated:', needle, 'old', end - objStart + 1, 'bytes ->', replaced.length, 'bytes');
