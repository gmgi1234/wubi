// 练习页：键盘字根用字根字体渲染（PUA 字符不再显示成乱码）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('@font-face')) {
  t = t.replace('</style>', ` @font-face {\r\n   font-family: 'ZiGen';\r\n   src: url('fonts/zigen.ttf') format('truetype');\r\n }\r\n .kb-roots, .kb-roots * { font-family: 'ZiGen', 'KaiTi', '楷体', serif; }\r\n .kb-roots .rg { width: 18px; height: 18px; vertical-align: -4px; }\r\n</style>`);
}

fs.writeFileSync(p, t, 'utf8');
console.log('字体已加入:', t.includes("url('fonts/zigen.ttf')"));
