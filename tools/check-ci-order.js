const fs = require('node:fs');
for (const f of ['ci/中国.html', 'ci/一个.html']) {
  const t = fs.readFileSync(`D:/Users/10061/Downloads/wubi/${f}`, 'utf8');
  const order = [...t.matchAll(/class="vtag">([^<]+)</g)].map((m) => m[1]);
  console.log(f, '→', order.join(' | '));
}
