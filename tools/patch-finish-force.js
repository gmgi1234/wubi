const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/tools/finish-char-pages.js';
let t = fs.readFileSync(p, 'utf8');
const needle = ".filter((f) => !fs.readFileSync(path.join(CHAR_DIR, f), 'utf8').includes('涉及的键位'));";
if (!t.includes(needle)) { console.log('未找到过滤条件'); process.exit(1); }
t = t.replace(needle, ".filter((f) => process.env.FORCE === '1' || !fs.readFileSync(path.join(CHAR_DIR, f), 'utf8').includes('涉及的键位'));");
fs.writeFileSync(p, t, 'utf8');
console.log('已加 FORCE 开关');
