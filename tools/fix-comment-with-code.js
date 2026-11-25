// 让候选注释同时显示编码与拆分：编码放前面，词组拆分去掉重复的 06:CODE
const fs = require('node:fs');

// 1) 模板
const cfg = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let c = fs.readFileSync(cfg, 'utf8');
const oldText = 'text = "${chaizi}{ · ${dict:ci_chaifen}}"';
const newText = 'text = "${code_rev} · ${chaizi}{ · ${dict:ci_chaifen}}"';
if (c.includes(oldText)) {
  c = c.replace(oldText, newText);
  fs.writeFileSync(cfg, c, 'utf8');
  console.log('模板已更新:', newText);
} else {
  console.log('模板已是新版或未找到');
}

// 2) 词组词典去掉尾部 · 06:CODE（编码由模板统一显示）
const dict = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/schemas/comments/ci_chaifen.txt';
let d = fs.readFileSync(dict, 'utf8');
const before = d.split('\n').length;
d = d.replace(/\t([^\t\n]+) · 06:[A-Z]+\s*$/gm, '\t$1');
fs.writeFileSync(dict, d, 'utf8');
console.log('词典行数:', before, '| 示例:', d.split('\n').slice(0, 2).map((l) => l.replace(/\uE000-\uF8FF/g, '□')).join(' | '));
