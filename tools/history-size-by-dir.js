// 统计 .git 里各类路径占用的对象体积
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = os.tmpdir();
const sizes = new Map();
for (const line of fs.readFileSync(path.join(tmp, 'sizes.txt'), 'utf8').split('\n')) {
  const [oid, size] = line.trim().split(' ');
  if (!oid || !size) continue;
  sizes.set(oid, Number(size));
}

const agg = new Map();
let total = 0;
let unmapped = 0;
for (const line of fs.readFileSync(path.join(tmp, 'objs.txt'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t) continue;
  const sp = t.indexOf(' ');
  const oid = sp < 0 ? t : t.slice(0, sp);
  const p = sp < 0 ? '(无路径/树或提交)' : t.slice(sp + 1);
  const size = sizes.get(oid);
  if (!size) continue;
  total += size;
  if (sp < 0) { unmapped += size; continue; }
  const key = p.includes('/') ? p.split('/')[0] + '/' : p;
  agg.set(key, (agg.get(key) || 0) + size);
}

const rows = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
const MB = (b) => (b / 1048576).toFixed(1) + ' MB';
console.log('对象总体积:', MB(total), '| 无路径部分:', MB(unmapped));
console.log('--- 按顶层目录 ---');
for (const [k, v] of rows) console.log(k.padEnd(24), MB(v));
