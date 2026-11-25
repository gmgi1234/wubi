// Check 86/98/06 Rime dictionaries for a list of characters.
const fs = require('node:fs');

const DIR = 'D:/Users/10061/Downloads/Hermes/五笔码表';
const versions = { '86': `${DIR}/86/wubi.dict.yaml`, '98': `${DIR}/98/wubi.dict.yaml`, '06': `${DIR}/06/wubi.dict.yaml` };

function loadDict(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const ch = parts[0].trim();
    const code = parts[1].trim();
    if (!/^[a-z]{1,4}$/i.test(code)) continue;
    if ([...ch].length === 1 && !map.has(ch)) map.set(ch, code);
  }
  return map;
}

const dicts = Object.fromEntries(Object.entries(versions).map(([k, v]) => [k, loadDict(v)]));
console.log('dict sizes:', Object.entries(dicts).map(([k, m]) => `${k}=${m.size}`).join(' '));

for (const ch of process.argv.slice(2)) {
  const codes = Object.entries(dicts).map(([v, m]) => `${v}:${m.get(ch) || '—'}`);
  console.log(ch, codes.join('  '));
}
