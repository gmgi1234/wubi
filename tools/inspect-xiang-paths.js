const fs = require('node:fs');
const t = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/象-86.svg', 'utf8');
const paths = [...t.matchAll(/<path[^>]*>/g)].map((m) => m[0]);
paths.forEach((p, i) => {
  const idx = (p.match(/data-stroke-index="(\d+)"/) || [])[1];
  const fill = (p.match(/fill="([^"]*)"/) || [])[1];
  console.log(i, 'index:', idx, 'fill:', fill, '| d 开头:', (p.match(/d="([^"]{0,24})/) || [])[1]);
});
