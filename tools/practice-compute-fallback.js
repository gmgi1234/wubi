// 练习页：词库查不到时，用单字数据现场算一个词组记录
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 引入 char-basic（懒加载）
if (!t.includes('char-basic.js')) {
  t = t.replace('  function flagsOf(word) {', `  var basicLoading = null;
  function loadBasic(cb) {
    if (window.CHAR_BASIC) { cb(window.CHAR_BASIC); return; }
    if (basicLoading) { basicLoading.push(cb); return; }
    basicLoading = [cb];
    var s = document.createElement('script');
    s.src = 'data/char-basic.js';
    s.onload = function () { var list = basicLoading; basicLoading = null; list.forEach(function (f) { f(window.CHAR_BASIC || {}); }); };
    s.onerror = function () { basicLoading = null; cb({}); };
    document.head.appendChild(s);
  }

  function computeWord(word) {
    // 用单字数据按五笔词组规则现算
    var chars = [...word];
    var n = chars.length;
    var basic = window.CHAR_BASIC || {};
    var codes = [], roots86 = [], roots98 = [], roots06 = [];
    for (var i = 0; i < n; i++) {
      var b = basic[chars[i]];
      if (!b) return null;
      codes.push({ c86: b[0], c98: b[1], c06: b[2] });
      roots86.push(b[3].split(' ').filter(Boolean));
      roots98.push(b[4].split(' ').filter(Boolean));
      roots06.push(b[5].split(' ').filter(Boolean));
    }
    function pick(list, k) {
      var out = [];
      for (var i = 0; i < n; i++) out = out.concat(list[i].slice(0, k[i]));
      return out;
    }
    var cnt = n === 2 ? [2, 2] : n === 3 ? [1, 1, 2] : n === 4 ? [1, 1, 1, 1] : (function () { var a = []; for (var i = 0; i < n; i++) a.push(i < 3 ? 1 : (i === n - 1 ? 1 : 0)); return a; })();
    function code(ver) {
      var cs = codes.map(function (x) { return x[ver]; });
      if (cs.some(function (x) { return !x; })) return '';
      if (n === 2) return cs[0].slice(0, 2) + cs[1].slice(0, 2);
      if (n === 3) return cs[0][0] + cs[1][0] + cs[2].slice(0, 2);
      if (n === 4) return cs.map(function (x) { return x[0]; }).join('');
      return cs[0][0] + cs[1][0] + cs[2][0] + cs[n - 1][0];
    }
    var c86 = code('c86'), c98 = code('c98'), c06 = code('c06');
    if (!c06) return null;
    var fl = flagsOf(word);
    return {
      w: word, c6: c06, c86: c86 || c06, c98: c98 || c06,
      r6: pick(roots06, cnt).join(' '), r86: pick(roots86, cnt).join(' '), r98: pick(roots98, cnt).join(' '),
      keys: fl.keys, cheng: fl.cheng, len: n
    };
  }

  function flagsOf(word) {`);
}

// 2) loadLongWord 里词库没有时，用 computeWord 兜底
t = t.replace(
  "      var rec = (window[key] || {})[t];\r\n      if (!rec) { msg.textContent = '词库里没有「' + t + '」'; msg.className = 'msg bad'; return; }",
  "      var rec = (window[key] || {})[t];\r\n      if (!rec) {\r\n        loadBasic(function () {\r\n          var calc = computeWord(t);\r\n          if (!calc) { msg.textContent = '词库里没有「' + t + '」'; msg.className = 'msg bad'; return; }\r\n          calc.keysDone = true;\r\n          state.len = n;\r\n          var at2 = -1;\r\n          for (var jj = 0; jj < state.pool.length; jj++) { if (state.pool[jj].w === t) { at2 = jj; break; } }\r\n          if (at2 < 0) { state.pool.splice(state.idx, 0, calc); at2 = state.idx; }\r\n          state.idx = at2; state.locked = false; state.running = true;\r\n          $('result').classList.add('hidden');\r\n          $('play').classList.remove('hidden');\r\n          $('qTotal').textContent = state.pool.length;\r\n          $('qIndex').textContent = state.idx + 1;\r\n          msg.textContent = '已跳到「' + t + '」（现算）';\r\n          msg.className = 'msg';\r\n          redraw();\r\n          var ti2 = $('typeInput'); ti2.value = ''; ti2.className = ''; ti2.disabled = false;\r\n          $('jumpInput').blur();\r\n        });\r\n        return;\r\n      }"
);

fs.writeFileSync(p, t, 'utf8');
console.log('computeWord:', t.includes('function computeWord'), '| 兜底:', t.includes('现算'));
