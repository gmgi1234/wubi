const fs = require('node:fs');
for (const w of ['王八', '一个', '北京人']) {
  const p = `D:/Users/10061/Downloads/wubi/ci/${w}.html`;
  if (!fs.existsSync(p)) { console.log(w, '缺页'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  const rowStart = t.indexOf('<div class="brow">');
  const row = t.slice(rowStart, rowStart + 2500);
  const glyphs = (row.match(/svg class="glyph"/g) || []).length;
  console.log(w, '| 第一行字形格数:', glyphs);
}
