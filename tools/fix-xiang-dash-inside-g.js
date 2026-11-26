// 象字：补码虚线插到 <g> 内部（避免翻转错位）
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR = '象';

let page = fs.readFileSync(path.join(ROOT, 'char', `${CHAR}.html`), 'utf8');
const vers = ['06', '86', '98'];
let idx = 0;

page = page.replace(/<svg class="glyph"[\s\S]*?<\/svg>/g, () => {
  const ver = vers[idx] || '06';
  idx += 1;
  let inner = fs.readFileSync(path.join(ROOT, 'svg', `${CHAR}-${ver}.svg`), 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<rect[^>]*>/g, '');

  // 取 data-stroke-index 最大的那一笔（补码笔画）
  const entries = [...inner.matchAll(/<path[^>]*data-stroke-index="(\d+)"[^>]*?d="([^"]*)"/g)]
    .map((m) => ({ i: Number(m[1]), d: m[2] }))
    .sort((a, b) => b.i - a.i);
  const target = entries[0];
  if (target) {
    const dash = `<path d="${target.d}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"></path>`;
    inner = inner.replace(/<\/g>\s*$/, dash + '</g>');
    if (!inner.includes('stroke="#c0392b"')) inner += dash;
  }
  return `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
});

fs.writeFileSync(path.join(ROOT, 'char', `${CHAR}.html`), page, 'utf8');
console.log('替换:', idx, '| 虚线:', (page.match(/stroke="#c0392b"/g) || []).length);
