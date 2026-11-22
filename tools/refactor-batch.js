// Move the named "===== X字特殊处理 =====" blocks into SPECIAL_CASES.
// Usage: node refactor-batch.js 爾 帶 齊 樂 盥
// Bodies are copied verbatim inside defineSpecialCase({...same-named params})
// and the dispatch order is preserved by appending in the given order.
const fs = require('node:fs');

const FILE = 'D:/Users/10061/Downloads/wubi/src/app.js';
const names = process.argv.slice(2);
if (!names.length) throw new Error('no names');

let lines = fs.readFileSync(FILE, 'utf8').split('\n');
fs.writeFileSync(FILE + '.bak-' + Date.now(), lines.join('\n'), 'utf8');

function findBanner(name) {
  const needle = `// ===== ${name}字特殊处理`;
  const idx = lines.findIndex((l) => l.includes(needle));
  if (idx < 0) throw new Error('banner not found: ' + name);
  return idx;
}

function blockRange(startIdx) {
  let ifIdx = -1;
  for (let i = startIdx + 1; i < Math.min(startIdx + 40, lines.length); i += 1) {
    if (/^    if \(/.test(lines[i])) { ifIdx = i; break; }
  }
  if (ifIdx < 0) throw new Error('no if after line ' + (startIdx + 1));
  let depth = 0;
  let opened = false;
  let end = -1;
  for (let i = ifIdx; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth += 1; opened = true; }
      else if (ch === '}') depth -= 1;
    }
    if (opened && depth === 0) { end = i; break; }
    if (depth < 0) throw new Error('unbalanced braces near line ' + (i + 1));
  }
  if (end < 0) throw new Error('unbalanced block for ' + names);
  return { from: startIdx, to: end };
}

const ranges = names.map((name) => ({ name, range: blockRange(findBanner(name)) }));

// sanity: each block must start with its banner and end with a 4-space closing brace
for (const r of ranges) {
  const first = lines[r.range.from];
  const last = lines[r.range.to];
  if (!first.includes('=====')) throw new Error('bad start: ' + first);
  if (last.trim() !== '}') throw new Error('bad end for ' + r.name + ': ' + last);
}

const defs = [];
for (const r of ranges) {
  const body = lines.slice(r.range.from, r.range.to + 1);
  defs.push(`defineSpecialCase('${r.name}', function ({ currentChar, roots, n, strokeOffset, r, supIndices, isEmbedded }) {`);
  defs.push(...body);
  defs.push('    return null;');
  defs.push('});');
  defs.push('');
}

// remove inline blocks, bottom-up
for (const r of [...ranges].sort((a, b) => b.range.from - a.range.from)) {
  lines.splice(r.range.from, r.range.to - r.range.from + 1);
}

// append the new rules right before the dispatcher function
const fnIdx = lines.findIndex((l) => l.startsWith('function autoDetectNonContinuous('));
if (fnIdx < 0) throw new Error('function not found');
lines = lines.slice(0, fnIdx).concat(defs, lines.slice(fnIdx));

fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
console.log('moved', names.join('/'), '| lines now', lines.length);
