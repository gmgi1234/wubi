// 复合字根方向修正：片段字形需要外层 y 轴翻转
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const oldSvg = "return '<svg class=\"rg\" viewBox=\"0 0 1024 1024\" aria-hidden=\"true\"><g transform=\"translate(' + cx + ',' + cy + ') scale(' + sc + ') translate(' + (-cx) + ',' + (-cy) + ')\">' + ps + '</g></svg>';";
const newSvg = "return '<svg class=\"rg\" viewBox=\"0 0 1024 1024\" aria-hidden=\"true\"><g transform=\"translate(0,900) scale(1,-1)\"><g transform=\"translate(' + cx + ',' + cy + ') scale(' + sc + ') translate(' + (-cx) + ',' + (-cy) + ')\">' + ps + '</g></g></svg>';";

if (!t.includes(oldSvg)) { console.log('未找到片段渲染行'); process.exit(1); }
t = t.replace(oldSvg, newSvg);
fs.writeFileSync(p, t, 'utf8');
console.log('已加 y 轴翻转:', t.includes('translate(0,900) scale(1,-1)\"><g transform=\"translate('));
