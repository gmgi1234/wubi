// Rebuild tools/tables.json from the three data JS files.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = 'D:/Users/10061/Downloads/wubi';
function load(rel, varName) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sandbox = { console, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(`${code}\nglobalThis.__d = ${varName};`, sandbox);
  return sandbox.globalThis.__d;
}
const v86 = load('data/wubi86.js', 'WUBI_86');
const v98 = load('data/wubi98.js', 'WUBI_98');
const v06 = load('data/wubi_xsj.js', 'WUBI_06');
fs.writeFileSync(path.join(ROOT, 'tools', 'tables.json'), JSON.stringify({ v86, v98, v06 }), 'utf8');
console.log('tables rebuilt:', Object.keys(v86).length, Object.keys(v98).length, Object.keys(v06).length);
