// 主区域加宽到接近整屏（去掉 820px 上限）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const oldMain = 'main { flex:1; min-width:0; max-width:820px; margin:20px auto; background:var(--paper); box-shadow:0 0 0 1px var(--line); border-radius:16px; padding:22px 24px 34px; }';
const newMain = 'main { flex:1; min-width:0; max-width:1500px; margin:16px auto; background:var(--paper); box-shadow:0 0 0 1px var(--line); border-radius:16px; padding:24px 28px 36px; }';
if (!t.includes(oldMain)) { console.log('未找到 main 规则'); process.exit(1); }
t = t.replace(oldMain, newMain);

// 字形格子也跟着放大一点
t = t.replace('.zislot { display:inline-block; width:150px; height:150px; }', '.zislot { display:inline-block; width:168px; height:168px; }');
t = t.replace('.zi-svg { width:150px; height:150px; display:block; }', '.zi-svg { width:168px; height:168px; display:block; }');

fs.writeFileSync(p, t, 'utf8');
console.log('主区域已加宽:', t.includes('max-width:1500px'));
