// 生成词组目录页（只列静态保留的 5000 个）
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
<meta name="description" content="按字数分类的五笔词组页，包含 86/98/新世纪三版编码与字根拆分。">
<style>
 body{margin:0;background:#fbf7ef;color:#2a2320;font-family:'KaiTi','楷体',serif}
 main{max-width:1000px;margin:0 auto;padding:24px 18px 60px}
 h1{font-size:28px;margin:0 0 6px} .sub{color:#8a7b6c;margin-bottom:16px}
 h2{font-size:18px;margin:26px 0 10px;color:#a33c2f}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
 .grid a{display:block;text-align:center;padding:8px 6px;border:1px solid #e6dcc9;border-radius:8px;background:#fffdf8;color:#2a2320;text-decoration:none;font-size:17px}
 .grid a:hover{border-color:#a33c2f;color:#a33c2f}
 a.nav{color:#a33c2f;text-decoration:none}
 .note{background:#fff;border:1px solid #e6dcc9;border-radius:10px;padding:12px 16px;font-size:14px;color:#6b5c4c}
</style></head><body><main>
<h1>全部词组页</h1>
<div class="sub">共 ${keep.length} 条静态页；其它词组在查询页里输入即可查看</div>
<div class="note">找不到的词，回 <a class="nav" href="../">查询页</a> 输入，或直接访问 <code>ci.html?w=词</code>。</div>
${sections}
</main></body></html>`;

fs.writeFileSync(path.join(CI, 'index.html'), html, 'utf8');
console.log('ci/index.html written, words:', keep.length);
