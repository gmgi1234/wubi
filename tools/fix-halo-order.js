// 修正：键名字整字虚线框时，白色描边要先画，否则会盖住填充色
const fs = require('node:fs');

function fix(file, kind) {
  let t = fs.readFileSync(file, 'utf8');
  const oldBlock = /      const extra = inner\.replace\([\s\S]*?\n      \);\n      return out \+ extra;/;
  const newBlock = `      const halo = inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
        const f = fill.toUpperCase();
        if (f === '#FFF' || f === '#FFFFFF') return '';
        const dMatch = (pre + post).match(/d="([^"]*)"/);
        return dMatch ? \`<path d="\${dMatch[1]}" fill="none" stroke="#ffffff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>\` : '';
      });
      const dash = inner.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
        const f = fill.toUpperCase();
        if (f === '#FFF' || f === '#FFFFFF') return '';
        const dMatch = (pre + post).match(/d="([^"]*)"/);
        return dMatch ? \`<path d="\${dMatch[1]}" fill="none" stroke="\${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>\` : '';
      });
      return halo + out + dash;`;

  if (oldBlock.test(t)) {
    t = t.replace(oldBlock, newBlock);
    fs.writeFileSync(file, t, 'utf8');
    console.log(file, 'fixed');
  } else {
    console.log(file, 'pattern not found');
  }
}

fix('D:/Users/10061/Downloads/wubi/data/render.js');

// 静态生成器里的缩进是两个空格
let s = fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', 'utf8');
const oldStatic = /    const extra = svg\.replace\([\s\S]*?\n    \);\n    return out \+ extra;/;
const newStatic = `    const halo = svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      const dMatch = (pre + post).match(/d="([^"]*)"/);
      return dMatch ? \`<path d="\${dMatch[1]}" fill="none" stroke="#ffffff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>\` : '';
    });
    const dash = svg.replace(/<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\\/>/g, (m, pre, fill, post) => {
      const f = fill.toUpperCase();
      if (f === '#FFF' || f === '#FFFFFF') return '';
      const dMatch = (pre + post).match(/d="([^"]*)"/);
      return dMatch ? \`<path d="\${dMatch[1]}" fill="none" stroke="\${nextColor}" stroke-width="12" stroke-dasharray="26 16" stroke-linejoin="round" stroke-linecap="round"/>\` : '';
    });
    return halo + out + dash;`;
if (oldStatic.test(s)) {
  s = s.replace(oldStatic, newStatic);
  fs.writeFileSync('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', s, 'utf8');
  console.log('static builder fixed');
} else {
  console.log('static builder pattern not found');
}
