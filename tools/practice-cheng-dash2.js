// 用正则替换着色分支（适配缩进/换行差异）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const re = /if \(slot\.dataset\.key === 'dash'\) \{[\s\S]*?\n\s*\} else \{[\s\S]*?\n\s*\}/;
const m = t.match(re);
if (!m) { console.log('未匹配到分支'); process.exit(1); }
console.log('匹配到的分支:\n' + m[0].slice(0, 300));

const indent = (m[0].match(/^(\s*)if/) || [])[1] || '          ';
const branch = [
  `${indent}if (slot.dataset.key === 'dash') {`,
  `${indent}  out = dashOnlySvg(inner, PALETTE[st % 4]);`,
  `${indent}} else if (slot.dataset.key === '1') {`,
  `${indent}  out = colorWholeSvg(inner, PALETTE[st % 4]);`,
  `${indent}} else if (slot.dataset.cheng === '1' && k >= 2) {`,
  `${indent}  out = colorWholeSvg(inner, PALETTE[st % 4]) + dashOnSecondRoot(inner, PALETTE[(st + 1) % 4]);`,
  `${indent}} else {`,
  `${indent}  out = recolorSvg(inner, st, k);`,
  `${indent}}`,
].join('\r\n');

t = t.replace(m[0], branch);
fs.writeFileSync(p, t, 'utf8');
console.log('已替换着色分支:', t.includes("dataset.cheng === '1'"));
