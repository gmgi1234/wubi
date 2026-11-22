// Batch 1 of the special-case refactor: move the first five inline blocks
// (巫/婁/嗇/垂/噩) into a rule table, byte-identical bodies, dispatched in the
// same order. Writes src/app.js in place after saving a .bak.
const fs = require('node:fs');

const FILE = 'D:/Users/10061/Downloads/wubi/src/app.js';
const src = fs.readFileSync(FILE, 'utf8');
fs.writeFileSync(FILE + '.bak-batch1', src, 'utf8');
const lines = src.split('\n');

// 1-based inclusive ranges, verified by the banner comments
const blocks = [
  { name: '巫（含巫部件）', from: 1140, to: 1159 },
  { name: '婁（含婁部件）', from: 1161, to: 1184 },
  { name: '嗇', from: 1186, to: 1217 },
  { name: '垂', from: 1219, to: 1234 },
  { name: '噩', from: 1236, to: 1259 },
];

for (const b of blocks) {
  const head = lines[b.from - 1] || '';
  if (!head.includes('=====')) throw new Error(`unexpected start at ${b.from}: ${head}`);
}

const tableDefs = [];
tableDefs.push('/* ================================================================== */');
tableDefs.push('/* 非连续字根：特殊规则表                                              */');
tableDefs.push('/* 每条规则的判断与计算与原先内联的 if 块逐字一致，行为等价。            */');
tableDefs.push('/* ================================================================== */');
tableDefs.push('const SPECIAL_CASES = [];');
tableDefs.push('function defineSpecialCase(name, apply) {');
tableDefs.push('    SPECIAL_CASES.push({ name, apply });');
tableDefs.push('}');
tableDefs.push('');

for (const b of blocks) {
  const body = lines.slice(b.from - 1, b.to);
  tableDefs.push(`defineSpecialCase('${b.name}', function ({ currentChar, roots, n, strokeOffset, r, supIndices, isEmbedded }) {`);
  tableDefs.push(...body);
  tableDefs.push('    return null;');
  tableDefs.push('});');
  tableDefs.push('');
}

// replace the inline region with the dispatcher (keep the region after 噩)
const dispatcher = [
  '    // 特殊规则表：按原顺序逐条尝试，命中即返回（行为与原内联 if 链一致）',
  '    for (const rule of SPECIAL_CASES) {',
  '        const hit = rule.apply({ currentChar, roots, n, strokeOffset, r, supIndices, isEmbedded });',
  '        if (hit) return hit;',
  '    }',
];

const before = lines.slice(0, blocks[0].from - 1);
const after = lines.slice(blocks[blocks.length - 1].to);
let out = before.concat(dispatcher, after);

// insert the table right before autoDetectNonContinuous
const fnIndex = out.findIndex((l) => l.startsWith('function autoDetectNonContinuous('));
if (fnIndex < 0) throw new Error('function not found');
out = out.slice(0, fnIndex).concat(tableDefs, out.slice(fnIndex));

fs.writeFileSync(FILE, out.join('\n'), 'utf8');
console.log('rules:', blocks.length, 'lines before', lines.length, 'after', out.length);
