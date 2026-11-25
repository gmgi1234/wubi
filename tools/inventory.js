// Inventory: stroke files vs 86 codes vs Rime dictionary.
const fs = require('node:fs');
const path = require('node:path');

const W = 'D:/Users/10061/Downloads/wubi';
const tables = JSON.parse(fs.readFileSync(`${W}/tools/tables.json`, 'utf8'));
const coded = new Set(Object.keys(tables.v86));

const strokeFiles = fs.readdirSync(path.join(W, 'data', 'chars'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5));
const strokeSet = new Set(strokeFiles);

// Rime dictionary: lines like "字\t编码"
const dictPath = 'D:/Users/10061/Downloads/Hermes/五笔码表/86/wubi.dict.yaml';
let rimeChars = new Set();
let rimeLines = 0;
if (fs.existsSync(dictPath)) {
  const text = fs.readFileSync(dictPath, 'utf8');
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const ch = parts[0].trim();
    const code = parts[1].trim();
    if (!/^[a-z]{1,4}$/i.test(code)) continue;
    if ([...ch].length === 1) { rimeChars.add(ch); rimeLines += 1; }
  }
}

const noCode = strokeFiles.filter((c) => !coded.has(c));
const noStroke = [...coded].filter((c) => !strokeSet.has(c));
const bothMissing = noCode.filter((c) => rimeChars.has(c));

console.log('笔画文件:', strokeFiles.length);
console.log('已编码(86):', coded.size);
console.log('有笔画但无编码:', noCode.length);
console.log('有编码但无笔画:', noStroke.length);
console.log('Rime 码表条目:', rimeChars.size, '行:', rimeLines);
console.log('无编码 且 Rime 有码:', bothMissing.length);
console.log('\n样例（有笔画无编码，且 Rime 有码）:', bothMissing.slice(0, 30).join(''));
console.log('\n样例（有笔画无编码，Rime 也无码）:', noCode.filter((c) => !rimeChars.has(c)).slice(0, 30).join(''));
