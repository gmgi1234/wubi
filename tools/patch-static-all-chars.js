// 单字全部静态化后：sitemap 与索引页同步更新
const fs = require('node:fs');
const path = require('node:path');

// 1) sitemap：静态单字 = 全部 9631，动态单字 = 空
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-sitemaps.js';
let t = fs.readFileSync(sp, 'utf8');
t = t.replace(
  'const staticCharUrls = [...keepChars].map((c) => `${SITE}/char/${encodeURIComponent(c)}.html`);',
  'const staticCharUrls = ranking.map((c) => `${SITE}/char/${encodeURIComponent(c)}.html`);'
);
t = t.replace(
  'const dynCharUrls = ranking.filter((c) => !keepChars.has(c)).map((c) => `${SITE}/char.html?c=${encodeURIComponent(c)}`);',
  'const dynCharUrls = [];'
);
fs.writeFileSync(sp, t, 'utf8');
console.log('sitemap 生成器已更新');

// 2) 单字索引页：搜索结果直接指向静态页
const ip = 'D:/Users/10061/Downloads/wubi/tools/build-char-index.js';
let s = fs.readFileSync(ip, 'utf8');
s = s.replace("return '<a href=\"../char.html?c='+encodeURIComponent(c)+'\">'+c+'</a>';",
  "return '<a href=\"'+encodeURIComponent(c)+'.html\">'+c+'</a>';");
s = s.replace('支持输入汉字或拼音检索（如 gou、zhong）', '共 9,631 个字，全部有独立页面；支持输入汉字或拼音检索（如 gou、zhong）');
fs.writeFileSync(ip, s, 'utf8');
console.log('单字索引页生成器已更新');
