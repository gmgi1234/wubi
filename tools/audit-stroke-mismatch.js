// 审计：对比 svg 笔画数与 data/chars 里的笔画数
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const charsDir = path.join(ROOT, 'data', 'chars');
const svgDir = path.join(ROOT, 'svg');

const files = fs.readdirSync(charsDir).filter((f) => f.endsWith('.json'));
console.log('单字数据文件:', files.length);

let checked = 0;
let mismatch = 0;
const bad = [];

for (const f of files) {
  const ch = f.replace(/\.json$/, '');
  let strokes = 0;
  try {
    const j = JSON.parse(fs.readFileSync(path.join(charsDir, f), 'utf8'));
    strokes = (j.strokes || []).length;
  } catch (e) { continue; }
  if (!strokes) continue;

  for (const ver of ['86','98','06']) {
    const p = path.join(svgDir, `${ch}-${ver}.svg`);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, 'utf8');
    const paths = (t.match(/<path/g) || []).length;
    const dash = /stroke="#c0392b"/.test(t) ? 1 : 0;
    const draw = paths - dash;
    checked += 1;
    if (draw !== strokes) {
      mismatch += 1;
      if (bad.length < 200) bad.push({ ch, svg: draw, data: strokes, diff: draw - strokes });
    }
  }
}

console.log('检查:', checked, '| 不一致:', mismatch);
const under = bad.filter((b) => b.diff < 0);
const over = bad.filter((b) => b.diff > 0);
console.log('少笔画:', under.length, '| 多笔画:', over.length);
console.log('少笔画样例:', under.slice(0, 30).map((b) => `${b.ch}(${b.svg}/${b.data})`).join(' '));
console.log('多笔画样例:', over.slice(0, 15).map((b) => `${b.ch}(${b.svg}/${b.data})`).join(' '));
fs.writeFileSync(path.join(ROOT, 'tools', 'stroke-mismatch.json'), JSON.stringify(bad, null, 1), 'utf8');
console.log('明细已写到 tools/stroke-mismatch.json');
