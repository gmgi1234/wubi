// 在编译后的词典缓存里查词，确认是否真的被加载
const fs = require('node:fs');
const path = require('node:path');

const dir = 'C:/Users/10061/AppData/Local/WindInput/cache';
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.size > 1024 * 1024 || /\.wdat$|\.wcmt$/.test(e.name)) files.push(p);
  }
};
walk(dir);

const targets = process.argv.slice(2);
for (const t of targets) {
  const needle = Buffer.from(t, 'utf8');
  const hits = [];
  for (const f of files) {
    const buf = fs.readFileSync(f);
    if (buf.includes(needle)) hits.push(path.basename(f));
  }
  console.log(t, '→', hits.length ? hits.join(', ') : '缓存里没有');
}
