// 修正版本号映射：按钮值是 6/8/9，代码里比较的是 86/98，导致切换无效
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 统一版本取值函数
if (!t.includes('function verOf(')) {
  t = t.replace('  function codeOf(w) {', `  function verOf() {
    return state.ver === '8' ? '86' : state.ver === '9' ? '98' : '06';
  }

  function codeOf(w) {`);
}

// 2) codeOf / rootsOf 用 verOf()
t = t.replace(
  "function codeOf(w) { return state.ver === '86' ? w.c86 : state.ver === '98' ? w.c98 : w.c6; }",
  "function codeOf(w) { var v = verOf(); return v === '86' ? w.c86 : v === '98' ? w.c98 : w.c6; }"
);
t = t.replace(
  "function rootsOf(w) { return (state.ver === '86' ? w.r86 : state.ver === '98' ? w.r98 : w.r6).split(' ').filter(Boolean); }",
  "function rootsOf(w) { var v = verOf(); return (v === '86' ? w.r86 : v === '98' ? w.r98 : w.r6).split(' ').filter(Boolean); }"
);

// 3) 键盘数据与标题
t = t.replace(
  "    if (state.ver === '86') return [WUBI_ROOT_TABLE_86, KEY_NAMES];\n    if (state.ver === '98') return [WUBI_ROOT_TABLE_98, KEY_NAMES_98];",
  "    var v = verOf();\n    if (v === '86') return [WUBI_ROOT_TABLE_86, (typeof KEY_NAMES !== 'undefined' ? KEY_NAMES : {})];\n    if (v === '98') return [WUBI_ROOT_TABLE_98, (typeof KEY_NAMES_98 !== 'undefined' ? KEY_NAMES_98 : {})];"
);
t = t.replace(
  "var verName = state.ver === '86' ? '86 版' : state.ver === '98' ? '98 版' : '新世纪';",
  "var verName = verOf() === '86' ? '86 版' : verOf() === '98' ? '98 版' : '新世纪';"
);

// 4) 字形文件名映射
t = t.replace(
  "var VER_FILE = { '86': '86', '98': '98', '6': '06' };",
  "var VER_FILE = { '86': '86', '98': '98', '06': '06', '6': '06', '8': '86', '9': '98' };"
);

fs.writeFileSync(p, t, 'utf8');
console.log('verOf:', t.includes('function verOf('), '| codeOf 用 verOf:', t.includes('var v = verOf(); return'));
