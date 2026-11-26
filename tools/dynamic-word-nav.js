// 动态词组页：增加「上一个 / 下一个」导航（同首字桶内按顺序）
const fs = require('node:fs');

// 1) render.js：渲染导航
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
if (!r.includes('class="wnav"')) {
  r = r.replace(
    "      `<h1>「${esc(rec.w)}」的五笔编码与拆分</h1>",
    "      `${(rec.prev || rec.next) ? `<div class=\"wnav\">${rec.prev ? `<a href=\"ci.html?w=${encodeURIComponent(rec.prev)}\">← ${esc(rec.prev)}</a>` : '<span class=\"dim\">←</span>'}<a href=\"ci/\">全部词组</a>${rec.next ? `<a href=\"ci.html?w=${encodeURIComponent(rec.next)}\">${esc(rec.next)} →</a>` : '<span class=\"dim\">→</span>'}</div>` : ''}\n       <h1>「${esc(rec.w)}」的五笔编码与拆分</h1>"
  );
  r = r.replace("  .cta {", "  .wnav { display:flex; gap:14px; align-items:center; color:var(--accent); font-size:15px; margin-bottom:6px; }\n  .wnav a { color:var(--accent); text-decoration:none; }\n  .wnav .dim { color:#cfc8bd; }\n  .cta {");
  fs.writeFileSync(rp, r, 'utf8');
  console.log('render.js 导航:', r.includes('class="wnav"'));
}

// 2) ci.html：加载同桶词表，算出前后词
const cp = 'D:/Users/10061/Downloads/wubi/ci.html';
let c = fs.readFileSync(cp, 'utf8');
if (!c.includes('word-idx-')) {
  c = c.replace(
    '  rec.keyIdx = keyIdx;',
    `  // 同首字桶内的前后词
  try {
    await load('data/word-idx-' + wb + '.js');
    const list = window['WORD_IDX_' + wb] || [];
    const at = list.indexOf(w);
    if (at >= 0) {
      rec.prev = at > 0 ? list[at - 1] : '';
      rec.next = at < list.length - 1 ? list[at + 1] : '';
    }
  } catch (e) {}

  rec.keyIdx = keyIdx;`
  );
  fs.writeFileSync(cp, c, 'utf8');
  console.log('ci.html 前后词:', c.includes("WORD_IDX_"));
}
