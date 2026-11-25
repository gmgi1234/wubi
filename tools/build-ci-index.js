// 生成词组目录页：带检索（加载 1MB 词条索引），下面按字数列静态页
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CI = path.join(ROOT, 'ci');
const keep = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8'));

const groups = [[2, '双字词'], [3, '三字词'], [4, '四字词'], [5, '五字词'], [6, '六字词及更长']];
const byLen = new Map(groups.map(([n]) => [n, []]));
for (const w of keep) {
  const n = Math.min([...w].length, 6);
  if (byLen.has(n)) byLen.get(n).push(w);
}

const sections = groups.map(([n, label]) => {
  const list = byLen.get(n) || [];
  if (!list.length) return '';
  return `<h2>${label}（${list.length}）</h2>
  <div class="grid">${list.map((w) => `<a href="${encodeURIComponent(w)}.html">${w}</a>`).join('')}</div>`;
}).join('\n');

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>全部词组页 · 五笔编码与拆分 · 五笔字根</title>
<meta name="description" content="按字数分类的五笔词组页，包含 86/98/新世纪三版编码与字根拆分；支持输入检索。">
<style>
 body{margin:0;background:#fbf7ef;color:#2a2320;font-family:'KaiTi','楷体',serif}
 main{max-width:1000px;margin:0 auto;padding:24px 18px 60px}
 h1{font-size:28px;margin:0 0 6px} .sub{color:#8a7b6c;margin-bottom:14px}
 h2{font-size:18px;margin:26px 0 10px;color:#a33c2f}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
 .grid a{display:block;text-align:center;padding:8px 6px;border:1px solid #e6dcc9;border-radius:8px;background:#fffdf8;color:#2a2320;text-decoration:none;font-size:17px}
 .grid a:hover{border-color:#a33c2f;color:#a33c2f}
 .search{display:flex;gap:10px;margin:16px 0 8px}
 .search input{flex:1;font-size:18px;padding:10px 14px;border:1px solid #e6dcc9;border-radius:10px;background:#fffdf8;font-family:inherit}
 .search button{font-size:16px;padding:10px 18px;border:0;border-radius:10px;background:#a33c2f;color:#fff;cursor:pointer}
 .hint{color:#8a7b6c;font-size:14px;margin-bottom:10px}
 .note{background:#fff;border:1px solid #e6dcc9;border-radius:10px;padding:12px 16px;font-size:14px;color:#6b5c4c}
 a.nav{color:#a33c2f;text-decoration:none}
</style></head><body><main>
<h1>全部词组页</h1>
<div class="sub">共 112,205 条词组 · 检索全部 · 下面按字数列出 ${keep.length} 个静态页</div>

<div class="search">
  <input id="q" type="search" placeholder="输入词语或单字，例如：中国、天安门、良莠不齐" autocomplete="off">
</div>
<div class="hint" id="hint">输入即检索，结果显示在下方</div>
<div class="grid" id="results"></div>

<div class="note">找不到的词，回 <a class="nav" href="../">查询页</a> 输入，或直接访问 <code>ci.html?w=词</code>。</div>
${sections}
</main>
<script>
(function(){
  var input=document.getElementById('q'), box=document.getElementById('results'), hint=document.getElementById('hint');
  var data=null, loading=false, pending='';
  function load(cb){
    if(data){cb();return}
    if(loading){setTimeout(function(){load(cb)},120);return}
    loading=true; hint.textContent='正在加载词库…';
    var s=document.createElement('script'); s.src='../data/word-index.js';
    s.onload=function(){ data=window.WORD_INDEX||[]; hint.textContent='词库已就绪，共 '+data.length+' 条'; cb(); };
    s.onerror=function(){ hint.textContent='词库加载失败，请刷新重试'; };
    document.head.appendChild(s);
  }
  function render(q){
    if(!q){ box.innerHTML=''; hint.textContent='输入即检索，结果显示在下方'; return; }
    load(function(){
      var starts=[], contains=[];
      for(var i=0;i<data.length;i++){
        var w=data[i];
        if(w===q) starts.unshift(w);
        else if(w.indexOf(q)===0) starts.push(w);
        else if(w.indexOf(q)>0) contains.push(w);
        if(starts.length>=120) break;
      }
      var list=starts.concat(contains).slice(0,120);
      box.innerHTML=list.map(function(w){
        return '<a href="../ci.html?w='+encodeURIComponent(w)+'">'+w+'</a>';
      }).join('');
      hint.textContent = list.length ? ('找到 '+list.length+' 个（最多显示 120）') : '没有匹配的词，试试别的';
    });
  }
  var t=null;
  input.addEventListener('input',function(){
    pending=input.value.trim();
    clearTimeout(t); t=setTimeout(function(){render(pending)},180);
  });
})();
</script>
</body></html>`;

fs.writeFileSync(path.join(CI, 'index.html'), html, 'utf8');
console.log('ci/index.html written with search, static words:', keep.length);
