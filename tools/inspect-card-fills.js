// Print the fill colours of each version's captured SVG in the generated page.
const fs = require('node:fs');
const t = fs.readFileSync(process.argv[2] || 'D:/Users/10061/Downloads/wubi/tools/compare/ge-v6.html', 'utf8');

const cards = [...t.matchAll(/<div class="vcard">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => m[1]);
cards.forEach((c, i) => {
  const tag = (c.match(/class="vtag">([^<]+)/) || [])[1];
  const fills = [...c.matchAll(/<path[^>]*fill="([^"]+)"/g)].map((m) => m[1]);
  console.log(i, tag, 'paths:', fills.length, '| fills:', fills.join(' '));
});

