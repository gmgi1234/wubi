// 在动态页面里加载复合字根字形库
const fs = require('node:fs');
const tag = '<script src="data/root-glyphs.js"></script>';
for (const f of ['D:/Users/10061/Downloads/wubi/char.html', 'D:/Users/10061/Downloads/wubi/ci.html']) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('root-glyphs.js')) {
    t = t.replace('<script src="data/render.js"></script>', '<script src="data/render.js"></script>\n' + tag);
    fs.writeFileSync(f, t, 'utf8');
  }
  console.log(f.split('/').pop(), fs.readFileSync(f, 'utf8').includes('root-glyphs.js'));
}
