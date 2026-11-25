// 生成 sitemap（适配 GitHub Pages 根目录结构）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const SITE = 'https://wubi.iqiusuo.cn';
const charIdxRaw = fs.readFileSync(path.join(ROOT, 'data', 'char-idx.js'), 'utf8').match(/=(\[[\s\S]*\]);?$/);
const allChars = charIdxRaw ? JSON.parse(charIdxRaw[1]).map((x) => x[0]) : ranking;
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));
const keepChars = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-chars.json'), 'utf8')));
const keepWords = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'keep-words.json'), 'utf8')));

const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;

const staticCharUrls = allChars.map((c) => `${SITE}/char/${encodeURIComponent(c)}.html`);
const dynCharUrls = [];
const staticWordUrls = [];
const dynWordUrls = words.map((x) => `${SITE}/ci.html?w=${encodeURIComponent(x.w)}`);

fs.writeFileSync(path.join(ROOT, 'char/sitemap-char-static.xml'), urlset(staticCharUrls), 'utf8');
fs.writeFileSync(path.join(ROOT, 'char/sitemap-char-dyn.xml'), urlset(dynCharUrls), 'utf8');
fs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-dyn.xml'), urlset(dynWordUrls), 'utf8');

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/char/sitemap-char-static.xml</loc></sitemap>
  <sitemap><loc>${SITE}/char/sitemap-char-dyn.xml</loc></sitemap>
  <sitemap><loc>${SITE}/ci/sitemap-ci-dyn.xml</loc></sitemap>
</sitemapindex>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index, 'utf8');

console.log('static chars', staticCharUrls.length, '| dyn chars', dynCharUrls.length);
console.log('static words', staticWordUrls.length, '| dyn words', dynWordUrls.length);
console.log('sitemap index written at /sitemap.xml');
