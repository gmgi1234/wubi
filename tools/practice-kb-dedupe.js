// 同一个键只按第一次出现的位置着色
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const needle = "    code.split('').forEach(function (L, i) {";
if (!t.includes(needle)) { console.log('未找到循环'); process.exit(1); }
t = t.replace(needle, "    var doneKeys = {};\r\n" + needle);
t = t.replace(needle + "\r\n", needle + "\r\n");
// 在循环体开头插入去重判断
const bodyAnchor = needle + "\r\n      var el = document.querySelector";
if (t.includes(bodyAnchor)) {
  t = t.replace(bodyAnchor, needle + "\r\n      if (doneKeys[L]) return;\r\n      doneKeys[L] = 1;\r\n      var el = document.querySelector");
} else {
  const alt = needle + "\n      var el = document.querySelector";
  if (t.includes(alt)) {
    t = t.replace(alt, needle + "\n      if (doneKeys[L]) return;\n      doneKeys[L] = 1;\n      var el = document.querySelector");
  } else {
    console.log('未找到循环体');
    process.exit(1);
  }
}
fs.writeFileSync(p, t, 'utf8');
console.log('已加入去重:', t.includes('doneKeys[L]'));
