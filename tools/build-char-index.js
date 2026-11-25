// 生成单字目录页：带检索（汉字或拼音，加载 142KB 索引），下面按常用度分组
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const DIR = path.join(ROOT, 'char');
const keep = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-chars.json'), 'utf8'));

const groups = [['最高频', keep.slice(0, 500)], ['常用', keep.slice(500, 1500)], ['其余', keep.slice(1500)]];
const sections = groups.map(([name, list]) => `
  <h2>${name}（${list.length}）</h2>
  <div class="grid">${list.map((c) => `<a href="${encodeURIComponent(c)}.html">${c}</a>`).join('')}</div>
`).join('');

const html = `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>全部单字页 · 五笔编码与拆分 · 五笔字根</title>
<meta name="description" content="按常用度排列的汉字单字页，支持输入汉字或拼音检索，每页含 86/98/新世纪三版编码与字根拆分。">
<style>
 :root{--ink:#2a2320;--muted:#8a7b6c;--line:#e6dcc9;--bg:#fbf7ef;--accent:#a33c2f}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--ink);font-family:'KaiTi','楷体',serif}
 header{border-bottom:1px solid var(--line);padding:12px 20px;display:flex;justify-content:space-between;font-size:15px}
 header a{color:var(--muted);text-decoration:none}
 main{max-width:1000px;margin:0 auto;padding:24px 18px 60px}
 h1{font-size:28px;margin:0 0 6px} .sub{color:var(--muted);margin-bottom:14px}
 h2{font-size:18px;margin:26px 0 10px;color:var(--accent)}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}
 .grid a{display:flex;align-items:center;justify-content:center;height:56px;border:1px solid var(--line);border-radius:8px;background:#fffdf8;color:var(--ink);text-decoration:none;font-size:26px}
 .grid a:hover{border-color:var(--accent);color:var(--accent)}
 .search{display:flex;gap:10px;margin:16px 0 8px}
 .search input{flex:1;font-size:18px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#fffdf8;font-family:inherit}
 .hint{color:var(--muted);font-size:14px;margin-bottom:10px}
 footer{border-top:1px solid var(--line);padding:16px;text-align:center;color:var(--muted);font-size:13px}
</style></head><body>
<header><a href="../">五笔字根 · 笔画着色</a><span><a href="../char/">全部单字</a>　<a href="../ci/">全部词组</a></span></header>
<main>
  <h1>全部单字页</h1>
  <div class="sub">共 ${keep.length} 个字，按常用度排列；支持输入汉字或拼音检索（如 gou、zhong）</div>

  <div class="search">
    <input id="q" type="search" placeholder="输入汉字或拼音，例如：狗、gou、zhong" autocomplete="off">
  </div>
  <div class="hint" id="hint">输入即检索，结果显示在下方</div>
  <div class="grid" id="results"></div>

  ${sections}
</main>
<footer>数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）</footer>
<script>
(function(){
  var input=document.getElementById('q'), box=document.getElementById('results'), hint=document.getElementById('hint');
  var data=null, loading=false;
  function load(cb){
    if(data){cb();return}
    if(loading){setTimeout(function(){load(cb)},120);return}
    loading=true; hint.textContent='正在加载字库…';
    var s=document.createElement('script'); s.src='../data/char-idx.js';
    s.onload=function(){ data=window.CHAR_IDX||[]; hint.textContent='字库就绪，共 '+data.length+' 字'; cb(); };
    s.onerror=function(){ hint.textContent='字库加载失败，请刷新重试'; };
    document.head.appendChild(s);
  }
  function render(q){
    if(!q){ box.innerHTML=''; hint.textContent='输入即检索，结果显示在下方'; return; }
    load(function(){
      var lower=q.toLowerCase(), out=[];
      for(var i=0;i<data.length && out.length<120;i++){
        var c=data[i][0], py=data[i][1]||'';
        if(c===q) { out.unshift(c); continue; }
        if(/^[a-z]+$/.test(lower) ? py.indexOf(lower)===0 : c.indexOf(q)===0) out.push(c);
      }
      out=out.slice(0,120);
      box.innerHTML=out.map(function(c){
        return '<a href="../char.html?c='+encodeURIComponent(c)+'">'+c+'</a>';
      }).join('');
      hint.textContent = out.length ? ('找到 '+out.length+' 个（最多显示 120）') : '没有匹配的字';
    });
  }
  var t=null;
  input.addEventListener('input',function(){
    var q=input.value.trim();
    clearTimeout(t); t=setTimeout(function(){render(q)},160);
  });
})();
</script>
</body></html>`;

fs.writeFileSync(path.join(DIR, 'index.html'), html, 'utf8');
console.log('char/index.html written with search, chars:', keep.length);
