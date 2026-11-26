// 恢复「成字字根占两码时，第二个字根用虚线框」的规则（词组页 + 练习页）
const fs = require('node:fs');

// ---------- 1) 静态词组页生成器 ----------
const sp = 'D:/Users/10061/Downloads/wubi/tools/build-static-ci.js';
let s = fs.readFileSync(sp, 'utf8');
s = s.replace(
  "        return isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci));",
  "        if (isKey && cntOf(ci) >= 2) return colorWhole(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]);\n        return isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci));"
);
fs.writeFileSync(sp, s, 'utf8');
console.log('静态生成器已恢复虚线:', s.includes('PALETTE[(p + 1) % 4]'));

// ---------- 2) 动态词组页 ----------
const rp = 'D:/Users/10061/Downloads/wubi/data/render.js';
let r = fs.readFileSync(rp, 'utf8');
r = r.replace(
  "          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci)), 96);",
  "          if (isKey && cntOf(ci) >= 2) return svgWrap(colorWhole(g, PALETTE[p % 4], PALETTE[(p + 1) % 4]), 96);\n          return svgWrap(isKey ? colorWhole(g, PALETTE[p % 4], null) : recolor(g, p, cntOf(ci)), 96);"
);
fs.writeFileSync(rp, r, 'utf8');
console.log('动态渲染器已恢复虚线:', r.includes('PALETTE[(p + 1) % 4]'));
