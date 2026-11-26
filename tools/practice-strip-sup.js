// 去掉字库里自带的补码虚线（练习页不需要）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');
if (t.includes('#c0392b')) { console.log('已有处理'); process.exit(0); }

const oldLine = "          var inner = svg.replace(/<rect[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>/, '');";
const newLine = "          var inner = svg.replace(/<path[^>]*stroke=\"#c0392b\"[^>]*\\/>/g, '').replace(/<rect[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>/, '');";
if (!t.includes(oldLine)) { console.log('未找到目标行'); process.exit(1); }
t = t.replace(oldLine, newLine);
fs.writeFileSync(p, t, 'utf8');
console.log('已去掉补码虚线');
