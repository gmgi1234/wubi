// Build data/root-pua.js: display name -> PUA char, only for roots that cannot be typed.
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const map = JSON.parse(fs.readFileSync(path.join(BASE, 'tools/root-pua-map.json'), 'utf8'));

function needsGlyph(name) {
  const chars = [...name];
  if (chars.length !== 1) return true;            // 复合描述，如 犭前
  return chars[0].codePointAt(0) > 0xffff;        // 扩展 B 区生僻字
}

const byName = new Map();
for (const [pua, v] of Object.entries(map)) {
  if (!v.confident) continue;
  if (!needsGlyph(v.name)) continue;
  const prev = byName.get(v.name);
  if (!prev || v.votes > prev.votes) byName.set(v.name, { pua, votes: v.votes, total: v.total });
}

const entries = [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const lines = entries.map(([name, v]) => `  ${JSON.stringify(name)}: ${JSON.stringify(v.pua)}`);
const js = `// 无法直接打出的字根 → 字根字体私用区码位（自动对齐：字根名 ↔ 码位）\n// 生成脚本 tools/build-root-pua-js.js\nconst ROOT_PUA = {\n${lines.join(',\n')}\n};\n`;

fs.writeFileSync(path.join(BASE, 'data/root-pua.js'), js, 'utf8');
console.log('written data/root-pua.js with', entries.length, 'roots');
for (const [name, v] of entries.slice(0, 12)) console.log('  ', name, '->', v.pua);

// copy the font
const fontSrc = path.join(BASE, 'qingfeng/WindInput/schemas/xin_shiji_zigen.ttf');
const fontDir = path.join(BASE, 'fonts');
fs.mkdirSync(fontDir, { recursive: true });
fs.copyFileSync(fontSrc, path.join(fontDir, 'zigen.ttf'));
console.log('copied font -> fonts/zigen.ttf', fs.statSync(path.join(fontDir, 'zigen.ttf')).size, 'bytes');
