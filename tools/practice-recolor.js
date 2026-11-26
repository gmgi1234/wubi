// 练习页：字形按词组编码位置重新着色（对齐词组页的着色规则）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 插入着色工具函数
if (!t.includes('function recolorSvg')) {
  t = t.replace(
    '  var VER_FILE = { \'86\': \'86\', \'98\': \'98\', \'6\': \'06\' };',
    `  var VER_FILE = { '86': '86', '98': '98', '6': '06' };
  var GRAY = '#cfc8bd';

  function recolorSvg(svg, start, k) {
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      var i = PALETTE.map(function (x) { return x.toUpperCase(); }).indexOf(u);
      if (i >= 0 && i < k) return 'fill="' + PALETTE[(start + i) % 4] + '"';
      return 'fill="' + GRAY + '"';
    });
  }
  function colorWholeSvg(svg, color) {
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      return 'fill="' + color + '"';
    });
  }
  function dashOnlySvg(svg, color) {
    return svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, function (m, pre, fill, post) {
      var f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      var d = (pre + post).match(/d="([^"]*)"/);
      if (!d) return '';
      return '<path d="' + d[1] + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>';
    });
  }`
  );
}

// 2) 替换 redraw 内的逐字渲染
const oldBlock = `    var html = '';
    for (var i = 0; i < chars.length; i++) {
      html += '<span class="zislot" data-c="' + chars[i] + '" data-v="' + ver + '"></span>';
    }
    $('wordbox').innerHTML = html;
    // 逐个取 SVG 内联（去掉白底），颜色与站点一致
    document.querySelectorAll('.zislot').forEach(function (slot) {
      fetch('svg/' + encodeURIComponent(slot.dataset.c) + '-' + slot.dataset.v + '.svg')
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (svg) {
          if (!svg) return;
          var inner = svg.replace(/<rect[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>/, '');
          slot.innerHTML = '<svg class="zi-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
        })
        .catch(function () {});
    });`;

const newBlock = `    var n = chars.length;
    var cntOf = function (i) { return n === 2 ? 2 : n === 3 ? (i === 2 ? 2 : 1) : 1; };
    var keysStr = w.keys || '';
    var html = '';
    var startPos = 0;
    for (var i = 0; i < n; i++) {
      var k = cntOf(i);
      var isKeyName = keysStr.charAt(i) === '1' && k >= 2;
      html += '<span class="zislot" data-c="' + chars[i] + '" data-v="' + ver + '" data-start="' + startPos + '" data-k="' + k + '" data-key="' + (isKeyName ? '1' : '0') + '"></span>';
      if (isKeyName) {
        html += '<span class="zislot" data-c="' + chars[i] + '" data-v="' + ver + '" data-start="' + (startPos + 1) + '" data-k="0" data-key="dash"></span>';
      }
      startPos += k;
    }
    $('wordbox').innerHTML = html;
    document.querySelectorAll('.zislot').forEach(function (slot) {
      fetch('svg/' + encodeURIComponent(slot.dataset.c) + '-' + slot.dataset.v + '.svg')
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (svg) {
          if (!svg) return;
          var inner = svg.replace(/<rect[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>/, '');
          var k = Number(slot.dataset.k);
          var st = Number(slot.dataset.start);
          var out;
          if (slot.dataset.key === 'dash') {
            out = dashOnlySvg(inner, PALETTE[st % 4]);
          } else if (slot.dataset.key === '1') {
            out = colorWholeSvg(inner, PALETTE[st % 4]);
          } else {
            out = recolorSvg(inner, st, k);
          }
          slot.innerHTML = '<svg class="zi-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">' + out + '</svg>';
        })
        .catch(function () {});
    });`;

if (t.includes(oldBlock)) {
  t = t.replace(oldBlock, newBlock);
  fs.writeFileSync(p, t, 'utf8');
  console.log('redraw 已替换');
} else {
  console.log('未找到旧代码块');
}
