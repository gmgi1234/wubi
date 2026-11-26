// 更新回归检查的期望：键名字现在是一格（整字上色 + 整字虚线）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/check-practice-regression.js';
let t = fs.readFileSync(p, 'utf8');

const old = `    if (k >= 2 && isKeyNameChar(c)) {
      slots.push({ c, k, kind: 'key' });
      slots.push({ c, k: 0, kind: 'keydash' });
    }`;
const neu = `    if (k >= 2 && isKeyNameChar(c)) {
      slots.push({ c, k, kind: 'key' });
    }`;
if (!t.includes(old)) { console.log('未找到期望块'); process.exit(1); }
t = t.replace(old, neu);

// 校验规则：key 要有填充 + 虚线
const oldCheck = "      if (e.kind === 'keydash' && d.dashes === 0) problems.push(`第${i + 1}格应整字虚线`);";
const newCheck = "      if (e.kind === 'key' && d.dashes === 0) problems.push(`第${i + 1}格（键名字）缺整字虚线`);\n      if (e.kind === 'key' && d.fills.length === 0) problems.push(`第${i + 1}格（键名字）没上色`);";
t = t.replace(oldCheck, newCheck);

// 旧的 keydash 断言删掉
t = t.replace(/      if \(e\.kind === 'keydash' && d\.fills\.length > 0 && d\.dashes === 0\) problems\.push\([^\n]*\n/, '');

fs.writeFileSync(p, t, 'utf8');
console.log('期望已更新:', t.includes("kind: 'key'"), '| keydash 残留:', t.includes("keydash"));
