// 生成词组练习数据：每个字数一份，含三版编码与三版字根
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'data');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/words.json'), 'utf8'));

const KEY_NAMES = new Set('王土大木工目日口田山禾白月人金言立水火之已子女又纟'.split(''));

function expand(v, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[v] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) out.push(...expand(v, e.r, depth + 1));
    else out.push(r);
  }
  return out;
}

function rootsTaken(c, v, k) {
  if (KEY_NAMES.has(c)) return Array.from({ length: k }, () => c);
  const e = (tables[v] || {})[c] || {};
  const ex = expand(v, e.r || []);
  if (!ex.length) return Array.from({ length: k }, () => c);
  return Array.from({ length: k }, (_, i) => ex[Math.min(i, ex.length - 1)]);
}

function wordRoots(chars, v) {
  const n = chars.length;
  if (n === 2) return [...rootsTaken(chars[0], v, 2), ...rootsTaken(chars[1], v, 2)];
  if (n === 3) return [...rootsTaken(chars[0], v, 1), ...rootsTaken(chars[1], v, 1), ...rootsTaken(chars[2], v, 2)];
  if (n === 4) return chars.map((c) => rootsTaken(c, v, 1)[0]);
  return [rootsTaken(chars[0], v, 1)[0], rootsTaken(chars[1], v, 1)[0], rootsTaken(chars[2], v, 1)[0], rootsTaken(chars[n - 1], v, 1)[0]];
}

function codeOf(chars, v) {
  const codes = chars.map((c) => ((tables[v][c] || {}).c || ''));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

// 每个字数取前 N 个常用词
const topN = { 2: 5000, 3: 3000, 4: 3000, 5: 1500, 6: 1000 };
const buckets = new Map();
for (const it of words) {
  const n = [...it.w].length;
  const key = n >= 6 ? 6 : n;
  if (!topN[key]) continue;
  if (!buckets.has(key)) buckets.set(key, []);
  if (buckets.get(key).length < topN[key]) buckets.get(key).push(it.w);
}

let total = 0;
for (const [len, list] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
  const rows = [];
  for (const w of list) {
    const chars = [...w];
    const c6 = codeOf(chars, 'v06');
    const c8 = codeOf(chars, 'v86');
    const c9 = codeOf(chars, 'v98');
    if (!c6 || !c8) continue;
    const r6 = wordRoots(chars, 'v06').join(' ');
    const r8 = wordRoots(chars, 'v86').join(' ');
    const r9 = wordRoots(chars, 'v98').join(' ');
    const keys = chars.map((c) => {
      const arr = (tables.v06[c] || {}).r || [];
      return arr.length === 1 && arr[0] === c ? '1' : '0';
    }).join('');
    const cheng = chars.map((c) => {
      const arr = (tables.v06[c] || {}).r || [];
      return arr.length && arr[0] === c ? '1' : '0';
    }).join('');
    rows.push([w, c6.toLowerCase(), c8.toLowerCase(), c9.toLowerCase(), r6, r8, r9, keys, cheng]);
  }
  const file = path.join(OUT, `practice-${len}.js`);
  fs.writeFileSync(file, `window.PRACTICE_${len}=` + JSON.stringify(rows) + ';', 'utf8');
  total += fs.statSync(file).size;
  console.log(`${len} 字词: ${rows.length} 条 | ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
console.log('数据总量:', (total / 1048576).toFixed(2), 'MB');
