// 练习页字形改成带边框的白底格子（与词组页一致）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

t = t.replace(
  '.zi-svg { width:150px; height:150px; display:block; }',
  '.zislot { border:1px solid var(--line); border-radius:10px; background:#fff; padding:6px; }\n .zi-svg { width:150px; height:150px; display:block; }'
);

t = t.replace(
  '.zislot { display:inline-block; width:150px; height:150px; }',
  '.zislot { display:inline-block; width:150px; height:150px; }'
);

fs.writeFileSync(p, t, 'utf8');
console.log('带框格子:', t.includes('border-radius:10px; background:#fff; padding:6px;'));
