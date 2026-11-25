// 统计单字规模：数据、静态页、动态页、主站字表
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/Users/10061/Downloads/wubi';

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));
const both = Object.keys(tables.v86).filter((c) => tables.v86[c] && tables.v86[c].c && tables.v06[c] && tables.v06[c].c);
const only86 = Object.keys(tables.v86).filter((c) => tables.v86[c] && tables.v86[c].c);

const charIdx = fs.readFileSync(path.join(ROOT, 'data', 'char-idx.js'), 'utf8').match(/=(\[[\s\S]*\]);?$/);
const idxCount = charIdx ? JSON.parse(charIdx[1]).length : 0;

const staticPages = fs.readdirSync(path.join(ROOT, 'char')).filter((f) => f.endsWith('.html') && f !== 'index.html').length;

// 主站字表
let hanziAll = 0;
const p = path.join(ROOT, 'data', 'hanzi_all_chars.js');
if (fs.existsSync(p)) {
  const m = fs.readFileSync(p, 'utf8').match(/\[([\s\S]*)\]/);
  if (m) hanziAll = (m[1].match(/"|'/g) || []).length / 2;
}

console.log('86 版有编码的字:', only86.length);
console.log('86 + 新世纪 都有编码的字:', both.length);
console.log('动态单字数据 char-idx:', idxCount);
console.log('静态单字页:', staticPages);
console.log('主站 hanzi_all_chars 数量约:', Math.round(hanziAll));
