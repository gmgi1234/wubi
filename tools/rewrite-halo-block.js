// 稳健重写：把整字描边拆成「先白后虚线」，避免白色描边盖住填充
const fs = require('node:fs');

function rewrite(file, varName, indent) {
  let t = fs.readFileSync(file, 'utf8');
  const startIdx = t.indexOf('const extra = ' + varName + '.replace(');
  if (startIdx < 0) { console.log(file, 'no block'); return; }
  const endMarker = 'return out + extra;';
  const endIdx = t.indexOf(endMarker, startIdx);
  if (endIdx < 0) { console.log(file, 'no end'); return; }

  const pad = ' '.repeat(indent);
  const mk = (stroke, width, extraAttrs) => `${pad}const ${stroke === 'halo' ? 'halo' : 'dash'} = ${varName}.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
${pad}  const f = fill.toUpperCase();
${pad}  if (f === '#FFF' || f === '#FFFFFF') return '';
${pad}  const dMatch = (pre + post).match(/d="([^"]*)"/);
${pad}  if (!dMatch) return '';
${pad}  return \`<path d="\${dMatch[1]}" fill="none" stroke="${{ halo: '#ffffff', dash: '\\${nextColor}' }[stroke]}" stroke-width="${width}" ${extraAttrs} stroke-linejoin="round" stroke-linecap="round"/>\`;
${pad}});`;

  const block = mk('halo', 26, '') + '\n' + mk('dash', 12, 'stroke-dasharray="26 16"') + '\n' + pad + 'return halo + out + dash;';
  t = t.slice(0, startIdx) + block + t.slice(endIdx + endMarker.length);
  fs.writeFileSync(file, t, 'utf8');
  console.log(file, 'rewritten');
}

rewrite('D:/Users/10061/Downloads/wubi/data/render.js', 'inner', 6);
rewrite('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', 'svg', 4);
