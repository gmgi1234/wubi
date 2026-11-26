// 去掉「两个字根同名就当键名字」的猜测，只按字本身的拆分判断
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const old = "      var isKeyName = k >= 2 && (keysStr.charAt(i) === '1' || (!!rA && rA === rB));";
const neu = "      var isKeyName = k >= 2 && keysStr.charAt(i) === '1';";
if (!t.includes(old)) { console.log('未找到判断语句'); process.exit(1); }
t = t.replace(old, neu);
fs.writeFileSync(p, t, 'utf8');
console.log('已改为只按 keys 标记判断');
