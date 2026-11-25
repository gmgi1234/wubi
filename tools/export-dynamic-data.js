// 导出「模板 + 数据」方案所需的数据。
//   site/data/char-<b>.js : 每个字一条记录（编码/拆分/补码/词组/相关字），不含字形
//   site/data/word-<b>.js : 每个词一条记录（三版编码 + 三版字根）
// 字形仍由 site/svg/<字>-<版本>.svg 按需 fetch，避免整桶加载。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'data');
fs.mkdirSync(OUT, { recursive: true });

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const pinyin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pinyin-map.json'), 'utf8'));
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));

const VER = { '86': 'v86', '98': 'v98', '06': 'v06' };
const BUCKETS = 64;
const bucketOf = (s) => s.charCodeAt(0) % BUCKETS;

const SUPP = {
  G: [1, 1], F: [1, 2], D: [1, 3], H: [2, 1], J: [2, 2], K: [2, 3],
  T: [3, 1], R: [3, 2], E: [3, 3], Y: [4, 1], U: [4, 2], I: [4, 3],
  N: [5, 1], B: [5, 2], V: [5, 3],
};

function expandRoots(v, roots, depth = 0) {
  if (depth > 6) return roots.slice();
  const out = [];
  for (const r of roots) {
    const e = (tables[v] || {})[r];
    if (e && Array.isArray(e.r) && e.r.length && e.r[0] !== r && !e.r.includes(r)) out.push(...expandRoots(v, e.r, depth + 1));
    else out.push(r);
  }
  return out;
}

const charBuckets = Array.from({ length: BUCKETS }, () => ({}));
const wordBuckets = Array.from({ length: BUCKETS }, () => ({}));

for (const ch of Object.keys(tables.v86)) {
  const md = meta[ch] || {};
  const rec = { c: ch, py: pinyin[ch] || '', w: (md.words || []).slice(0, 8), rel: (md.related || []).slice(0, 8), v: {} };
  for (const ver of ['86', '98', '06']) {
    const e = tables[VER[ver]][ch];
    if (!e || !e.c) continue;
    const roots = expandRoots(VER[ver], e.r || []);
    const letters = e.c.split('');
    const items = roots.map((r, i) => {
      let pos = -1;
      if (i < 3) pos = i;
      else if (i === roots.length - 1 && roots.length >= 4) pos = letters.length - 1;
      return { r, l: pos >= 0 ? (letters[pos] || '') : '' };
    });
    const supIdx = (e.sup && e.sup.length) ? e.sup.slice()
      : (roots.length < letters.length && roots.length < 4 ? [letters.length - 1] : []);
    const sup = supIdx.map((i) => {
      const L = letters[i] || '';
      const rev = SUPP[L];
      return { i, l: L, last: rev ? ['横', '竖', '撇', '捺', '折'][rev[0] - 1] : '', st: rev ? ['左右', '上下', '杂合'][rev[1] - 1] : '' };
    });
    rec.v[ver] = { code: e.c, roots: e.r || [], split: e.r || [], items, sup };
  }
  if (!Object.keys(rec.v).length) continue;
  charBuckets[bucketOf(ch)][ch] = rec;
}

// 词组：常用词 + 单字页上出现的所有词 + 之前生成过的全部词组页
const wordSet = new Map(words.map((x) => [x.w, x]));
const pagesList = path.join(ROOT, 'tools', 'word-pages.json');
if (fs.existsSync(pagesList)) {
  for (const w of JSON.parse(fs.readFileSync(pagesList, 'utf8'))) {
    if (!wordSet.has(w)) wordSet.set(w, null);
  }
}
// 码表里的全部词组（2–12 字），保证长词也能查到
const DICT = path.join(ROOT, 'qingfeng/WindInput/schemas/dicts/wubi_union.dict.yaml');
if (fs.existsSync(DICT)) {
  for (const line of fs.readFileSync(DICT, 'utf8').split('\n')) {
    if (!line || line[0] === '#' || line[0] === '-' || line[0] === ' ') continue;
    const w = line.split('\t')[0].trim();
    if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(w)) continue;
    const n = [...w].length;
    if (n < 2 || n > 12) continue;
    if (wordSet.has(w)) continue;
    if (![...w].every((c) => (tables.v86[c] || {}).c && (tables.v06[c] || {}).c)) continue;
    wordSet.set(w, null);
  }
}
for (const md of Object.values(meta)) {
  for (const w of md.words || []) {
    if (wordSet.has(w)) continue;
    const chars = [...w];
    if (chars.length < 2 || chars.length > 12) continue;
    if (!chars.every((c) => (tables.v86[c] || {}).c && (tables.v06[c] || {}).c)) continue;
    wordSet.set(w, null);
  }
}

function wordCode(chars, v) {
  const codes = chars.map((c) => ((tables[v] || {})[c] || {}).c || '');
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}

// 键名字（25 个）：编码是键位连按四下，词组里取两码就是「字、字」
const KEY_NAMES = new Set('王土大木工目日口田山禾白月人金言立水火之已子女又纟'.split(''));

function rootsTaken(c, v, k) {
  const e = (tables[v] || {})[c] || {};
  const ex = expandRoots(v, e.r || []);
  if (!ex.length) return Array.from({ length: k }, () => c);
  // 字根数少于取码数时（键名字、一 这类「报户口」的字），多出的码沿用最后一个字根
  return Array.from({ length: k }, (_, i) => ex[Math.min(i, ex.length - 1)]);
}

