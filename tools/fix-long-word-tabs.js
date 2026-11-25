// 修复「六字及以上」加载失败：补齐 2..12 字全部文件，并让加载失败按空处理
const fs = require('node:fs');

// 1) 导出脚本：2..12 全部写出（没有词就写空数组）
const ep = 'D:/Users/10061/Downloads/wubi/tools/export-dynamic-data.js';
let e = fs.readFileSync(ep, 'utf8');
if (!e.includes('LEN_ALL')) {
  e = e.replace(
    "for (const [n, arr] of [...byLen.entries()].sort((a, b) => a[0] - b[0])) {",
    "const LEN_ALL = Array.from({ length: 11 }, (_, i) => i + 2);\nfor (const n of LEN_ALL) {\n  const arr = byLen.get(n) || [];"
  );
  fs.writeFileSync(ep, e, 'utf8');
  console.log('export patched');
}

// 2) 目录页：加载失败当成空数组，继续
const ip = 'D:/Users/10061/Downloads/wubi/tools/build-ci-index.js';
let s = fs.readFileSync(ip, 'utf8');
if (!s.includes("res.busy=false; onload(res)")) {
  s = s.replace(
    "s.onerror=function(){ hint.textContent='词库加载失败，请刷新重试'; };",
    "s.onerror=function(){ res.busy=false; res.data=function(){ return [] }; onload(res); };"
  );
  fs.writeFileSync(ip, s, 'utf8');
  console.log('index page patched');
}
