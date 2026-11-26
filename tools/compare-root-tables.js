// 检查三版字根表是否真的不同
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/wubi_roots_all.js', 'utf8');
const ctx = vm.createContext({});
vm.runInContext(code + '\n;globalThis.t86=WUBI_ROOT_TABLE_86;globalThis.t98=WUBI_ROOT_TABLE_98;globalThis.t06=WUBI_ROOT_TABLE_06;', ctx);
const a = ctx.t86, b = ctx.t98, c = ctx.t06;
let same86_06 = 0, diff = 0;
for (const k of Object.keys(a)) {
  if ((a[k] || '') === (c[k] || '')) same86_06 += 1; else diff += 1;
}
console.log('86 与 06 相同键数:', same86_06, '| 不同:', diff);
console.log('样例 Q → 86:', JSON.stringify(a['Q']), '| 06:', JSON.stringify(c['Q']));
console.log('样例 W → 86:', JSON.stringify(a['W']), '| 06:', JSON.stringify(c['W']));
