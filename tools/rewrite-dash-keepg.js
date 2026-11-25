// 重写键名字整字虚线框：保持原 SVG 结构（含 g 变换），只把填充路径换成虚线描边
const fs = require('node:fs');

function buildBlock(varName, pad) {
  return `${pad}const dashSrc = ${varName}.replace(/<rect[^>]*>/g, '');
${pad}const dash = dashSrc.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
${pad}  const f = fill.toUpperCase();
${pad}  if (f === '#FFF' || f === '#FFFFFF') return '';
${pad}  const dMatch = (pre + post).match(/d="([^"]*)"/);
${pad}  if (!dMatch) return '';
${pad}  return \`<path d="\${dMatch[1]}" fill="none" stroke="\${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>\`;
${pad}});
${pad}return out + dash;`;
}

function rewrite(file, varName, indent) {
  let t = fs.readFileSync(file, 'utf8');
  const start = t.indexOf('const halo = ');
  const altStart = start >= 0 ? start : t.indexOf('const dash = ');
  if (altStart < 0) { console.log(file, 'block not found'); return; }
  const marker = 'return out + dash;';
  const end = t.indexOf(marker, altStart);
  if (end < 0) { console.log(file, 'end not found'); return; }
  const pad = ' '.repeat(indent);
  t = t.slice(0, altStart) + buildBlock(varName, pad) + t.slice(end + marker.length);
  fs.writeFileSync(file, t, 'utf8');
  console.log(file, 'rewritten');
}

rewrite('D:/Users/10061/Downloads/wubi/data/render.js', 'inner', 6);
rewrite('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', 'svg', 4);
