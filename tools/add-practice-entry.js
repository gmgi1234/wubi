// 首页加入「词组练习」入口
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/index.html';
let t = fs.readFileSync(p, 'utf8');
if (t.includes('practice.html')) { console.log('已有入口'); process.exit(0); }

const anchor = '<a href="ci/" style="background:#a33c2f;color:#fff;padding:6px 11px;border-radius:8px;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,.15)">全部词组</a>';
const btn = '<a href="practice.html" style="background:#2f6f8f;color:#fff;padding:6px 11px;border-radius:8px;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,.15)">词组练习</a>';
if (!t.includes(anchor)) { console.log('未找到锚点'); process.exit(1); }
t = t.replace(anchor, anchor + '\n    ' + btn);
fs.writeFileSync(p, t, 'utf8');
console.log('已加入口:', t.includes('practice.html'));
