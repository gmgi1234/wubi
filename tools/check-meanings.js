const fs = require('node:fs');
for (const w of ['中国', '良莠不齐', '北京']) {
  const p = `D:/Users/10061/Downloads/wubi/ci/${w}.html`;
  if (!fs.existsSync(p)) { console.log(w, '缺页'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  const i = t.indexOf('<h2>释义</h2>');
  const text = i >= 0 ? t.slice(i, i + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '无释义';
  console.log(w, '→', text.slice(0, 90));
}
