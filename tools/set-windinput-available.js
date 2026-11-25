// Keep the old wubi06 scheme switchable alongside the union schemes.
const fs = require('node:fs');

const p = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('"wubi06"')) {
  t = t.replace(/available = \[([\s\S]*?)\]/, (m, inner) => {
    const items = inner.split(',').map((s) => s.trim()).filter(Boolean);
    if (!items.includes('"wubi06"')) items.push('"wubi06"');
    return 'available = [\n' + items.map((s) => '    ' + s + ',').join('\n') + '\n]';
  });
}

fs.writeFileSync(p, t, 'utf8');
console.log(t.slice(t.indexOf('[schema]'), t.indexOf('[schema]') + 160));
