// 给回归脚本加「题库外词」的回退：从 data/word-<bucket>.js 取记录
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/check-practice-regression.js';
let t = fs.readFileSync(p, 'utf8');

// 1) 增加回退加载器
if (!t.includes('function loadWordRecord')) {
  const loader = `
// 题库里没有时，从词组数据里回退取记录
const WORD_BUCKETS = {};
function loadWordRecord(w) {
  const b = w.charCodeAt(0) % 64;
  if (!WORD_BUCKETS[b]) {
    const f = path.join(ROOT, 'data', \`word-\${b}.js\`);
    if (!fs.existsSync(f)) return null;
    const raw = fs.readFileSync(f, 'utf8');
    try { WORD_BUCKETS[b] = JSON.parse(raw.slice(raw.indexOf('=') + 1).replace(/;\\s*$/, '')); } catch (e) { return null; }
  }
  const rec = WORD_BUCKETS[b][w];
  if (!rec) return null;
  const chars = [...w];
  const keys = chars.map((c) => {
    const r = (tables.v06[c] || {}).r || [];
    return r.length === 1 && r[0] === c ? '1' : '0';
  }).join('');
  const cheng = chars.map((c) => {
    const r = (tables.v06[c] || {}).r || [];
    return r.length && r[0] === c ? '1' : '0';
  }).join('');
  const join = (arr) => (arr || []).join(' ');
  return [w, rec.c86, rec.c86, rec.c98, join(rec.r06), join(rec.r86), join(rec.r98), keys, cheng];
}
`;
  t = t.replace('const rowOf = (w) => {', loader + '\nconst rowOf = (w) => {');
  // 2) rowOf 里回退
  t = t.replace(
    "  return rows.find((r) => r[0] === w) || null;",
    "  return rows.find((r) => r[0] === w) || loadWordRecord(w);"
  );
  fs.writeFileSync(p, t, 'utf8');
  console.log('已加题库外回退');
} else {
  console.log('已有回退');
}
