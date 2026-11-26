// 象字页面：按顺序替换三张卡片的 svg，并给补码笔画加虚线（兼容 ></path> 写法）
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
  const ds = [...inner.matchAll(/<path[^>]*?d="([^"]*)"/g)].map((m) => m[1]);
  if (ds.length) {
    inner += `<path d="${ds[ds.length - 1]}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"></path>`;
  }
  return `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
});

fs.writeFileSync(path.join(ROOT, 'char', `${CHAR}.html`), page, 'utf8');
console.log('替换 svg 数:', idx, '| 虚线数:', (page.match(/stroke="#c0392b"/g) || []).length);
