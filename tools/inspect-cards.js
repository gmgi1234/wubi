// Inspect the three version cards in the generated page: codes, split text, chip colours.
const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/compare/ge-v6.html', 'utf8');

const cards = [...t.matchAll(/<div class="vcard">([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => m[1]);
console.log('cards found:', cards.length);
cards.forEach((c, i) => {
  const tag = (c.match(/class="vtag">([^<]+)/) || [])[1];
  const code = (c.match(/class="vcode">([^<]+)/) || [])[1];
  const split = (c.match(/class="vsplit">([^<]+)/) || [])[1];
  const chips = [...c.matchAll(/class="chip"><i style="background:([^"]+)"><\/i>(?:[\s\S]*?)<\/span>/g)]
    .map((m) => m[1]);
  const names = [...c.matchAll(/class="chip">[\s\S]*?<\/svg>|class="chip"><i[^>]*><\/i>/g)].length;
  console.log(i, tag, code, split, '| chip colors:', chips.join(' '));
});
