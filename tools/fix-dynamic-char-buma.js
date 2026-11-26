// 1) 动态单字页取消「补码涂青色」，改为保留红色虚线
const fs = require('node:fs');
const cp = 'D:/Users/10061/Downloads/wubi/char.html';
let c = fs.readFileSync(cp, 'utf8');
if (c.includes('00BCD4')) {
  c = c.replace(
    /const inner0 = t\.replace\([\s\S]*?const inner = inner0\.replace\([\s\S]*?\);/,
    "const inner = t.replace(/^[\\s\\S]*?<svg[^>]*>/, '').replace(/<\\/svg>\\s*$/, '');"
  );
  fs.writeFileSync(cp, c, 'utf8');
}
console.log('char.html 含青色:', c.includes('00BCD4'));

// 2) 象的三版字形统一为 12 笔，并补末笔虚线
const ROOT = 'D:/Users/10061/Downloads/wubi';
const base = fs.readFileSync(`${ROOT}/svg/象-86.svg`, 'utf8');
for (const ver of ['06', '98']) {
  fs.writeFileSync(`${ROOT}/svg/象-${ver}.svg`, base, 'utf8');
}
for (const ver of ['06', '86', '98']) {
  const p = `${ROOT}/svg/象-${ver}.svg`;
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('c0392b')) continue;
  const tags = [...t.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
  let best = null;
  for (const tag of tags) {
    const im = tag.match(/data-stroke-index="(\d+)"/);
    const dm = tag.match(/\bd="([^"]*)"/);
    if (!im || !dm) continue;
    if (!best || Number(im[1]) > best.i) best = { i: Number(im[1]), d: dm[1] };
  }
  if (best) {
    const dash = `<path d="${best.d}" fill="none" stroke="#c0392b" stroke-width="7" stroke-dasharray="16 10" stroke-linejoin="round"></path>`;
    t = /<\/g>\s*$/.test(t) ? t.replace(/<\/g>\s*$/, dash + '</g>') : t.replace(/<\/svg>\s*$/, dash + '</svg>');
    fs.writeFileSync(p, t, 'utf8');
  }
}
console.log('象 svg 已完成');
