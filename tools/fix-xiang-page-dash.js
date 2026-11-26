// 象字：用新字形（12 笔）替换，并给补码那一笔加虚线
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR = '象';
const labels = { '06': '新世纪', '86': '86 版', '98': '98 版' };

let page = fs.readFileSync(path.join(ROOT, 'char', `${CHAR}.html`), 'utf8');

for (const ver of ['06', '86', '98']) {
  const raw = fs.readFileSync(path.join(ROOT, 'svg', `${CHAR}-${ver}.svg`), 'utf8');
  let inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  inner = inner.replace(/<rect[^>]*>/g, '');

  // 找最后一个 path 的 d，作为补码笔画
  const paths = [...inner.matchAll(/<path[^>]*?d="([^"]*)"[^>]*?\/>/g)];
  if (paths.length) {
    const lastD = paths[paths.length - 1][1];
    inner += `<path d="${lastD}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"/>`;
  }

  const newSvg = `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const labelIdx = page.indexOf(`>${labels[ver]}<`);
  if (labelIdx < 0) { console.log(ver, '未找到卡片'); continue; }
  const s = page.indexOf('<svg', labelIdx);
  const e = page.indexOf('</svg>', s);
  page = page.slice(0, s) + newSvg + page.slice(e + 6);
}

fs.writeFileSync(path.join(ROOT, 'char', `${CHAR}.html`), page, 'utf8');
console.log('象 页已更新，大小 KB:', Math.round(page.length / 1024));
