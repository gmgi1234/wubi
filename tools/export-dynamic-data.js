// 导出「模板 + 数据」方案所需的数据。
//   site/data/char-<b>.js : 每个字一条记录（编码/拆分/补码/词组/相关字），不含字形
//   site/data/word-<b>.js : 每个词一条记录（三版编码 + 三版字根）
// 字形仍由 site/svg/<字>-<版本>.svg 按需 fetch，避免整桶加载。
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'site', 'data');
fs.mkdirSync(OUT, { recursive: true });

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const pinyin = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pinyin-map.json'), 'utf8'));

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

for (const it of words) {
  wordBuckets[bucketOf(it.chars[0])][it.w] = {
    w: it.w, ch: it.chars,
    c86: it.c86, c98: it.c98, c06: it.c06,
    r86: it.r86, r98: it.r98, r06: it.r06,
  };
}

let total = 0;
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
