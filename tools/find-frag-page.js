const fs = require('node:fs');
const d = 'D:/Users/10061/Downloads/wubi/ci';
for (const f of fs.readdirSync(d)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const t = fs.readFileSync(`${d}/${f}`, 'utf8');
  if (t.includes('<svg class="frag"')) {
    console.log('sample:', f);
    break;
  }
}
