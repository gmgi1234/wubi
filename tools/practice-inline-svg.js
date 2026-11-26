// 字形改为内联 SVG（去掉白底矩形，融入纸色背景）
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

t = t.replace(
  /    var html = '';\n    for \(var i = 0; i < chars.length; i\+\+\) \{\n      var c = chars\[i\];\n      html \+= '<img class="zi-svg" alt="' \+ c \+ '" src="svg\/' \+ encodeURIComponent\(c\) \+ '-' \+ ver \+ '.svg">';\n    \}\n    \$'wordbox'\)\.innerHTML = html;/,
  ''
);

// 上面的精确替换可能因引号失败，改用简单标记替换
t = t.replace("    var html = '';\n    for (var i = 0; i < chars.length; i++) {\n      var c = chars[i];\n      html += '<img class=\"zi-svg\" alt=\"' + c + '\" src=\"svg/' + encodeURIComponent(c) + '-' + ver + '.svg\">';\n    }\n    $('wordbox').innerHTML = html;",
  "    var html = '';\n    for (var i = 0; i < chars.length; i++) {\n      html += '<span class=\"zislot\" data-c=\"' + chars[i] + '\" data-v=\"' + ver + '\"></span>';\n    }\n    $('wordbox').innerHTML = html;\n    // 逐个取 SVG 内联（去掉白底），颜色与站点一致\n    document.querySelectorAll('.zislot').forEach(function (slot) {\n      fetch('svg/' + encodeURIComponent(slot.dataset.c) + '-' + slot.dataset.v + '.svg')\n        .then(function (r) { return r.ok ? r.text() : ''; })\n        .then(function (svg) {\n          if (!svg) return;\n          var inner = svg.replace(/<rect[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\\/svg>/, '');\n          slot.innerHTML = '<svg class=\"zi-svg\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">' + inner + '</svg>';\n        })\n        .catch(function () {});\n    });"
);

t = t.replace('.zi-svg { width:150px; height:150px; display:block; }', '.zi-svg { width:150px; height:150px; display:block; }\n .zislot { display:inline-block; width:150px; height:150px; }');
t = t.replace('  .zi-svg { width:110px; height:110px; }', '  .zi-svg { width:110px; height:110px; }\n   .zislot { width:110px; height:110px; }');

fs.writeFileSync(p, t, 'utf8');
console.log('内联 SVG:', t.includes('zislot'), '| img 残留:', t.includes('<img class="zi-svg"'));
