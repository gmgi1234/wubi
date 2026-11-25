// Dump 86/98/新世纪 dictionaries to JSON for the code table.
const fs = require('node:fs');
const vm = require('node:vm');

const W = 'D:/Users/10061/Downloads/wubi';

function load(file, name) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { console, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(`${code};globalThis.__d = ${name};`, sandbox);
  return sandbox.globalThis.__d;
}

const v86 = load(`${W}/data/wubi86.js`, 'WUBI_86');
const v98 = load(`${W}/data/wubi98.js`, 'WUBI_98');
const v06 = load(`${W}/data/wubi_xsj.js`, 'WUBI_06');

function pack(dict) {
  const out = {};
  for (const [ch, e] of Object.entries(dict || {})) {
    if (!e || !e.c) continue;
    out[ch] = { c: e.c, r: Array.isArray(e.r) ? e.r : [] };
  }
  return out;
}

const data = { v86: pack(v86), v98: pack(v98), v06: pack(v06) };
fs.writeFileSync(`${W}/tools/tables.json`, JSON.stringify(data), 'utf8');
console.log('86:', Object.keys(data.v86).length, '98:', Object.keys(data.v98).length, '06:', Object.keys(data.v06).length);

