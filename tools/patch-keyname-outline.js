// 键名字（人、水、木…）在词组里占两码时，整字要带虚线框
const fs = require('node:fs');

function patch(file, isTemplate) {
  let t = fs.readFileSync(file, 'utf8');
  if (t.includes('matchedSecondary')) { console.log(file, 'already patched'); return; }

  if (isTemplate) {
    // data/render.js 里的 colorWhole
    t = t.replace(
      "  function colorWhole(inner, color, nextColor) {\n    return inner.replace(",
      "  function colorWhole(inner, color, nextColor) {\n    let matchedSecondary = false;\n    const out = inner.replace("
    );
    t = t.replace(
      "      if (nextColor && f === '#FF9800') {\n        return base",
      "      if (nextColor && f === '#FF9800') {\n        matchedSecondary = true;\n        return base"
    );
    // 找到函数结尾（return base; 后的 }\n  }），补上兜底
    t = t.replace(
      "      return base;\n    });\n  }",
      "      return base;\n    });\n    if (nextColor && !matchedSecondary) {\n      const extra = inner.replace(/<path([^>]*?)fill=\"(#[0-9A-Fa-f]{3,6})\"([^>]*?)\\/>/g, (m, pre, fill, post) => {\n        const f = fill.toUpperCase();\n        if (f === '#FFF' || f === '#FFFFFF') return '';\n        const dMatch = (pre + post).match(/d=\"([^\"]*)\"/);\n        if (!dMatch) return '';\n        return `<path d=\"${dMatch[1]}\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"26\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"${dMatch[1]}\" fill=\"none\" stroke=\"${nextColor}\" stroke-width=\"12\" stroke-dasharray=\"26 16\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>`;\n      });\n      return out + extra;\n    }\n    return out;\n  }"
    );
  } else {
    // tools/build-static-ci.js 里的 colorWhole
    t = t.replace(
      "function colorWhole(svg, color, nextColor) {\n  if (!svg) return '';\n  return svg.replace(",
      "function colorWhole(svg, color, nextColor) {\n  if (!svg) return '';\n  let matchedSecondary = false;\n  const out = svg.replace("
    );
    t = t.replace(
      "    if (nextColor && f === '#FF9800') {\n      return base",
      "    if (nextColor && f === '#FF9800') {\n      matchedSecondary = true;\n      return base"
    );
    t = t.replace(
      "    return base;\n  });\n}",
      "    return base;\n  });\n  if (nextColor && !matchedSecondary) {\n    const extra = svg.replace(/<path([^>]*?)fill=\"(#[0-9A-Fa-f]{3,6})\"([^>]*?)\\/>/g, (m, pre, fill, post) => {\n      const f = fill.toUpperCase();\n      if (f === '#FFF' || f === '#FFFFFF') return '';\n      const dMatch = (pre + post).match(/d=\"([^\"]*)\"/);\n      if (!dMatch) return '';\n      return `<path d=\"${dMatch[1]}\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"26\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"${dMatch[1]}\" fill=\"none\" stroke=\"${nextColor}\" stroke-width=\"12\" stroke-dasharray=\"26 16\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>`;\n    });\n    return out + extra;\n  }\n  return out;\n}"
    );
  }
  fs.writeFileSync(file, t, 'utf8');
  console.log(file, 'patched:', t.includes('matchedSecondary'));
}

patch('D:/Users/10061/Downloads/wubi/data/render.js', true);
patch('D:/Users/10061/Downloads/wubi/tools/build-static-ci.js', false);
