// From the per-character coloured SVGs, produce "role" variants where roots that do not
// take part in a word code are greyed out:
//   <char>-<ver>-1.svg  first root coloured, the rest grey   (四字词、五字及以上)
//   <char>-<ver>-2.svg  first two roots coloured, rest grey  (双字词、三字词末字)
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const DIR = path.join(ROOT, 'site', 'svg');
const PORT0 = ['#E74C3C', '#FF9800']; // 编码前两位的颜色
const GREY = '#cfc8bd';

const files = fs.readdirSync(DIR).filter((f) => /^.+-[0-9]{2}\.svg$/.test(f));
let made = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  const base = f.replace(/\.svg$/, '');
  for (const keep of [1, 2]) {
    const out = src.replace(/<path d="([^"]*)" fill="([^"]+)"\/>/g, (m, d, fill) => {
      const keepColor = PORT0.slice(0, keep).includes(fill.toUpperCase());
      return `<path d="${d}" fill="${keepColor ? fill : GREY}"/>`;
    });
    fs.writeFileSync(path.join(DIR, `${base}-${keep}.svg`), out, 'utf8');
    made += 1;
  }
}
console.log('role svgs written:', made);
