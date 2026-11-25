// 检查仓库现状：体积、文件数、历史里的老目录
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const run = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });

function dirSize(dir) {
  let s = 0;
  let n = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.name === '.git') continue;
      if (e.isDirectory()) walk(p);
      else { s += fs.statSync(p).size; n += 1; }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return { mb: +(s / 1048576).toFixed(1), n };
}

console.log('.git 体积:', (() => { let s = 0; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else s += fs.statSync(p).size; } }; walk(path.join(ROOT, '.git')); return (s / 1048576).toFixed(1); })(), 'MB');
console.log('提交数:', run('git rev-list --count HEAD').trim());

for (const d of ['tools', 'data', 'data/chars', 'char', 'ci', 'svg', 'dist', 'fonts']) {
  const r = dirSize(path.join(ROOT, d));
  console.log(`${d.padEnd(11)} ${String(r.mb).padStart(7)} MB  ${String(r.n).padStart(6)} 个文件`);
}

console.log('\n历史中是否还有 site/：');
try {
  const out = run('git log --all --oneline -- site | head -5');
  console.log(out.trim() || '无');
} catch (e) { console.log('无'); }

console.log('\n当前是否还有 site/ 目录:', fs.existsSync(path.join(ROOT, 'site')) ? '有' : '没有');

console.log('\ntools/ 里最大的文件：');
const files = [];
const walkT = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkT(p);
    else files.push([path.relative(ROOT, p), fs.statSync(p).size]);
  }
};
walkT(path.join(ROOT, 'tools'));
files.sort((a, b) => b[1] - a[1]);
for (const [f, s] of files.slice(0, 8)) console.log(' ', f, (s / 1048576).toFixed(1), 'MB');
