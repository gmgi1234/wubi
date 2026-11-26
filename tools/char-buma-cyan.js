// 单字页：补码笔画改成青色填充（与主站一致），不再用红色虚线
const fs = require('node:fs');

// 1) 静态单字生成器
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-char.js';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('00BCD4')) {
  s = s.replace(
    "  t = t.replace(/<svg([^>]*)>/, (m, attrs) => `<svg class=\"glyph\"${attrs.replace(/\\s*xmlns=\"[^\"]*\"/g, '')} xmlns=\"http://www.w3.org/2000/svg\" style=\"width:${size}px;height:${size}px\">`);",
    `  // 补码笔画：把红色虚线换成青色实心（对齐主站）
  t = t.replace(/<path([^>]*?)d="([^"]*)"([^>]*?)stroke="#c0392b"([^>]*?)\\/>/g, (m, pre, d, mid, post) => '<path d="' + d + '" fill="#00BCD4"/>');
  t = t.replace(/<svg([^>]*)>/, (m, attrs) => \`<svg class="glyph"\${attrs.replace(/\\s*xmlns="[^"]*"/g, '')} xmlns="http://www.w3.org/2000/svg" style="width:\${size}px;height:\${size}px">\`);`
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('静态单字生成器:', s.includes('00BCD4'));
}

// 2) 动态单字页（char.html 里 fetch 后处理）
const cp = 'D:/Users/10061/Downloads/wubi/char.html';
let c = fs.readFileSync(cp, 'utf8');
if (!c.includes('00BCD4')) {
  c = c.replace(
    "      const inner = t.replace(/^[\\s\\S]*?<svg[^>]*>/, '').replace(/<\\/svg>\\s*$/, '');",
    `      const inner0 = t.replace(/^[\\s\\S]*?<svg[^>]*>/, '').replace(/<\\/svg>\\s*$/, '');
      const inner = inner0.replace(/<path([^>]*?)d="([^"]*)"([^>]*?)stroke="#c0392b"([^>]*?)\\/>/g, (m, pre, d, mid, post) => '<path d="' + d + '" fill="#00BCD4"/>');`
  );
  fs.writeFileSync(cp, c, 'utf8');
  console.log('char.html:', c.includes('00BCD4'));
}
