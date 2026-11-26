// 象字页面：按出现顺序替换三张卡片里的 svg，并给补码笔画加虚线
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR = '象';

let page = fs.readFileSync(path.join(ROOT, 'char', `${CHAR}.html`), 'utf8');

const vers = ['06', '86', '98'];
let idx = 0;
page = page.replace(/<svg class="glyph"[\s\S]*?<\/svg>/g, (m) => {
  const ver = vers[idx] || '06';
  idx += 1;
  let inner = fs.readFileSync(path.join(ROOT, 'svg', `${CHAR}-${ver}.svg`), 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<rect[^>]*>/g, '');
  const paths = [...inner.matchAll(/<path[^>]*?d="([^"]*)"[^>]*?\/>/g)];
  if (paths.length) {
    const lastD = paths[paths.length - 1][1];
    inner += `<path d="${lastD}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"/>`;
  }
  return `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
});

fs.writeFileSync(path.join(ROOT, 'char', `${CHAR}.html`), page, 'utf8');
console.log('替换 svg 数:', idx, '| 虚线数:', (page.match(/stroke="#c0392b"/g) || []).length);
