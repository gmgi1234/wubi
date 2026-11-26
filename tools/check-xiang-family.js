const fs = require('node:fs');
for (const ch of ['象', '像', '橡', '蟓', '豫']) {
  const j = JSON.parse(fs.readFileSync(`D:/Users/10061/Downloads/wubi/data/chars/${ch}.json`, 'utf8'));
  const svg = fs.readFileSync(`D:/Users/10061/Downloads/wubi/svg/${ch}-86.svg`, 'utf8');
  const paths = (svg.match(/<path/g) || []).length;
  const dash = (svg.match(/stroke="#c0392b"/g) || []).length;
  console.log(ch, '| json 笔画:', (j.strokes || []).length, '| svg path:', paths, '| 虚线:', dash, '| 实际笔画:', paths - dash);
}
