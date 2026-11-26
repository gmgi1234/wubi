const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/data/chars/象.json';
if (!fs.existsSync(p)) { console.log('缺 data/chars/象.json'); process.exit(0); }
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
console.log('strokes:', (j.strokes || []).length, '| medians:', (j.medians || []).length, '| radStrokes:', (j.radStrokes || []).length);
const svg = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/象-06.svg', 'utf8');
console.log('svg path 数:', (svg.match(/<path/g) || []).length);
console.log('json 文件时间:', fs.statSync(p).mtime.toISOString());
console.log('svg 文件时间:', fs.statSync('D:/Users/10061/Downloads/wubi/svg/象-06.svg').mtime.toISOString());
