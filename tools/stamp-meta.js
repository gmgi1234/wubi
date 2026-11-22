// Prepend (or refresh) a metadata header on a harness dump.
// Usage: node stamp-meta.js <dump.ndjson> <source-html> [note]
const fs = require('node:fs');

const file = process.argv[2];
const source = process.argv[3] || '';
const note = process.argv[4] || '现状快照，不代表正确。对拍只用于发现变化，不用于判定对错。';

const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.includes('"_meta"'));
const chars = lines.length;
const meta = {
  _meta: {
    file: file.replace(/\\/g, '/').split('/').pop(),
    source,
    chars,
    capturedAt: new Date().toISOString(),
    note,
    scope: '笔画数、每笔归属的字根、字根序列、86 版编码',
  },
};
fs.writeFileSync(file, JSON.stringify(meta) + '\n' + lines.join('\n') + '\n', 'utf8');
console.log('stamped', chars, 'records');
