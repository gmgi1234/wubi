// SVG路径坐标偏移（与HTML中 shiftPathX/shiftPathY 一致）
function shiftPathX(pathStr, dx) {
    return pathStr.replace(/([MLCQHVSmlcqhvs])([^MLCQHVSZmlcqhvsz]*)/g, (match, cmd, params) => {
        const isRelative = cmd === cmd.toLowerCase() && cmd !== cmd.toUpperCase();
        if (isRelative) return match;
        const nums = params.trim().split(/[\s,]+/).filter(s => s.length > 0).map(Number);
        if (nums.length === 0) return match;
        const cmdUpper = cmd.toUpperCase();
        if (cmdUpper === 'V') return match;
        if (cmdUpper === 'H') { nums[0] += dx; return cmd + ' ' + nums.map(n => n.toFixed(2)).join(' '); }
        for (let i = 0; i < nums.length; i += 2) nums[i] += dx;
        return cmd + ' ' + nums.map(n => n.toFixed(2)).join(' ');
    });
}

function shiftPathY(pathStr, dy) {
    return pathStr.replace(/([MLCQHVSmlcqhvs])([^MLCQHVSZmlcqhvsz]*)/g, (match, cmd, params) => {
        const isRelative = cmd === cmd.toLowerCase() && cmd !== cmd.toUpperCase();
        if (isRelative) return match;
        const nums = params.trim().split(/[\s,]+/).filter(s => s.length > 0).map(Number);
        if (nums.length === 0) return match;
        const cmdUpper = cmd.toUpperCase();
        if (cmdUpper === 'H') return match;
        if (cmdUpper === 'V') { nums[0] += dy; return cmd + ' ' + nums.map(n => n.toFixed(2)).join(' '); }
        for (let i = 1; i < nums.length; i += 2) nums[i] += dy;
        return cmd + ' ' + nums.map(n => n.toFixed(2)).join(' ');
    });
}

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function readJSON(char) {
    const p = path.join(DATA_DIR, char + '.json');
    if (!fs.existsSync(p)) { console.error('  [缺失] ' + p); return null; }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(char, data) {
    const p = path.join(DATA_DIR, char + '.json');
    fs.writeFileSync(p, JSON.stringify(data), 'utf8');
    console.log('  [已生成] ' + p + ' (' + data.strokes.length + '笔)');
}

// ========== 1. 替换字：笔划数据错误的，用其它字修复 ==========
console.log('\n=== 修复替换字 ===');

// 溦 = 氵(3笔) + 微右侧(10笔)
(function() {
    const own = readJSON('溦');
    const wei = readJSON('微');
    if (!own || !wei) return;
    const strokes = [...own.strokes.slice(0, 3), ...wei.strokes.slice(3)];
    writeJSON('溦', { strokes, radStrokes: [] });
})();

// 叀 = 專前6笔(shiftY -60) + 县厶2笔(shiftY 55)
(function() {
    const zhuan = readJSON('專');
    const xian = readJSON('县');
    if (!zhuan || !xian) return;
    const strokes = [
        ...zhuan.strokes.slice(0, 6).map(s => shiftPathY(s, -60)),
        ...xian.strokes.slice(5).map(s => shiftPathY(s, 55))
    ];
    writeJSON('叀', { strokes, radStrokes: [] });
})();

// 鶻 = 骯前10笔(冎右+月) + 鴨第6-16笔(鳥)
(function() {
    const ang = readJSON('骯');
    const ya = readJSON('鴨');
    if (!ang || !ya) return;
    const strokes = [...ang.strokes.slice(0, 10), ...ya.strokes.slice(5, 16)];
    writeJSON('鶻', { strokes, radStrokes: [] });
})();

// 髕 = 骯前10笔(骨) + 嬪賓14笔(shiftX 60)
(function() {
    const ang = readJSON('骯');
    const pin = readJSON('嬪');
    if (!ang || !pin) return;
    const strokes = [
        ...ang.strokes.slice(0, 10),
        ...pin.strokes.slice(3).map(s => shiftPathX(s, 60))
    ];
    writeJSON('髕', { strokes, radStrokes: [] });
})();

// 嘜 = 口(3笔) + 麴麥前11笔(shiftX 200)
(function() {
    const own = readJSON('嘜');
    const qu = readJSON('麴');
    if (!own || !qu) return;
    const strokes = [
        ...own.strokes.slice(0, 3),
        ...qu.strokes.slice(0, 11).map(s => shiftPathX(s, 200))
    ];
    writeJSON('嘜', { strokes, radStrokes: [] });
})();

// 鯗 = 养前7笔(shiftX 15, shiftY 60) + 自身底部
(function() {
    const own = readJSON('鯗');
    const yang = readJSON('养');
    if (!own || !yang) return;
    const strokes = [
        ...yang.strokes.slice(0, 7).map(s => shiftPathX(shiftPathY(s, 60), 15)),
        ...own.strokes.slice(8)
    ];
    writeJSON('鯗', { strokes, radStrokes: [] });
})();

// ========== 2. 父字提取：无CDN数据的，从父字切片 ==========
console.log('\n=== 生成父字提取字 ===');

const STROKE_SOURCES = {
    '㝉': { parent: '伫', offset: 2, count: 4 },
    '𣬉': { parent: '蓖', offset: 3, count: 10 },
    '𠃓': { parent: '汤', offset: 3, count: 3 },
    '𢀖': { parent: '经', offset: 3, count: 5 },
    '𠬤': { parent: '泽', offset: 3, count: 5 },
    '㣊': { parent: '修', offset: 3, count: 6 },
    '䏌': { parent: '佾', offset: 2, count: 6 },
    '𠬶': { parent: '浸', offset: 3 },
    '牜': { parent: '牧', offset: 0, count: 4 },
    '𧾷': { parent: '跑', offset: 0, count: 7 },
    '⻊': { parent: '跑', offset: 0, count: 7 },
    '': { parent: '卷', offset: 0, count: 6 },
    '': { parent: '跑', offset: 0, count: 7 },
    '龸': { parent: '学', offset: 0, count: 5 },
    '': { parent: '学', offset: 0, count: 5 },
    '龺': { parent: '朝', offset: 0, count: 8 },
    '𠦝': { parent: '朝', offset: 0, count: 8 },
    '晞': { parts: [{ parent: '晒', offset: 0, count: 4 }, { parent: '稀', offset: 5, count: 7 }] },
    '焜': { parts: [{ parent: '烤', offset: 0, count: 4, yOffset: -30 }, { parent: '馄', offset: 3, count: 8, yOffset: 30 }] },
};

for (const [char, src] of Object.entries(STROKE_SOURCES)) {
    if (!char) continue;
    if (src.parts) {
        const allStrokes = [];
        for (const part of src.parts) {
            const parentData = readJSON(part.parent);
            if (!parentData) { console.error('  [失败] ' + char + ': 缺少父字 ' + part.parent); continue; }
            const start = part.offset;
            const end = part.count ? start + part.count : parentData.strokes.length;
            let partStrokes = parentData.strokes.slice(start, end);
            if (part.yOffset) partStrokes = partStrokes.map(s => shiftPathY(s, part.yOffset));
            allStrokes.push(...partStrokes);
        }
        writeJSON(char, { strokes: allStrokes, radStrokes: [] });
    } else {
        const parentData = readJSON(src.parent);
        if (!parentData) { console.error('  [失败] ' + char + ': 缺少父字 ' + src.parent); continue; }
        const start = src.offset;
        const end = src.count ? start + src.count : parentData.strokes.length;
        const strokes = parentData.strokes.slice(start, end);
        writeJSON(char, { strokes, radStrokes: [] });
    }
}

console.log('\n=== 全部完成 ===');
