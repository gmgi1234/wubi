// Rank characters by how many dictionary words they appear in (frequency proxy).
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const UNION = path.join(BASE, 'qingfeng/WindInput/schemas/dicts/wubi_union.dict.yaml');
const tables = JSON.parse(fs.readFileSync(path.join(BASE, 'tools/tables.json'), 'utf8'));
const known = new Set(Object.keys(tables.v86));

const counts = new Map();
for (const line of fs.readFileSync(UNION, 'utf8').split('\n')) {
  if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith(' ')) continue;
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const text = parts[0].trim();
  if (text.length < 2) continue;
  if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(text)) continue;
  for (const ch of new Set(text)) {
    if (!known.has(ch)) continue;
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
}

const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([ch]) => ch);
console.log('ranked chars:', ranked.length, '| top 20:', ranked.slice(0, 20).join(''));

const outDir = path.join(BASE, 'tools');
fs.writeFileSync(path.join(outDir, 'char-ranking.json'), JSON.stringify(ranked), 'utf8');
console.log('written tools/char-ranking.json');
