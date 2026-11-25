// 重新补词：权重提高，保证同码时排在前面
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const WI = path.join(ROOT, 'qingfeng/WindInput');
const dictPath = path.join(WI, 'schemas/dicts/wubi_union.dict.yaml');
const bakPath = dictPath + '.bak';

// 从备份恢复（备份是补词前的原始词典）
if (fs.existsSync(bakPath)) {
  fs.copyFileSync(bakPath, dictPath);
  console.log('已从备份恢复原始词典');
}

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const lines = fs.readFileSync(dictPath, 'utf8').split(/\r?\n/);
const existing = new Set();
for (const l of lines) {
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
  added.push(`${w}\t${code}\t50000\t${code}\t`);
  existing.add(w);
}

const body = lines.join('\n').replace(/\n+$/, '\n');
fs.writeFileSync(dictPath, body + added.join('\n') + (added.length ? '\n' : ''), 'utf8');
console.log('补词:', added.length, '| 权重 50000 | 文件大小:', Math.round(fs.statSync(dictPath).size / 1024 / 1024 * 100) / 100, 'MB');
console.log('样例:', added.slice(0, 3).join(' | '));
