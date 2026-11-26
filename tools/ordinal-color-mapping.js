// 着色改为「按颜色出现顺序」映射，避免字库起始色不是红色时错位
const fs = require('node:fs');

const helperNote = `// 颜色顺序映射：把字符里第 1/2/3/4 种出现的颜色对应到位置色`;

// ---------- 1) 练习页 ----------
const pp = 'D:/Users/10061/Downloads/wubi/practice.html';
let p = fs.readFileSync(pp, 'utf8');
const startP = p.indexOf('function recolorSvg(svg, start, k) {');
const endP = p.indexOf('function colorWholeSvg', startP);
if (startP > 0 && endP > startP) {
  const body = `function recolorSvg(svg, start, k) {
    var order = [];
    svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      if (u === '#555' || u === '#555555' || u === '#CFC8BD' || u === '#999999' || u === '#CCC') return m;
      if (order.indexOf(u) < 0) order.push(u);
      return m;
    });
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, function (m, f) {
      var u = f.toUpperCase();
      if (u === '#FFF' || u === '#FFFFFF') return m;
      if (u === '#555' || u === '#555555' || u === '#CFC8BD' || u === '#999999' || u === '#CCC') return 'fill="' + GRAY + '"';
      var idx = order.indexOf(u);
      if (idx >= 0 && idx < k) return 'fill="' + PALETTE[(start + idx) % 4] + '"';
      return 'fill="' + GRAY + '"';
    });
  }

  `;
  p = p.slice(0, startP) + body + p.slice(endP);
  fs.writeFileSync(pp, p, 'utf8');
  console.log('practice.html 已改');
}

// ---------- 2) 静态词组页 ----------
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');
const startS = s.indexOf('function recolor(');
const endS = s.indexOf('function colorWhole(', startS);
if (startS > 0 && endS > startS) {
  const body = `function recolor(svg, start, k) {
  const order = [];
  svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, f) => {
    const u = f.toUpperCase();
    if (['#FFF', '#555', '#555555', '#CFC8BD', '#999999', '#CCC'].includes(u)) return m;
    if (!order.includes(u)) order.push(u);
    return m;
  });
  return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, f) => {
    const u = f.toUpperCase();
    if (u === '#FFF') return m;
    if (['#555', '#555555', '#CFC8BD', '#999999', '#CCC'].includes(u)) return 'fill="GRAY"';
    const idx = order.indexOf(u);
    if (idx >= 0 && idx < k) return 'fill="' + PALETTE[(start + idx) % 4] + '"';
    return 'fill="GRAY"';
  });
}

`.replace(/'fill="GRAY"'/g, "`fill=\"${GRAY}\"`");
  s = s.slice(0, startS) + body + s.slice(endS);
  fs.writeFileSync(sp, s, 'utf8');
  console.log('build-static-ci.js 已改');
}

// ---------- 3) 动态渲染 ----------
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
const startR = r.indexOf('  function recolor(');
const endR = r.indexOf('  function colorWhole(', startR);
if (startR > 0 && endR > startR) {
  const body = `  function recolor(svg, start, k) {
    const order = [];
    svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, f) => {
      const u = f.toUpperCase();
      if (['#FFF', '#555', '#555555', '#CFC8BD', '#999999', '#CCC'].includes(u)) return m;
      if (!order.includes(u)) order.push(u);
      return m;
    });
    return svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/g, (m, f) => {
      const u = f.toUpperCase();
      if (u === '#FFF') return m;
      if (['#555', '#555555', '#CFC8BD', '#999999', '#CCC'].includes(u)) return \`fill="\${GRAY}"\`;
      const idx = order.indexOf(u);
      if (idx >= 0 && idx < k) return \`fill="\${PALETTE[(start + idx) % 4]}"\`;
      return \`fill="\${GRAY}"\`;
    });
  }

`;
  r = r.slice(0, startR) + body + r.slice(endR);
  fs.writeFileSync(rp, r, 'utf8');
  console.log('render.js 已改');
}
