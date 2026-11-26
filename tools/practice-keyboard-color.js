// 键盘按键按编码位置着色（与上方字根颜色对应）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 样式
if (!t.includes('.kb-key.hl')) {
  t = t.replace('</style>', ` .kb-key.hl { border-color: currentColor; box-shadow: 0 0 0 1px currentColor inset; }\r\n .kb-key.hl .kl, .kb-key.hl .kj { font-weight: 700; }\r\n</style>`);
}

// 2) 着色函数
if (!t.includes('function markKeyboard')) {
  t = t.replace('  function buildKeyboard() {', `  function markKeyboard(code) {
    var keys = document.querySelectorAll('.kb-key');
    [].forEach.call(keys, function (b) { b.classList.remove('hl'); b.style.borderColor = ''; b.style.color = ''; });
    if (!code) return;
    code.split('').forEach(function (L, i) {
      var el = document.querySelector('.kb-key[data-k="' + L.toUpperCase() + '"]');
      if (!el) return;
      var c = PALETTE[i % 4];
      el.classList.add('hl');
      el.style.borderColor = c;
      el.style.color = c;
    });
  }

  function buildKeyboard() {`);
}

// 3) redraw 里调用
const anchor = "    $('codline').innerHTML = codeOf(w).split('').map(function (L, i) {";
if (!t.includes('markKeyboard(codeOf(w))')) {
  t = t.replace(anchor, "    markKeyboard(state.hint === 2 ? codeOf(w) : '');\r\n" + anchor);
}

fs.writeFileSync(p, t, 'utf8');
console.log('键盘着色:', t.includes('function markKeyboard'), '| 调用:', t.includes('markKeyboard(state.hint'));
