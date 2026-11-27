/* file:// 下外链 <use href="frag-sprite.svg#..."> 不渲染：
   本地动态加载 frag-sprite.js 后，把 <use> 换成内联图形；线上保持原生 <use>，不加载 sprite。 */
(function () {
  function inline() {
    var map = window.FRAG_SVG || {};
    var uses = document.querySelectorAll('svg.frag use');
    for (var i = 0; i < uses.length; i++) {
      var u = uses[i];
      var href = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
      var m = href.match(/frag-(\d+)/);
      if (!m) continue;
      var inner = map[m[1]];
      var svg = u.parentNode;
      if (inner && svg && svg.tagName.toLowerCase() === 'svg') svg.innerHTML = inner;
    }
  }
  function boot() {
    if (location.protocol !== 'file:') return;           // 线上：原生 use 正常
    if (window.FRAG_SVG) { inline(); return; }
    var s = document.createElement('script');
    s.src = '../data/frag-sprite.js';
    s.onload = inline;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
