// 生成键盘字根的矢量图库：把键盘用到的字根字符，从单字 SVG 里借笔画
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const code = fs.readFileSync(path.join(ROOT, 'data', 'wubi_roots_all.js'), 'utf8');
const sandbox = {};
const ctx = vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__T86=WUBI_ROOT_TABLE_86;globalThis.__T98=WUBI_ROOT_TABLE_98;globalThis.__T06=WUBI_ROOT_TABLE_06;', ctx);

const tables = [sandbox.__T86, sandbox.__T98, sandbox.__T06];
const tokens = new Set();
for (const t of tables) {
  if (!t) continue;
  for (const k of Object.keys(t)) {
    for (const ch of [...String(t[k])]) {
      if (ch.trim()) tokens.add(ch);
    }
  }
}
console.log('键盘字根 token:', tokens.size);

const lib = {};
let ok = 0;
for (const tok of tokens) {
  let found = null;
  for (const ver of ['06', '86', '98']) {
    const f = path.join(ROOT, 'svg', `${tok}-${ver}.svg`);
    if (fs.existsSync(f)) { found = f; break; }
  }
  if (!found) continue;
  let t = fs.readFileSync(found, 'utf8');
  t = t.replace(/<path[^>]*stroke="#c0392b"[^>]*\/>/g, '')
    .replace(/<rect[^>]*>/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/fill="#[0-9A-Fa-f]{3,6}"/g, 'fill="currentColor"');
  lib[tok] = t.trim();
  ok += 1;
}
const out = path.join(ROOT, 'data', 'kb-root-glyphs.js');
fs.writeFileSync(out, 'window.KB_ROOT_GLYPHS=' + JSON.stringify(lib) + ';', 'utf8');
console.log('生成字根字形:', ok, '|', Math.round(fs.statSync(out).size / 1024), 'KB');
