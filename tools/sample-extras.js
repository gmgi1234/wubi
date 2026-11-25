// Sample characters that have strokes + Rime code but are missing from the site's 9621.
const fs = require('node:fs');
const path = require('node:path');

const W = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(`${W}/tools/tables.json`, 'utf8'));
const coded = new Set(Object.keys(tables.v86));

const rime = new Map();
for (const line of fs.readFileSync('D:/Users/10061/Downloads/Hermes/五笔码表/86/wubi.dict.yaml', 'utf8').split('\n')) {
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const ch = parts[0].trim();
  const code = parts[1].trim();
  if (!/^[a-z]{1,4}$/i.test(code)) continue;
  if ([...ch].length === 1 && !rime.has(ch)) rime.set(ch, code);
}

const strokes = fs.readdirSync(path.join(W, 'data', 'chars')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const extras = strokes.filter((c) => !coded.has(c) && rime.has(c) && /[\u4e00-\u9fff]/.test(c));

const want = Number(process.argv[2] || 40);
// spread the sample across the list instead of taking the first N
const step = Math.max(1, Math.floor(extras.length / want));
const picked = [];
for (let i = 0; i < extras.length && picked.length < want; i += step) picked.push(extras[i]);
console.log('extras:', extras.length, 'sample:', picked.length);
console.log(picked.map((c) => `${c}(${rime.get(c)})`).join(' '));
