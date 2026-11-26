const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/check-practice-regression.js';
let t = fs.readFileSync(p, 'utf8');
const before = t;
t = t.split("'path[stroke-dasharray]'").join("'path[stroke-dasharray], rect[stroke-dasharray]'");
if (t !== before) {
  fs.writeFileSync(p, t, 'utf8');
  console.log('已兼容 rect');
} else {
  console.log('未变化，检查当前选择器：', (t.match(/stroke-dasharray[^']*/g) || []).slice(0, 3));
}
