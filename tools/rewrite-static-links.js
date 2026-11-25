// 把静态页里的站内链接改指向动态页
//   ./字.html            → ../char.html?c=字      （单字页之间）
//   ../char/字.html      → ../char.html?c=字
//   ../ci/词.html        → ../ci.html?w=词
//   词.html（词组页内）   → ../ci.html?w=词
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR_DIR = path.join(ROOT, 'site', 'char');
const CI_DIR = path.join(ROOT, 'site', 'ci');

function rewriteCharPage(html) {
  return html
    .replace(/href="((?:\.\.\/)?char\/)([^"\/]+?)\.html"/g, (m, p, c) => `href="../char.html?c=${encodeURIComponent(decodeURIComponent(c))}"`)
    .replace(/href="((?:\.\.\/)?ci\/)([^"\/]+?)\.html"/g, (m, p, w) => `href="../ci.html?w=${encodeURIComponent(decodeURIComponent(w))}"`)
    .replace(/href="([^"\/:?]+?)\.html"/g, (m, c) => (c === 'index' ? m : `href="../char.html?c=${encodeURIComponent(decodeURIComponent(c))}"`));
}

function rewriteCiPage(html) {
  return html
    .replace(/href="((?:\.\.\/)?char\/)([^"\/]+?)\.html"/g, (m, p, c) => `href="../char.html?c=${encodeURIComponent(decodeURIComponent(c))}"`)
    .replace(/href="((?:\.\.\/)?ci\/)([^"\/]+?)\.html"/g, (m, p, w) => `href="../ci.html?w=${encodeURIComponent(decodeURIComponent(w))}"`)
    .replace(/href="([^"\/:?]+?)\.html"/g, (m, w) => (w === 'index' ? m : `href="../ci.html?w=${encodeURIComponent(decodeURIComponent(w))}"`));
}

let n = 0;
for (const f of fs.readdirSync(CHAR_DIR)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(CHAR_DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = rewriteCharPage(before);
  if (after !== before) { fs.writeFileSync(p, after, 'utf8'); n += 1; }
}
console.log('char pages rewritten:', n);

let m2 = 0;
for (const f of fs.readdirSync(CI_DIR)) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(CI_DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = rewriteCiPage(before);
  if (after !== before) { fs.writeFileSync(p, after, 'utf8'); m2 += 1; }
}
console.log('word pages rewritten:', m2);
