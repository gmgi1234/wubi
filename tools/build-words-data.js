// Build word data for 词组单页: codes in three versions, root splits, weights.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const DICT = path.join(ROOT, 'qingfeng/WindInput/schemas/dicts/wubi_union.dict.yaml');
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));

const codeOf = (ver, ch) => (tables[ver][ch] || {}).c || '';
const rootsOf = (ver, ch) => (tables[ver][ch] || {}).r || [];

// 五笔词组编码
function wordCode(chars, ver) {
  const codes = chars.map((c) => codeOf(ver, c));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 1) return codes[0];
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

// 五笔词组字根（按取码规则抽根）
// 递归展开成基本字根（成字字根 r[0]===自身，不再拆）
function expandRoots(ver, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[ver] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) {
      out.push(...expandRoots(ver, e.r, depth + 1));
    } else {
      out.push(r);
    }
  }
  return out;
}

function wordRoots(chars, ver) {
  const R = chars.map((c) => expandRoots(ver, rootsOf(ver, c)));
  if (R.some((r) => !r.length)) return [];
  const n = chars.length;
  if (n === 2) return [...R[0].slice(0, 2), ...R[1].slice(0, 2)];
  if (n === 3) return [R[0][0], R[1][0], ...R[2].slice(0, 2)];
  if (n === 4) return R.map((r) => r[0]);
  return [R[0][0], R[1][0], R[2][0], R[n - 1][0]];
}

const words = new Map();
for (const line of fs.readFileSync(DICT, 'utf8').split('\n')) {
  if (!line || line[0] === '#' || line[0] === '-' || line[0] === ' ') continue;
  const parts = line.split('\t');
  if (parts.length < 5) continue;
  const w = parts[0].trim();
  if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(w)) continue;
  const n = [...w].length;
  if (n < 2 || n > 6) continue;
  const weight = Number(parts[2]) || 0;
  const pinyin = (parts[4] || '').trim();
  const prev = words.get(w);
  if (!prev || prev.weight < weight) words.set(w, { w, weight, pinyin });
}

// 补充 jieba 词表里、码表没有的常用词（这样「计算机」「花园」这类也能进）
const jiebaPath0 = path.join(ROOT, 'tools', 'jieba-dict.txt');
if (fs.existsSync(jiebaPath0)) {
  for (const line of fs.readFileSync(jiebaPath0, 'utf8').split('\n')) {
    const parts = line.trim().split(' ');
    if (parts.length < 2) continue;
    const w = parts[0];
    if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(w)) continue;
    const n = [...w].length;
    if (n < 2 || n > 6) continue;
    if (words.has(w)) continue;
    const freq = Number(parts[1]) || 0;
    if (freq <= 0) continue;
    const chars = [...w];
    const ok = chars.every((c) => (tables.v86[c] || {}).c && (tables.v06[c] || {}).c);
    if (!ok) continue;
    words.set(w, { w, weight: freq, pinyin: '' });
  }
}

console.log('unique words 2-6:', words.size);

const list = [];
for (const { w, weight, pinyin } of words.values()) {
  const chars = [...w];
  const c86 = wordCode(chars, 'v86');
  const c98 = wordCode(chars, 'v98');
  const c06 = wordCode(chars, 'v06');
  if (!c86 || !c06) continue;
  list.push({
    w, n: chars.length, weight, pinyin,
    c86, c98, c06,
    r86: wordRoots(chars, 'v86'),
    r98: wordRoots(chars, 'v98'),
    r06: wordRoots(chars, 'v06'),
    chars,
  });
}

// 用 jieba 词频排序（比码表里的 weight 更靠谱）
const jieba = new Map();
const jiebaPath = path.join(ROOT, 'tools', 'jieba-dict.txt');
if (fs.existsSync(jiebaPath)) {
  for (const line of fs.readFileSync(jiebaPath, 'utf8').split('\n')) {
    const parts = line.trim().split(' ');
    if (parts.length < 2) continue;
    const w = parts[0];
    const f = Number(parts[1]) || 0;
    if (!jieba.has(w) || jieba.get(w) < f) jieba.set(w, f);
  }
}
for (const it of list) it.freq = jieba.get(it.w) || 0;
list.sort((a, b) => b.freq - a.freq || b.weight - a.weight || a.w.localeCompare(b.w));
const byLen = {};
for (const it of list) byLen[it.n] = (byLen[it.n] || 0) + 1;
console.log('with codes:', list.length, JSON.stringify(byLen));

// 选量：2字 5000，3字 1500，4字 2500，5/6 全部，再加上单字页常用词组里出现的高频词
const extraKeepPath = path.join(ROOT, 'tools', 'words-extra-keep.json');
const extraKeep = fs.existsSync(extraKeepPath) ? new Set(JSON.parse(fs.readFileSync(extraKeepPath, 'utf8'))) : new Set();
const picked = [...list.filter((x) => x.n === 2),
                ...list.filter((x) => x.n === 3).slice(0, 1500),
                ...list.filter((x) => x.n === 4).slice(0, 2500),
                ...list.filter((x) => x.n >= 5)];
const pickedSet = new Set(picked.map((x) => x.w));
const extraPicked = list.filter((x) => extraKeep.has(x.w) && !pickedSet.has(x.w));
const pick = [...picked, ...extraPicked];
console.log('selected:', pick.length, '(+extra', extraPicked.length + ')');
fs.writeFileSync(path.join(ROOT, 'tools', 'words.json'), JSON.stringify(pick), 'utf8');
console.log('written tools/words.json', (fs.statSync(path.join(ROOT, 'tools', 'words.json')).size / 1024 / 1024).toFixed(1), 'MB');
