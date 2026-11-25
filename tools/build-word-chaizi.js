// Build a word-level 拆分 comment dictionary for WindInput from the chaizi DB + union dict.
const fs = require('node:fs');
const path = require('node:path');

const UD = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput';
const chaiziPath = path.join(UD, 'schemas/wubi06_chaizi_pua.txt');
const dictPath = path.join(UD, 'schemas/dicts/wubi_union.dict.yaml');
const outDir = path.join(UD, 'schemas/comments');
const outPath = path.join(outDir, 'ci_chaifen.txt');

// 1) char -> roots
const chaizi = new Map();
for (const line of fs.readFileSync(chaiziPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const ch = parts[0];
  const roots = [...parts[1].replace(/\s+/g, '')];
  if (ch.length === 1 && roots.length) chaizi.set(ch, roots);
}
console.log('chaizi chars:', chaizi.size);

// 2) word list from the union dictionary (text column)
const words = new Set();
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith(' ')) continue;
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const text = parts[0].trim();
  if (!text || text.length < 2) continue;
  if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(text)) continue;
  words.add(text);
}
console.log('words:', words.size);

function rootOf(ch, idx) {
  const r = chaizi.get(ch);
  if (!r) return null;
  if (idx === 'first') return r[0];
  if (idx === 'last') return r[r.length - 1];
  return r[idx] || null;
}

function firstTwo(ch) {
  const r = chaizi.get(ch);
  return r ? r.slice(0, 2) : [];
}

const lines = [];
let built = 0;
let skipped = 0;
for (const w of words) {
  const chars = [...w];
  const n = chars.length;
  let roots = [];
  if (n === 2) {
    roots = [...firstTwo(chars[0]), ...firstTwo(chars[1])];
  } else if (n === 3) {
    roots = [rootOf(chars[0], 'first'), rootOf(chars[1], 'first'), rootOf(chars[2], 'first'), rootOf(chars[2], 'last')];
  } else if (n === 4) {
    roots = chars.map((c) => rootOf(c, 'first'));
  } else {
    roots = [chars[0], chars[1], chars[2], chars[n - 1]].map((c) => rootOf(c, 'first'));
  }
  if (roots.some((r) => !r)) { skipped += 1; continue; }
  lines.push(`${w}\t${roots.join(' ')}`);
  built += 1;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`built ${built} word splits, skipped ${skipped} -> ${outPath}`);
for (const sample of ['你好', '计算机', '五笔字型', '中华人民共和国']) {
  const row = lines.find((l) => l.startsWith(sample + '\t'));
  if (row) console.log('  sample:', row);
}

