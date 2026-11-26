// 统计键盘字根 token 数量，以及有多少能取到单字 SVG
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

// 从 data/wubi_roots_all.js 取出三版字根表
const code = fs.readFileSync(path.join(ROOT, 'data', 'wubi_roots_all.js'), 'utf8');
const sandbox = {};
const vm = require('node:vm');
const ctx = vm.createContext(sandbox);
vm.runInContext(code, ctx);

const tables = ['WUBI_ROOT_TABLE_86', 'WUBI_ROOT_TABLE_98', 'WUBI_ROOT_TABLE_06'];
const tokens = new Set();
for (const name of tables) {
  const t = sandbox[name];
  if (!t) { console.log('缺少', name); continue; }
  for (const k of Object.keys(t)) {
    for (const ch of [...String(t[k])]) {
      if (!/[\s]/.test(ch)) tokens.add(ch);
    }
  }
}
console.log('字根 token 数:', tokens.size);

let withSvg = 0;
const missing = [];
for (const tok of tokens) {
  if (fs.existsSync(path.join(ROOT, 'svg', `${tok}-06.svg`))) withSvg += 1;
  else missing.push(tok);
}
console.log('有 06 字形的:', withSvg, '| 缺:', missing.length);
console.log('缺的样例:', missing.slice(0, 40).join(' '));
