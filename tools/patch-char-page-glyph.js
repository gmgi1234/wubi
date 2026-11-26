// 用新抓取的 SVG 更新单字页里「象」的字形
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR = process.argv[2] || '象';

const pagePath = path.join(ROOT, 'char', `${CHAR}.html`);
let t = fs.readFileSync(pagePath, 'utf8');

const labels = { '06': '新世纪', '86': '86 版', '98': '98 版' };
let replaced = 0;

for (const ver of ['06', '86', '98']) {
  const svgRaw = fs.readFileSync(path.join(ROOT, 'svg', `${CHAR}-${ver}.svg`), 'utf8');
  const inner = svgRaw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  // 去掉白底矩形，保留笔画
  const cleaned = inner.replace(/<rect[^>]*>/g, '');
  const newSvg = `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${cleaned}</svg>`;

  // 找到该版本卡片里的旧 svg 并替换
  const label = labels[ver];
  const labelIdx = t.indexOf(`>${label}<`);
  if (labelIdx < 0) { console.log(ver, '未找到版本卡片'); continue; }
  const svgStart = t.indexOf('<svg', labelIdx);
  const svgEnd = t.indexOf('</svg>', svgStart);
  if (svgStart < 0 || svgEnd < 0) { console.log(ver, '未找到 svg'); continue; }
  t = t.slice(0, svgStart) + newSvg + t.slice(svgEnd + 6);
  replaced += 1;
}

fs.writeFileSync(pagePath, t, 'utf8');
console.log('替换字形:', replaced, '| 页面大小 KB:', Math.round(t.length / 1024));
