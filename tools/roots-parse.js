// Parse data/wubi_roots_all.js (const declarations) and dump each structure.
const fs = require('node:fs');
const vm = require('node:vm');

const file = 'D:/Users/10061/Downloads/wubi/data/wubi_roots_all.js';
const code = fs.readFileSync(file, 'utf8');
const names = [...code.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=/gm)].map((m) => m[1]);
console.log('consts:', names.join(', '));

const dumpExpr = `;globalThis.__dump = {${names.map((n) => `${n}: ${n}`).join(', ')}};`;
const sandbox = { console, globalThis: {} };
vm.createContext(sandbox);
vm.runInContext(code + dumpExpr, sandbox);
const dump = sandbox.globalThis.__dump || sandbox.__dump;

for (const [name, value] of Object.entries(dump)) {
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    console.log(`\n${name} (${keys.length}): ${keys.slice(0, 10).join(',')}`);
    console.log('  sample:', JSON.stringify(value[keys[0]]).slice(0, 220));
  } else {
    console.log(`\n${name}: ${typeof value}`);
  }
}
