// 动态页的搜索框：innerHTML 插入的 <script> 不执行，改为渲染后绑定事件
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/data/render.js';
let t = fs.readFileSync(p, 'utf8');

// 去掉无效的内联 script
t = t.replace(/\s*<script>\(function\(\)\{var q=document\.getElementById\('wsearch'\)[\s\S]*?<\/script>/, '');

// 在 shell 函数末尾绑定
if (!t.includes('function wireSearch')) {
  t = t.replace(
    '  const svgWrap = (inner, size) =>',
    `  function wireSearch() {
    const q = document.getElementById('wsearch');
    if (!q || q.dataset.wired) return;
    q.dataset.wired = '1';
    q.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const v = q.value.trim();
      if (!v) return;
      location.href = 'ci.html?w=' + encodeURIComponent(v);
    });
  }

  const svgWrap = (inner, size) =>`
  );
}

// shell 渲染完成后调用
t = t.replace(
  "      <footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>`;",
  "      <footer>数据来源：Rime 五笔码表 · 五笔 Make Me a Hanzi（笔画）</footer>`;\n    wireSearch();"
);

fs.writeFileSync(p, t, 'utf8');
console.log('wireSearch:', t.includes('function wireSearch'), '| 调用:', t.includes('wireSearch();'));
