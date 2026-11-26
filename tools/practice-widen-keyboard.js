// 键盘横向拉宽：键宽自适应，行内平分整行宽度
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const oldKb = '.kb { display:flex; flex-direction:column; gap:4px; min-width:790px; }';
const newKb = '.kb { display:flex; flex-direction:column; gap:6px; width:100%; }';
const oldRow = '.kb-row { display:flex; justify-content:center; gap:4px; }';
const newRow = '.kb-row { display:flex; justify-content:center; gap:6px; width:100%; }';
const oldKey = '.kb-key { flex:0 0 auto; width:74px;';
const newKey = '.kb-key { flex:1 1 0; min-width:0;';

const oldR2 = '.kb-row.r2 { padding-left:40px; }';
const newR2 = '.kb-row.r2 { padding:0 6%; }';
const oldR3 = '.kb-row.r3 { padding-left:120px; }';
const newR3 = '.kb-row.r3 { padding:0 15%; }';

for (const [a, b] of [[oldKb, newKb], [oldRow, newRow], [oldKey, newKey], [oldR2, newR2], [oldR3, newR3]]) {
  if (!t.includes(a)) console.log('未找到:', a.slice(0, 40));
  t = t.replace(a, b);
}

// kbwrap 占满
t = t.replace('.kbwrap { margin:10px 0 2px; }', '.kbwrap { margin:10px 0 2px; width:100%; }');

fs.writeFileSync(p, t, 'utf8');
console.log('已拉宽:', t.includes('.kb { display:flex; flex-direction:column; gap:6px; width:100%; }'));
