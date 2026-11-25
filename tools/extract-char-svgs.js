// Extract the three coloured glyph SVGs from each generated character page
// and save them as standalone files: site/svg/<char>-86.svg / -98.svg / -06.svg
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR_DIR = path.join(ROOT, 'site', 'char');
const SVG_DIR = path.join(ROOT, 'site', 'svg');
fs.mkdirSync(SVG_DIR, { recursive: true });

const files = fs.readdirSync(CHAR_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html');
let chars = 0;
let svgs = 0;

for (const f of files) {
  const ch = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(CHAR_DIR, f), 'utf8');
  const cards = [...html.matchAll(/<div class="vcard">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => m[1]);
  const vers = ['86', '98', '06'];
  cards.forEach((cardHtml, i) => {
    const m = cardHtml.match(/<svg viewBox="0 0 1024 1024"[\s\S]*?<\/svg>/);
    if (!m) return;
    const raw = m[0];
    const svg = raw.replace(/<svg([^>]*)>/, (all, attrs) => {
      const clean = attrs.replace(/\s*xmlns="[^"]*"/g, '');
      return '<svg xmlns="http://www.w3.org/2000/svg"' + clean + '>';
    });
    fs.writeFileSync(path.join(SVG_DIR, `${ch}-${vers[i]}.svg`), svg, 'utf8');
    svgs += 1;
  });
  chars += 1;
  if (chars % 2000 === 0) console.log(chars, 'chars');
}

console.log('chars:', chars, 'svgs:', svgs);
