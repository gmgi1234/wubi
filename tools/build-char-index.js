// Build /char/index.html — a directory page listing every generated character page.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const DIR = path.join(ROOT, 'site', 'char');
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));

const chars = ranking.filter((c) => fs.existsSync(path.join(DIR, `${c}.html`)));
console.log('pages found:', chars.length);

const groups = [
  ['最高频', chars.slice(0, 500)],
  ['常用', chars.slice(500, 1500)],
  ['其余', chars.slice(1500)],
];

const sectionHtml = groups.map(([name, list]) => `
  <h2>${name}（${list.length}）</h2>
  <div class="grid">${list.map((c) => `<a href="${encodeURIComponent(c)}.html">${c}</a>`).join('')}</div>
`).join('');

const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>全部单字页 · 五笔编码与拆分 · 五笔字根</title>
<meta name="description" content="按常用度排列的全部汉字单字页，每页包含 86/98/新世纪三版五笔编码、字根拆分、笔画着色和取码规则。">
<link rel="canonical" href="https://wubi.iqiusuo.cn/char/">
<style>
  :root { --ink:#2a2320; --muted:#8a7b6c; --line:#e6dcc9; --bg:#fbf7ef; --accent:#a33c2f; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; }
  header { border-bottom:1px solid var(--line); padding:12px 20px; display:flex; justify-content:space-between; font-size:15px; }
  header a { color:var(--muted); text-decoration:none; }
  main { max-width:1000px; margin:0 auto; padding:24px 18px 60px; }
  h1 { font-size:30px; margin:0 0 6px; }
  .sub { color:var(--muted); margin-bottom:22px; }
  h2 { font-size:18px; margin:26px 0 10px; color:var(--accent); }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:8px; }
  .grid a { display:flex; align-items:center; justify-content:center; height:56px; border:1px solid var(--line);
            border-radius:8px; background:#fffdf8; color:var(--ink); text-decoration:none; font-size:26px; }
  .grid a:hover { border-color:var(--accent); color:var(--accent); }
  footer { border-top:1px solid var(--line); padding:16px; text-align:center; color:var(--muted); font-size:13px; }
</style>
</head><body>
<header><a href="/">五笔字根 · 笔画着色</a><a href="/">返回查询</a></header>
<main>
  <h1>全部单字页</h1>
  <div class="sub">共 ${chars.length} 个字，按常用度排列；点开可看三版编码、字根拆分、笔画着色和取码规则。</div>
  ${sectionHtml}
</main>
<footer>数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）</footer>
</body></html>`;

fs.writeFileSync(path.join(DIR, 'index.html'), html, 'utf8');
console.log('written site/char/index.html', html.length, 'bytes');
