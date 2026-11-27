/* 本地 file:// 双击打开兼容：把目录链接补成 index.html；http/https 线上不执行
   同时监听动态插入的链接（char.html/ci.html 的头部是 JS 生成的） */
(function () {
  if (location.protocol !== 'file:') return;

  function fix(a) {
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#' || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(h) || h.slice(0, 2) === '//') return;
    var c = h.split('#')[0].split('?')[0];
    if (!c) return;
    if (c === '..') { a.setAttribute('href', '../index.html'); return; }
    if (c === '.') { a.setAttribute('href', './index.html'); return; }
    if (c === '/') {
      a.setAttribute('href', /\/(ci|char)\//.test(location.pathname) ? '../index.html' : 'index.html');
      return;
    }
    if (c.charAt(c.length - 1) === '/') a.setAttribute('href', h + 'index.html');
  }

  function scan(root) {
    if (root.nodeType === 1 && root.tagName === 'A' && root.hasAttribute('href')) fix(root);
    var as = root.querySelectorAll ? root.querySelectorAll('a[href]') : [];
    for (var i = 0; i < as.length; i++) fix(as[i]);
  }

  scan(document);
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var add = muts[i].addedNodes;
        for (var j = 0; j < add.length; j++) {
          if (add[j].nodeType === 1) scan(add[j]);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
