// 给词组页加搜索框：输入词回车跳到对应页面
const fs = require('node:fs');

// ---------- 1) 静态词组页 ----------
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('wsearch')) {
  s = s.replace(
    /<header><a href="\.\.\/">五笔字根 · 笔画着色<\/a><div class="word-nav">/,
    `<header><a href="../">五笔字根 · 笔画着色</a><input id="wsearch" class="wsearch" placeholder="搜索词组，回车跳转" autocomplete="off"><div class="word-nav">`
  );
  s = s.replace(
    '</body></html>',
    `<script>(function(){var q=document.getElementById('wsearch');if(!q)return;q.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var v=q.value.trim();if(!v)return;location.href='../ci.html?w='+encodeURIComponent(v);});})();</script>
</body></html>`
  );
  s = s.replace('  .word-nav {', '  .wsearch { font-family:inherit; font-size:14px; padding:5px 10px; border:1px solid var(--line); border-radius:8px; background:#fffdf8; width:220px; }\n  .word-nav {');
  fs.writeFileSync(sp, s, 'utf8');
  console.log('静态词组页已加搜索框:', s.includes('wsearch'));
}

// ---------- 2) 动态词组页 ----------
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
if (!r.includes('wsearch')) {
  r = r.replace(
    '<header><a href="./">五笔字根 · 笔画着色</a><span><a href="char/">全部单字</a>　<a href="ci/">全部词组</a></span></header>',
    `<header><a href="./">五笔字根 · 笔画着色</a><input id="wsearch" class="wsearch" placeholder="搜索词组，回车跳转" autocomplete="off"><span><a href="char/">全部单字</a>　<a href="ci/">全部词组</a></span></header>`
  );
  r = r.replace(
    '<footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>',
    `<footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>
      <script>(function(){var q=document.getElementById('wsearch');if(!q)return;q.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var v=q.value.trim();if(!v)return;location.href='ci.html?w='+encodeURIComponent(v);});})();</script>`
  );
  r = r.replace('  header a { color:var(--muted); text-decoration:none; }', '  header a { color:var(--muted); text-decoration:none; }\n  .wsearch { font-family:inherit; font-size:14px; padding:5px 10px; border:1px solid var(--line); border-radius:8px; background:#fffdf8; width:220px; }');
  fs.writeFileSync(rp, r, 'utf8');
  console.log('动态词组页已加搜索框:', r.includes('wsearch'));
}
