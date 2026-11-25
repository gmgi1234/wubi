// Check candidate characters: in stroke set? in site codes? in Rime dict?
const fs = require('node:fs');
const path = require('node:path');

const W = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(`${W}/tools/tables.json`, 'utf8'));
const coded = new Set(Object.keys(tables.v86));

const rime = new Map();
const dictPath = 'D:/Users/10061/Downloads/Hermes/五笔码表/86/wubi.dict.yaml';
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const ch = parts[0].trim();
  const code = parts[1].trim();
  if (!/^[a-z]{1,4}$/i.test(code)) continue;
  if ([...ch].length === 1 && !rime.has(ch)) rime.set(ch, code);
}

const cands = process.argv.slice(2);
for (const ch of cands) {
  const hasStroke = fs.existsSync(path.join(W, 'data', 'chars', `${ch}.json`));
  console.log(
    ch,
    'strokes:', hasStroke ? 'yes' : 'no',
    '| site96:', coded.has(ch) ? 'yes' : 'no',
    '| rime:', rime.get(ch) || '-',
  );
}
