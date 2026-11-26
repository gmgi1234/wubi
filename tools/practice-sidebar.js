// 练习页：把设置区改成可折叠的左侧边栏
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');

// 1) 结构：包一层 layout，设置区移入 aside
t = t.replace('<main>\n  <h1>词组练习</h1>', '<div class="layout">\n<aside id="sidebar">\n  <div class="side-head"><span>练习设置</span><button id="collapseBtn" title="收起">×</button></div>\n  <div class="side-body">\n  <h1 style="font-size:20px;margin:0 0 2px">词组练习</h1>');

t = t.replace('  <hr>\n\n  <!-- 练习区 -->', '  </div>\n</aside>\n<button id="openSide" class="hidden" title="展开设置">设置</button>\n<main>\n\n  <!-- 练习区 -->');

t = t.replace('</main>\n<footer>', '</main>\n</div>\n<footer>');

// 2) 样式
t = t.replace('</style>', `
 .layout { display:flex; align-items:flex-start; max-width:1180px; margin:0 auto; }
 aside { width:252px; flex:0 0 252px; position:sticky; top:0; align-self:flex-start; padding:20px 16px 24px 20px; border-right:1px solid var(--line); min-height:calc(100vh - 52px); }
 aside.hidden { display:none; }
 .side-head { display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:14px; margin-bottom:12px; }
 .side-head button { border:1px solid var(--line); background:#fff; border-radius:7px; width:26px; height:26px; cursor:pointer; color:var(--muted); font-size:15px; line-height:1; }
 .side-body .bar { display:flex; flex-direction:column; align-items:flex-start; gap:6px; margin:12px 0; }
 .side-body .lab { width:auto; font-size:13px; margin-bottom:2px; }
 .side-body .chips { display:flex; flex-wrap:wrap; gap:6px; }
 .side-body .chip { font-size:13px; padding:4px 10px; }
 .side-body hr { margin:14px 0; width:100%; }
 .side-body .wrongbox { font-size:13px; color:var(--muted); }
 #openSide { position:fixed; left:10px; top:64px; z-index:40; border:1px solid var(--line); background:#fffdf8; border-radius:8px; padding:6px 10px; cursor:pointer; font-family:inherit; font-size:14px; color:var(--accent); }
 main { flex:1; min-width:0; max-width:820px; margin:20px auto; }
 @media (max-width:860px) {
   aside { position:fixed; left:0; top:0; bottom:0; z-index:60; background:var(--paper); box-shadow:6px 0 24px rgba(0,0,0,.12); overflow:auto; }
   aside.hidden { display:none; }
 }
</style>`);

// 3) 统计开关和错题按钮移到侧栏（错题按钮保留在主区，另有计数在侧栏）
t = t.replace('<button class="chip on" id="statToggle" style="margin-left:auto">计时统计：开</button>', '<button class="chip on" id="statToggle">计时统计：开</button>');

// 4) 折叠逻辑
t = t.replace('  refreshWrongCount();\n  restart();', `  refreshWrongCount();
  restart();

  // 侧边栏折叠
  var LS_SIDE = 'wubi_practice_sidebar';
  function applySide(open) {
    document.getElementById('sidebar').classList.toggle('hidden', !open);
    document.getElementById('openSide').classList.toggle('hidden', open);
    try { localStorage.setItem(LS_SIDE, open ? '1' : '0'); } catch (e) {}
  }
  document.getElementById('collapseBtn').onclick = function () { applySide(false); };
  document.getElementById('openSide').onclick = function () { applySide(true); };
  var saved = null;
  try { saved = localStorage.getItem(LS_SIDE); } catch (e) {}
  applySide(saved !== '0');`);

fs.writeFileSync(p, t, 'utf8');
console.log('侧边栏已加入:', t.includes('id="sidebar"'));
