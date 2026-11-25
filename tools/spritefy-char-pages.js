// 把已生成的静态单字页里的内联复合字根，就地换成 sprite 引用
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));

// 建立 path 集合 → 字根名 的索引
const byPaths = new Map();
for (const [name, g] of Object.entries(lib)) {
  byPaths.set(g.paths.join('|'), name);
}

const DIR = path.join(ROOT, 'char');
let pages = 0;
let replaced = 0;
let before = 0;
let after = 0;

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(DIR, f);
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('frag-sprite')) continue;
  before += Buffer.byteLength(t);

  t = t.replace(/<svg class="frag"[\s\S]*?<\/svg>/g, (whole) => {
    const ds = [...whole.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
    if (!ds.length) return whole;
    const name = byPaths.get(ds.join('|'));
    const i = fragMap[name];
    if (i === undefined) return whole;
    // 取原来的颜色和尺寸
    const colorMatch = whole.match(/color:#?[0-9A-Fa-f]{3,6}|fill="#[0-9A-Fa-f]{3,6}"/);
    const color = colorMatch ? colorMatch[0].replace('fill=', '').replace('color:', '') : '#2a2320';
    const sizeMatch = whole.match(/width="(\d+)"/);
    const size = sizeMatch ? sizeMatch[1] : '20';
    replaced += 1;
    return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}" style="color:${color};vertical-align:-4px"><use href="../data/frag-sprite.svg#frag-${i}"/></svg>`;
  });

  after += Buffer.byteLength(t);
  fs.writeFileSync(p, t, 'utf8');
  pages += 1;
}

console.log('处理页面:', pages);
console.log('替换内联小图:', replaced, '个');
console.log('体积:', (before / 1048576).toFixed(1), 'MB →', (after / 1048576).toFixed(1), 'MB');
