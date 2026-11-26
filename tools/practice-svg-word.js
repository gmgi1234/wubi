// 练习页：去掉字根行，词组用彩色 SVG 字形显示
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 提示选项：去掉「只显示字根」，改成 编码 / 不看提示
t = t.replace(
  /<button class="chip on" data-hint="2">字根 \+ 编码<\/button>\s*<button class="chip" data-hint="1">只显示字根<\/button>\s*<button class="chip" data-hint="0">不看提示<\/button>/,
  '<button class="chip on" data-hint="2">显示编码</button>\n      <button class="chip" data-hint="0">不看提示</button>'
);

// 2) 说明文字
t = t.replace('照着词组直接打字，输入正确自动跳下一题', '照着彩色字形直接打字，输入正确自动跳下一题');

// 3) redraw：字形用 SVG，去掉字根
t = t.replace(
  /  function redraw\(\) \{[\s\S]*?\n  \}\n\n  function nextQuestion/,
  `  var VER_FILE = { '86': '86', '98': '98', '6': '06' };

  function redraw() {
    if (!state.pool.length) return;
    var w = state.pool[state.idx];
    if (!w) return;
    var chars = [...w.w];
    var ver = VER_FILE[state.ver] || '06';

    var html = '';
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      html += '<img class="zi-svg" alt="' + c + '" src="svg/' + encodeURIComponent(c) + '-' + ver + '.svg">';
    }
    $('wordbox').innerHTML = html;

    if (state.hint === 2) {
      $('codline').innerHTML = codeOf(w).split('').map(function (L, i) {
        return '<span style="color:' + PALETTE[i % 4] + '">' + L.toUpperCase() + '</span>';
      }).join('');
    } else {
      $('codline').innerHTML = '';
    }
  }

  function nextQuestion`
);

// 4) 样式：SVG 字形尺寸
t = t.replace('.charcell .zi { font-size:72px; line-height:1.1; }', '.zi-svg { width:150px; height:150px; display:block; }');
t = t.replace('  .charcell .zi { font-size:54px; }', '  .zi-svg { width:110px; height:110px; }');
t = t.replace('.wordbox { display:flex; justify-content:center; gap:28px; margin:24px 0 6px; flex-wrap:wrap; }',
  '.wordbox { display:flex; justify-content:center; gap:18px; margin:18px 0 6px; flex-wrap:wrap; align-items:center; }');

fs.writeFileSync(p, t, 'utf8');
console.log('去掉字根:', !t.includes('class="roots"'), '| SVG 字形:', t.includes('zi-svg'), '| 提示项:', (t.match(/data-hint/g) || []).length);
