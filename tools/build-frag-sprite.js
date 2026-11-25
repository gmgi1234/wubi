// 把 94 个复合字根做成一个 SVG sprite（字形只存一份，页面用 <use> 引用）
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), 'utf8'));

const names = Object.keys(lib).sort();
const map = {};
const symbols = names.map((name, i) => {
  map[name] = i;
  const g = lib[name];
  const paths = g.paths.map((d) => `<path d="${d}" fill="currentColor"/>`).join('');
  return `<symbol id="frag-${i}" viewBox="0 0 1024 1024"><g transform="translate(0,900) scale(1,-1)"><g transform="translate(512,512) scale(${g.scale}) translate(${-g.cx},${-g.cy})">${paths}</g></g></symbol>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;
fs.writeFileSync(path.join(ROOT, 'data', 'frag-sprite.svg'), svg, 'utf8');
fs.writeFileSync(path.join(ROOT, 'data', 'frag-map.js'), 'window.FRAG_MAP=' + JSON.stringify(map) + ';', 'utf8');
fs.writeFileSync(path.join(ROOT, 'tools', 'frag-map.json'), JSON.stringify(map), 'utf8');

const kb = (n) => Math.round(n / 1024) + ' KB';
console.log('symbols:', names.length);
console.log('sprite:', kb(fs.statSync(path.join(ROOT, 'data', 'frag-sprite.svg')).size));
console.log('map:', kb(fs.statSync(path.join(ROOT, 'data', 'frag-map.js')).size));
