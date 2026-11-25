// 让静态/动态页改用 SVG sprite 引用复合字根（不再每页内联路径）
const fs = require('node:fs');

// 1) 静态生成器
const staticPath = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(staticPath, 'utf8');
if (!s.includes('frag-map.json')) {
  s = s.replace(
    "const glyphLib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), 'utf8'));",
    "const glyphLib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'root-glyphs.json'), 'utf8'));\nconst fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'frag-map.json'), 'utf8'));"
  );
  s = s.replace(
    /function fragIcon\(name, color, size = 20\) \{[\s\S]*?\n\}/,
    `function fragIcon(name, color, size = 20) {
  const i = fragMap[name];
  if (!isFrag(name) || i === undefined) return esc(name);
  return \`<svg class="frag" viewBox="0 0 1024 1024" width="\${size}" height="\${size}" style="color:\${color};vertical-align:-4px"><use href="../data/frag-sprite.svg#frag-\${i}"/></svg>\`;
}`
  );
  fs.writeFileSync(staticPath, s, 'utf8');
  console.log('static generator patched');
} else {
  console.log('static generator already patched');
}

// 2) 动态渲染器
const renderPath = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(renderPath, 'utf8');
if (!r.includes('frag-sprite.svg')) {
  r = r.replace(
    /  function rootHtml\(name, color, size\) \{[\s\S]*?\n  \}/,
    `  function rootHtml(name, color, size) {
    const map = window.FRAG_MAP || {};
    const i = map[name];
    if (isFragName(name) && i !== undefined) {
      const s = size || 20;
      return '<svg class="frag" viewBox="0 0 1024 1024" width="' + s + '" height="' + s + '" style="color:' + color + ';vertical-align:-4px"><use href="data/frag-sprite.svg#frag-' + i + '"/></svg>';
    }
    return esc(name);
  }`
  );
  fs.writeFileSync(renderPath, r, 'utf8');
  console.log('render.js patched');
} else {
  console.log('render.js already patched');
}
