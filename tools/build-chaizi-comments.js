// Rebuild ci_chaifen.txt:
//   words  -> "<4 roots> · 06:<新世纪词组编码>"
//   chars  -> "86:XXXX 98:XXXX 06:XXXX"
const fs = require('node:fs');
const path = require('node:path');

const UD = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput';
const CODE_DIR = 'D:/Users/10061/Downloads/wubi/五笔码表';
const chaiziPath = path.join(UD, 'schemas/wubi06_chaizi_pua.txt');
const dictPath = path.join(UD, 'schemas/dicts/wubi_union.dict.yaml');
const outPath = path.join(UD, 'schemas/comments/ci_chaifen.txt');

function loadCodes(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const ch = parts[0].trim();
    const code = parts[1].trim();
    if (ch.length !== 1 || !/^[a-z]{1,4}$/i.test(code)) continue;
    const up = code.toUpperCase();
    const prev = map.get(ch);
    if (!prev || up.length > prev.length) map.set(ch, up);
  }
  return map;
}

const c86 = loadCodes(path.join(CODE_DIR, '86/wubi.dict.yaml'));
const c98 = loadCodes(path.join(CODE_DIR, '98/wubi.dict.yaml'));
const c06 = loadCodes(path.join(CODE_DIR, '06/wubi.dict.yaml'));

const chaizi = new Map();
for (const line of fs.readFileSync(chaiziPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const ch = parts[0];
  const roots = [...parts[1].replace(/\s+/g, '')];
  if (ch.length === 1 && roots.length) chaizi.set(ch, roots);
}

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

const rootOf = (ch, idx) => {
  const r = chaizi.get(ch);
  if (!r) return null;
  if (idx === 'first') return r[0];
  if (idx === 'last') return r[r.length - 1];
  return r[idx] || null;
};
const firstTwo = (ch) => (chaizi.get(ch) || []).slice(0, 2);

// 新世纪词组编码（标准五笔词组规则）
function code06OfWord(chars) {
  const codes = chars.map((c) => c06.get(c));
  if (codes.some((c) => !c)) return null;
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((c) => c[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

const lines = [];

let wordCount = 0;
let wordCodeCount = 0;
for (const w of words) {
  const chars = [...w];
  const n = chars.length;
  let roots;
  if (n === 2) roots = [...firstTwo(chars[0]), ...firstTwo(chars[1])];
  else if (n === 3) roots = [rootOf(chars[0], 'first'), rootOf(chars[1], 'first'), rootOf(chars[2], 'first'), rootOf(chars[2], 'last')];
  else if (n === 4) roots = chars.map((c) => rootOf(c, 'first'));
  else roots = [chars[0], chars[1], chars[2], chars[n - 1]].map((c) => rootOf(c, 'first'));
  if (roots.some((r) => !r)) continue;

  const code = code06OfWord(chars);
  const comment = code ? `${roots.join(' ')} · 06:${code}` : roots.join(' ');
  if (code) wordCodeCount += 1;
  lines.push(`${w}\t${comment}`);
  wordCount += 1;
}

let charCount = 0;
for (const ch of chaizi.keys()) {
  const a = c86.get(ch);
  const b = c98.get(ch);
  const c = c06.get(ch);
  if (!a && !b && !c) continue;
  const parts = [];
  if (a) parts.push(`86:${a}`);
  if (b) parts.push(`98:${b}`);
  if (c) parts.push(`06:${c}`);
  lines.push(`${ch}\t${parts.join(' ')}`);
  charCount += 1;
}

fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`words ${wordCount} (with 06 code ${wordCodeCount}), chars ${charCount}, total ${lines.length}`);
for (const w of ['你好', '计算机', '五笔字型', '中华人民共和国']) {
  const row = lines.find((l) => l.startsWith(w + '\t'));
  if (row) console.log('  ', row.replace('\t', ' -> '));
}
