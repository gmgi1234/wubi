// Disable the chart-font substitution: the chart font has no glyphs for fragment
// roots (犭前 etc.) or Ext-B characters, and the alignment was unreliable for them.
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const js = `// 无法直接打出的字根 → 字根字体私用区码位
// 目前为空：字根图字体只收录标准字根，没有部件片段（犭前 等）和扩展 B 区字，
// 自动对齐不可靠，故暂不做替换，保持文字显示。
const ROOT_PUA = {};
`;
fs.writeFileSync(path.join(BASE, 'data/root-pua.js'), js, 'utf8');
console.log('root-pua.js reset to empty map');
