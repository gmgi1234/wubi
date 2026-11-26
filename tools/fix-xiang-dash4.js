// 象字：给 data-stroke-index 最大的笔画加虚线（属性顺序无关）
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR = '象';

function pickTarget(inner) {
  const tags = [...inner.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
  let best = null;
  for (const tag of tags) {
    const im = tag.match(/data-stroke-index="(\d+)"/);
    const dm = tag.match(/\bd="([^"]*)"/);
    if (!im || !dm) continue;
    const i = Number(im[1]);
    if (!best || i > best.i) best = { i, d: dm[1] };
  }
  return best;
}

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
  inner = inner.replace(/<path[^>]*stroke="#c0392b"[^>]*>(?:<\/path>)?/g, '');

  const t = pickTarget(inner);
  if (t) {
    const dash = `<path d="${t.d}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"></path>`;
    if (/<\/g>\s*$/.test(inner)) inner = inner.replace(/<\/g>\s*$/, dash + '</g>');
    else inner += dash;
  }
  return `<svg class="glyph" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
});

fs.writeFileSync(path.join(ROOT, 'char', `${CHAR}.html`), page, 'utf8');
console.log('替换:', idx, '| 虚线:', (page.match(/stroke="#c0392b"/g) || []).length);
