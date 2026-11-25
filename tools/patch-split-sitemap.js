// 百度不接受索引型 sitemap，也不接受超过 5 万条的单个文件：
// 把动态词组 sitemap 拆成每份 45,000 条，并让 robots 直接列子文件
const fs = require('node:fs');

const p = 'D:/Users/10061/Downloads/wubi/tools/build-sitemaps.js';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('sitemap-ci-dyn-1.xml') && !t.includes('chunkXml')) {
  // 插入分片函数
  t = t.replace(
    "fs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-dyn.xml'), urlset(dynWordUrls), 'utf8');",
    `// 动态词组超过 5 万条，按 45,000 条切分（百度单文件上限）
const CHUNK = 45000;
const dynParts = [];
for (let i = 0; i < Math.max(1, Math.ceil(dynWordUrls.length / CHUNK)); i += 1) {
  const part = path.join(ROOT, \`ci/sitemap-ci-dyn-\${i + 1}.xml\`);
  fs.writeFileSync(part, urlset(dynWordUrls.slice(i * CHUNK, (i + 1) * CHUNK)), 'utf8');
  dynParts.push(\`\${SITE}/ci/sitemap-ci-dyn-\${i + 1}.xml\`);
}
fs.writeFileSync(path.join(ROOT, 'ci/sitemap-ci-dyn.xml'), urlset(dynWordUrls), 'utf8');`
  );

  // 索引里列出分片（给 Google 用）
  t = t.replace('  <sitemap><loc>${SITE}/ci/sitemap-ci-dyn.xml</loc></sitemap>',
    '${dynParts.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join(\'\\n\')}');

  fs.writeFileSync(p, t, 'utf8');
  console.log('split patched');
} else {
  console.log('already patched');
}
