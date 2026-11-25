const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/ci/一个.html';
if (!fs.existsSync(p)) { console.log('no static page'); process.exit(0); }
const t = fs.readFileSync(p, 'utf8');
const m = t.match(/<div class="broots">([\s\S]*?)<\/div>/);
console.log('roots:', m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : 'n/a');
const c = t.match(/class="bcode"[^>]*>([\s\S]*?)<\/span>/);
console.log('code html present:', !!c);
