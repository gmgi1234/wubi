// Re-add a 翰 rule after the stroke data was put into standard order.
// The mapping is now just "each root takes its own stroke count in sequence",
// so no per-stroke hand alignment is needed.
const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/src/app.js';
let src = fs.readFileSync(p, 'utf8');

if (src.includes("defineSpecialCase('翰'")) throw new Error('rule already present');

const rule = `defineSpecialCase('翰', function ({ currentChar, roots, n, strokeOffset }) {
    // 数据已按标准笔顺重排：龺(8) → 人(2) → 羽(6)，人 的两笔相邻。
    // 所以这里只需按字根笔画数顺序分配，不再逐笔手写。
    if (currentChar !== '翰' || n !== 16) return null;
    if (roots.length === 4 && roots[0] === '十' && roots[1] === '早' && roots[2] === '人' && roots[3] === '羽') {
        const counts = [2, 6, 2, 6];
        return spread(counts, strokeOffset);
    }
    if (roots.length === 5 && roots[0] === '十' && roots[1] === '曰' && roots[2] === '十' && roots[3] === '人' && roots[4] === '羽') {
        const counts = [2, 4, 2, 2, 6];
        return spread(counts, strokeOffset);
    }
    return null;
});

function spread(counts, offset) {
    const out = [];
    counts.forEach((count, rootIndex) => {
        for (let i = 0; i < count; i += 1) out.push(offset + rootIndex);
    });
    return out;
}

`;

const marker = 'function autoDetectNonContinuous(';
const idx = src.indexOf(marker);
if (idx < 0) throw new Error('marker missing');
src = src.slice(0, idx) + rule + src.slice(idx);
fs.writeFileSync(p, src, 'utf8');
console.log('rule inserted');