function wordRootsOf(chars, v) {
  const n = chars.length;
  if (n === 2) return [...rootsTaken(chars[0], v, 2), ...rootsTaken(chars[1], v, 2)];
  if (n === 3) return [...rootsTaken(chars[0], v, 1), ...rootsTaken(chars[1], v, 1), ...rootsTaken(chars[2], v, 2)];
  if (n === 4) return chars.map((c) => rootsTaken(c, v, 1)[0]);
  return [rootsTaken(chars[0], v, 1)[0], rootsTaken(chars[1], v, 1)[0], rootsTaken(chars[2], v, 1)[0], rootsTaken(chars[n - 1], v, 1)[0]];
}

// 相关词组：同首字的其他词（最多 10 个，短的优先）
const byFirst = new Map();
for (const w of wordSet.keys()) {
  const k = [...w][0];
  if (!byFirst.has(k)) byFirst.set(k, []);
  byFirst.get(k).push(w);
}
for (const arr of byFirst.values()) {
  arr.sort((a, b) => [...a].length - [...b].length || a.localeCompare(b));
}

for (const [w, base] of wordSet) {
  const chars = [...w];
  const rec = base || {
    w,
    chars,
    c86: wordCode(chars, 'v86'),
    c98: wordCode(chars, 'v98'),
    c06: wordCode(chars, 'v06'),
    r86: wordRootsOf(chars, 'v86'),
    r98: wordRootsOf(chars, 'v98'),
    r06: wordRootsOf(chars, 'v06'),
  };
  // 字根一律按「键名字重复」的规则重算，避免沿用旧数据
  rec.r86 = wordRootsOf(chars, 'v86');
  rec.r98 = wordRootsOf(chars, 'v98');
  rec.r06 = wordRootsOf(chars, 'v06');
  if (!rec.c86 || !rec.c06) continue;
  const peers = (byFirst.get(chars[0]) || []).filter((x) => x !== w).slice(0, 10);
  wordBuckets[bucketOf(chars[0])][w] = {
    w, ch: rec.chars,
    c86: rec.c86, c98: rec.c98, c06: rec.c06,
    r86: rec.r86, r98: rec.r98, r06: rec.r06,
    rel: peers,
  };
}

let total = 0;
// 检索索引：按首字分 64 桶，每个桶只有词条，页面按需加载（每桶约 15 KB）
const idxBuckets = Array.from({ length: BUCKETS }, () => []);
const allWords = [...wordSet.keys()].filter((w) => {
  const b = bucketOf([...w][0]);
  return !!wordBuckets[b][w];
});
for (const w of allWords) idxBuckets[bucketOf([...w][0])].push(w);
for (let b = 0; b < BUCKETS; b++) {
  idxBuckets[b].sort((a, c) => a.localeCompare(c));
  fs.writeFileSync(path.join(OUT, `word-idx-${b}.js`), `window.WORD_IDX_${b}=` + JSON.stringify(idxBuckets[b]) + ';', 'utf8');
}
// 兼容：整包索引（不推荐加载，保留给离线/调试）
fs.writeFileSync(path.join(OUT, 'word-index.js'), 'window.WORD_INDEX=' + JSON.stringify(allWords) + ';', 'utf8');
console.log('word index:', allWords.length, '| buckets:', BUCKETS);

// 单字检索索引：[字, 拼音] 全量，约 100 KB，一次加载即可
const rankOf = new Map(ranking.map((c, i) => [c, i]));
const charIdx = [];
for (const b of charBuckets) {
  for (const [c, rec] of Object.entries(b)) {
    const plain = String(rec.py || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    charIdx.push([c, plain]);
  }
}
// 按常用度排序，检索结果里常用字优先
charIdx.sort((a, b) => (rankOf.has(a[0]) ? rankOf.get(a[0]) : 1e6) - (rankOf.has(b[0]) ? rankOf.get(b[0]) : 1e6));
fs.writeFileSync(path.join(OUT, 'char-idx.js'), 'window.CHAR_IDX=' + JSON.stringify(charIdx) + ';', 'utf8');

const wordRank = new Map(words.map((x, i) => [x.w, i]));
const freqRank = (w) => (wordRank.has(w) ? wordRank.get(w) : 1e6);

// 按字数分类的词表：word-len-<n>.js（n = 2..12）
const byLen = new Map();
for (const w of allWords) {
  const n = [...w].length;
  if (!byLen.has(n)) byLen.set(n, []);
  byLen.get(n).push(w);
}
const lenSummary = [];
for (const [n, arr] of [...byLen.entries()].sort((a, b) => a[0] - b[0])) {
  arr.sort((x, y) => freqRank(x) - freqRank(y) || x.localeCompare(y));
  fs.writeFileSync(path.join(OUT, `word-len-${n}.js`), `window.WORD_LEN_${n}=` + JSON.stringify(arr) + ';', 'utf8');
  lenSummary.push(n + ':' + arr.length);
}
console.log('word lengths:', lenSummary.join(' | '));

console.log('char index:', charIdx.length, '| KB:', Math.round(fs.statSync(path.join(OUT, 'char-idx.js')).size / 1024));

let chars = 0;
let ws = 0;
for (let b = 0; b < BUCKETS; b++) {
  chars += Object.keys(charBuckets[b]).length;
  ws += Object.keys(wordBuckets[b]).length;
  const cp = path.join(OUT, `char-${b}.js`);
  const wp = path.join(OUT, `word-${b}.js`);
  fs.writeFileSync(cp, `window.CHAR_DATA_${b}=` + JSON.stringify(charBuckets[b]) + ';', 'utf8');
  fs.writeFileSync(wp, `window.WORD_DATA_${b}=` + JSON.stringify(wordBuckets[b]) + ';', 'utf8');
  total += fs.statSync(cp).size + fs.statSync(wp).size;
}
console.log('chars:', chars, '| words:', ws);
console.log('bucket files:', BUCKETS * 2, '| total MB:', (total / 1048576).toFixed(1));
