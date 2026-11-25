const fs = require('node:fs');
for (const f of ['D:/Users/10061/Downloads/wubi/char.html', 'D:/Users/10061/Downloads/wubi/ci.html']) {
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace('<script src="data/root-glyphs.js"></script>', '<script src="data/frag-map.js"></script>');
  fs.writeFileSync(f, t, 'utf8');
  console.log(f.split('/').pop(), t.includes('frag-map.js'));
}
