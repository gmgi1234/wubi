// 生成 WindInput 词组拆分注释词典（覆盖全部 122,491 个词组）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const WI = path.join(ROOT, 'qingfeng/WindInput');

// 1) 单字拆字库（PUA 字根序列）
const chaizi = new Map();
for (const line of fs.readFileSync(path.join(WI, 'schemas/wubi06_chaizi_pua.txt'), 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [ch, seq] = line.split('\t');
  if (!ch || !seq) continue;
  chaizi.set(ch, [...seq]); // 直接按字符切分 PUA 根
}
console.log('单字拆字:', chaizi.size);

// 2) 词表 + 编码
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const words = [];
for (let n = 2; n <= 12; n += 1) {
  const f = path.join(ROOT, 'data', `word-len-${n}.js`);
  if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}
console.log('词组数:', words.length);

function rootsOf(chars) {
  const per = chars.map((c) => chaizi.get(c));
  if (per.some((r) => !r || !r.length)) return null;
  const n = chars.length;
  if (n === 2) return [...per[0].slice(0, 2), ...per[1].slice(0, 2)];
  if (n === 3) return [per[0][0], per[1][0], ...per[2].slice(0, 2)];
  if (n === 4) return per.map((r) => r[0]);
  return [per[0][0], per[1][0], per[2][0], per[n - 1][0]];
}

function codeOf(chars) {
  const codes = chars.map((c) => ((tables.v06[c] || {}).c || ''));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

const out = [];
let skipped = 0;
for (const w of words) {
  const chars = [...w];
  if (chars.length < 2) continue;
  const roots = rootsOf(chars);
  const code = codeOf(chars);
  if (!roots || roots.length !== 4 || !code) { skipped += 1; continue; }
  out.push(`${w}\t${roots.join(' ')} · 06:${code}`);
}

out.sort((a, b) => a.localeCompare(b));
const target = path.join(WI, 'schemas/comments/ci_chaifen.txt');
fs.writeFileSync(target, out.join('\n') + '\n', 'utf8');
console.log('写入:', out.length, '条 | 跳过:', skipped);
console.log('大小:', Math.round(fs.statSync(target).size / 1024), 'KB');
console.log('样例:', out.slice(0, 3).join(' | '));
