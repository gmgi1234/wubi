// 练习页：搜索跳转的词也要带上 keys/cheng 标记
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 引入 char-flags 数据
if (!t.includes('char-flags.js')) {
  t = t.replace('<script>', '<script src="data/char-flags.js"></script>\n<script>');
}

// 2) 统一的标记计算函数
if (!t.includes('function flagsOf(')) {
  t = t.replace('  function codeOf(w) {', `  function flagsOf(word) {
    var keys = '', cheng = '';
    var chars = [...word];
    for (var i = 0; i < chars.length; i++) {
      var f = (window.CHAR_FLAGS || {})[chars[i]] || '00';
      keys += f.charAt(0);
      cheng += f.charAt(1);
    }
    return { keys: keys, cheng: cheng };
  }

  function codeOf(w) {`);
}

// 3) 搜索跳转时补上标记
t = t.replace(
  /(\s+)rec = \{ w: word, ch: chars, c6: row\.c86, c86: row\.c86, c98: row\.c98, r6: row\.r86\.join\(' '\), r86: row\.r86\.join\(' '\), r98: row\.r98\.join\(' '\), len: n \};/,
  "$1var fl = flagsOf(word);$1rec = { w: word, ch: chars, c6: row.c86, c86: row.c86, c98: row.c98, r6: row.r86.join(' '), r86: row.r86.join(' '), r98: row.r98.join(' '), keys: fl.keys, cheng: fl.cheng, len: n };"
);

// 4) 兜底：若跳转词的 rec 缺 keys/cheng，补上
t = t.replace(
  "      st.pool = [rec];",
  "      if (!rec.keys || !rec.cheng) { var fl2 = flagsOf(rec.w); rec.keys = fl2.keys; rec.cheng = fl2.cheng; }\n      st.pool = [rec];"
);

fs.writeFileSync(p, t, 'utf8');
console.log('char-flags 引入:', t.includes('char-flags.js'), '| flagsOf:', t.includes('function flagsOf('), '| 跳转补标记:', t.includes('flagsOf(word)'));
