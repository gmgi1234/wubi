// 练习页：键盘字根优先用矢量字形（KB_ROOT_GLYPHS），无字形才回退文字
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 引入数据
if (!t.includes('kb-root-glyphs.js')) {
  t = t.replace('<script src="data/char-flags.js"></script>', '<script src="data/char-flags.js"></script>\n<script src="data/kb-root-glyphs.js"></script>');
  if (!t.includes('kb-root-glyphs.js')) t = t.replace('<script>', '<script src="data/kb-root-glyphs.js"></script>\n<script>');
}

// 2) rootHtml 优先用键盘字根库
const anchor = "  function rootHtml(tok) {\n    var g = (window.ROOT_GLYPHS || {})[tok];";
const neu = `  function rootHtml(tok) {
    var kb = (window.KB_ROOT_GLYPHS || {})[tok];
    if (kb) {
      return '<svg class="rg" viewBox="0 0 1024 1024" aria-hidden="true">' + kb + '</svg>';
    }
    var g = (window.ROOT_GLYPHS || {})[tok];`;

if (t.includes(anchor)) {
  t = t.replace(anchor, neu);
} else if (t.includes("  function rootHtml(tok) {\r\n    var g = (window.ROOT_GLYPHS || {})[tok];")) {
  t = t.replace("  function rootHtml(tok) {\r\n    var g = (window.ROOT_GLYPHS || {})[tok];", neu.replace(/\n/g, '\r\n'));
} else {
  console.log('未找到 rootHtml');
  process.exit(1);
}

// 3) 字形尺寸
t = t.replace('.kb-roots .rg { width: 18px; height: 18px; vertical-align: -4px; }', '.kb-roots .rg { width: 20px; height: 20px; vertical-align: -4px; fill: currentColor; }');

fs.writeFileSync(p, t, 'utf8');
console.log('键盘字形库:', t.includes('KB_ROOT_GLYPHS'), '| rootHtml 优先:', t.includes('var kb = (window.KB_ROOT_GLYPHS'));
