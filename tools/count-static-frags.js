// 统计静态词组页里复合字根的处理情况
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi/ci';

let withFrag = 0;
let withFragText = 0;
const samples = [];
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const hasIcon = t.includes('<svg class="frag"');
  const hasText = /(犭前|革后|皮前|鱼头|虍头|具头)/.test(t);
  if (hasIcon) withFrag += 1;
  if (hasText) { withFragText += 1; if (samples.length < 5) samples.push(f); }
}
console.log('pages with fragment icons:', withFrag);
console.log('pages still showing fragment text:', withFragText, samples);
