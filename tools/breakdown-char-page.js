// 单字页里哪些部分最占体积
const fs = require('node:fs');
const path = require('node:path');

const f = 'D:/Users/10061/Downloads/wubi/char/狗.html';
const t = fs.readFileSync(f, 'utf8');
console.log('总大小:', Math.round(Buffer.byteLength(t) / 1024), 'KB');
console.log('用 sprite:', t.includes('frag-sprite'), '| 内联 frag path 数:', (t.match(/<svg class="frag"[\s\S]*?<path/g) || []).length);

const classes = ['frag', 'glyph', 'kroot', 'chip'];
for (const c of classes) {
  const re = new RegExp(`<[a-z]+ class="${c}"[\\s\\S]*?<\\/[a-z]+>`, 'g');
  const m = t.match(re) || [];
  const bytes = m.reduce((s, x) => s + Buffer.byteLength(x), 0);
  console.log(`${c}: ${m.length} 处, ${Math.round(bytes / 1024)} KB`);
}

// 按标签粗略统计
for (const tag of ['svg', 'style', 'script']) {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'g');
  const m = t.match(re) || [];
  const bytes = m.reduce((s, x) => s + Buffer.byteLength(x), 0);
  console.log(`${tag}: ${m.length} 处, ${Math.round(bytes / 1024)} KB`);
}
