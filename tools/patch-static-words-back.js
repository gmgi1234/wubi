// 恢复静态词组 sitemap + 目录页优先链到静态页
const fs = require('node:fs');
const ROOT = 'D:/Users/10061/Downloads/wubi';

// 1) sitemap
const sp = ROOT + '/tools/build-sitemaps.js';
let t = fs.readFileSync(sp, 'utf8');
if (!t.includes('keepWords').valueOf()) { /* noop */ }
if (t.includes('const staticWordUrls = [];')) {
  t = t.replace('const staticWordUrls = [];',
    "const keepWords = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8')));\nconst staticWordUrls = [...keepWords].map((w) => `${SITE}/ci/${encodeURIComponent(w)}.html`);");
  t = t.replace('const dynWordUrls = words.map(', 'const dynWordUrls = words.filter((x) => !keepWords.has(x.w)).map(');
  t = t.replace('  <sitemap><loc>${SITE}/ci/sitemap-ci-dyn.xml</loc></sitemap>',
    '  <sitemap><loc>${SITE}/ci/sitemap-ci-static.xml</loc></sitemap>\n  <sitemap><loc>${SITE}/ci/sitemap-ci-dyn.xml</loc></sitemap>');
  t = t.replace("fs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-dyn.xml'), urlset(dynWordUrls), 'utf8');",
    "fs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-static.xml'), urlset(staticWordUrls), 'utf8');\nfs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-dyn.xml'), urlset(dynWordUrls), 'utf8');");
  fs.writeFileSync(sp, t, 'utf8');
  console.log('sitemap 已恢复静态词组');
}

// 2) 目录页：静态词优先链到 .html
const ip = ROOT + '/tools/build-ci-index.js';
let s = fs.readFileSync(ip, 'utf8');
if (!s.includes('STATIC_WORDS')) {
  s = s.replace("const counts = {};",
    "const staticWords = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8'));\nconst STATIC_SET = JSON.stringify(staticWords);\n\nconst counts = {};");
  s = s.replace("var cache={}, list=[], shown=0, mode='len', PAGE=300, curN=2;",
    "var cache={}, list=[], shown=0, mode='len', PAGE=300, curN=2;\n  var STATIC=new Set(" + "${STATIC_SET}" + ");");
  s = s.replace("return '<a href=\"../ci.html?w='+encodeURIComponent(w)+'\">'+w+'</a>';",
    "return '<a href=\"'+(STATIC.has(w)?encodeURIComponent(w)+'.html':'../ci.html?w='+encodeURIComponent(w))+'\">'+w+'</a>';");
  fs.writeFileSync(ip, s, 'utf8');
  console.log('目录页已改为静态优先');
}
