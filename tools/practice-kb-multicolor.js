// 同一个键被多个位置占用时（如「人」占两码 W W），用双色显示
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 样式：双色键
if (!t.includes('.kb-key.multi')) {
  t = t.replace('</style>', ` .kb-key.multi .kb-pill { background: var(--split); }\r\n</style>`);
}

// 2) markKeyboard 改为收集所有位置的颜色
const start = t.indexOf('  function markKeyboard(code) {');
const end = t.indexOf('  function buildKeyboard() {', start);
if (start < 0 || end < 0) { console.log('定位失败'); process.exit(1); }

const fn = `  function markKeyboard(code) {
    var keys = document.querySelectorAll('.kb-key');
    [].forEach.call(keys, function (b) {
      b.classList.remove('hl', 'multi');
      b.style.borderColor = '';
      b.style.color = '';
      b.style.removeProperty('--split');
    });
    if (!code) return;
    var pos = {};
    code.split('').forEach(function (L, i) {
      var k = L.toUpperCase();
      if (!pos[k]) pos[k] = [];
      pos[k].push(PALETTE[i % 4]);
    });
    Object.keys(pos).forEach(function (k) {
      var el = document.querySelector('.kb-key[data-k="' + k + '"]');
      if (!el) return;
      var colors = pos[k];
      el.classList.add('hl');
      el.style.borderColor = colors[0];
      el.style.color = colors[0];
      if (colors.length > 1) {
        // 两种颜色平分键帽背景
        el.classList.add('multi');
        el.style.setProperty('--split', 'linear-gradient(90deg, ' + colors.map(function (c, i) {
          var a = Math.round((i / colors.length) * 100);
          var b = Math.round(((i + 1) / colors.length) * 100);
          return c + ' ' + a + '% ' + b + '%';
        }).join(', ') + ')');
      }
    });
  }

`;

t = t.slice(0, start) + fn + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('双色键盘:', t.includes('--split'), '| 语法块替换完成');
