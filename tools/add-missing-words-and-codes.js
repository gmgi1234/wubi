// 1) 把缺的词组补进输入法词典  2) 单字注释补上三版编码
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const WI = path.join(ROOT, 'qingfeng/WindInput');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));

// ---------- 1) 补词 ----------
const dictPath = path.join(WI, 'schemas/dicts/wubi_union.dict.yaml');
const dictLines = fs.readFileSync(dictPath, 'utf8').split(/\r?\n/);
const existing = new Set();
for (const l of dictLines) {
  if (!l || l.startsWith('#') || l.startsWith(' ') || l.startsWith('-')) continue;
  const w = l.split('\t')[0];
  if (w) existing.add(w);
}

const words = [];
for (let n = 2; n <= 12; n += 1) {
  const f = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}

const codeOf = (chars, ver) => {
  const codes = chars.map((c) => ((tables[ver][c] || {}).c || ''));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
};

const added = [];
for (const w of words) {
  if (existing.has(w)) continue;
  const chars = [...w];
  const code = codeOf(chars, 'v06');
  if (!code) continue;
  added.push(`${w}\t${code}\t100\t${code}\t`);
  existing.add(w);
}

const out = dictLines.join('\n').replace(/\n+$/, '\n');
fs.writeFileSync(dictPath, out + added.join('\n') + (added.length ? '\n' : ''), 'utf8');
console.log('词典新增词组:', added.length, '| 8 竿子打不着 在列:', added.some((l) => l.startsWith('八竿子打不着\t')));

// ---------- 2) 单字注释补三版编码 ----------
const chaizi = new Map();
for (const line of fs.readFileSync(path.join(WI, 'schemas/wubi06_chaizi_pua.txt'), 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [ch, seq] = line.split('\t');
  if (ch && seq) chaizi.set(ch, [...seq]);
}

const lines = [];
// 词组（含拆分 + 06 编码）
for (const w of words) {
  const chars = [...w];
  const per = chars.map((c) => chaizi.get(c));
  if (per.some((r) => !r || !r.length)) continue;
  const n = chars.length;
  let roots;
  if (n === 2) roots = [...per[0].slice(0, 2), ...per[1].slice(0, 2)];
  else if (n === 3) roots = [per[0][0], per[1][0], ...per[2].slice(0, 2)];
  else if (n === 4) roots = per.map((r) => r[0]);
  else roots = [per[0][0], per[1][0], per[2][0], per[n - 1][0]];
  const code = codeOf(chars, 'v06');
  if (roots.length !== 4 || !code) continue;
  lines.push(`${w}\t${roots.join(' ')} · 06:${code}`);
}

// 单字：三版编码
let charsOk = 0;
for (const ch of chaizi.keys()) {
  const c06 = (tables.v06[ch] || {}).c;
  const c86 = (tables.v86[ch] || {}).c;
  const c98 = (tables.v98[ch] || {}).c;
  if (!c06) continue;
  const parts = [`06:${c06}`];
  if (c86) parts.push(`86:${c86}`);
  if (c98 && c98 !== c86) parts.push(`98:${c98}`);
  lines.push(`${ch}\t${parts.join(' · ')}`);
  charsOk += 1;
}

lines.sort((a, b) => a.localeCompare(b));
const target = path.join(WI, 'schemas/comments/ci_chaifen.txt');
fs.writeFileSync(target, lines.join('\n') + '\n', 'utf8');
console.log('注释词典: 单字', charsOk, '| 总行数', lines.length, '|', Math.round(fs.statSync(target).size / 1024), 'KB');
