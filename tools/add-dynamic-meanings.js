// 动态词组页：加载释义并插入
const fs = require('node:fs');

// 1) render.js 留出释义槽位
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
if (!r.includes('mean-slot')) {
  r = r.replace(
    '       <h2>单字拆分</h2>',
    '       <div id="mean-slot"></div>\n       <h2>单字拆分</h2>'
  );
  fs.writeFileSync(rp, r, 'utf8');
  console.log('render.js 槽位:', r.includes('mean-slot'));
}

// 2) ci.html 里加载对应桶的释义并填充
const cp = 'D:/Users/10061/Downloads/wubi/ci.html';
let c = fs.readFileSync(cp, 'utf8');
if (!c.includes('word-mean-')) {
  c = c.replace(
    '  WubiRender.renderWord(rec, glyphs, {});',
    `  WubiRender.renderWord(rec, glyphs, {});

  // 释义（按首字分桶，按需加载）
  (async function () {
    const slot = document.getElementById('mean-slot');
    if (!slot) return;
    const mb = w.charCodeAt(0) % 64;
    if (!window['WORD_MEAN_' + mb]) {
      await load('data/word-mean-' + mb + '.js');
    }
    const table = window['WORD_MEAN_' + mb] || {};
    const text = table[w];
    if (text) {
      slot.innerHTML = '<h2>释义</h2><div class="rule"><p>' + text.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])) + '</p></div>';
    }
  })();`
  );
  fs.writeFileSync(cp, c, 'utf8');
  console.log('ci.html 加载释义:', c.includes('word-mean-'));
}
