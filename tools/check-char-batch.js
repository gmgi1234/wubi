const fs = require('node:fs');
const path = require('node:path');
const dir = 'D:/Users/10061/Downloads/wubi/char';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html');
console.log('页面数:', files.length);
let withSprite = 0;
let orderNew = 0;
let orderOld = 0;
let sampleOld = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  if (t.includes('frag-sprite')) withSprite += 1;
  const iNew = t.indexOf('新世纪');
  const i86 = t.indexOf('86 版');
  if (iNew >= 0 && i86 >= 0 && iNew < i86) orderNew += 1;
  else { orderOld += 1; if (sampleOld.length < 5) sampleOld.push(f); }
}
console.log('含 sprite:', withSprite, '| 新世纪在前:', orderNew, '| 仍是旧序:', orderOld, sampleOld);
