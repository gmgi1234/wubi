// 修正键盘数据切换：kbData 也走 verOf()
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

const start = t.indexOf('function kbData() {');
const end = t.indexOf('  function rootHtml(', start);
if (start < 0 || end < 0) { console.log('定位失败'); process.exit(1); }

const body = `function kbData() {
    if (typeof WUBI_ROOT_TABLE_06 === 'undefined') return [{}, {}];
    var v = verOf();
    if (v === '86') return [WUBI_ROOT_TABLE_86, (typeof KEY_NAMES !== 'undefined' ? KEY_NAMES : {})];
    if (v === '98') return [WUBI_ROOT_TABLE_98, (typeof KEY_NAMES_98 !== 'undefined' ? KEY_NAMES_98 : {})];
    return [WUBI_ROOT_TABLE_06, (typeof KEY_NAMES_06 !== 'undefined' ? KEY_NAMES_06 : {})];
  }
  `;

t = t.slice(0, start) + body + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('kbData 已改为 verOf:', t.includes("var v = verOf();\r\n    if (v === '86')"));
