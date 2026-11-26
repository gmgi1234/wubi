const fs = require('node:fs');
const p = 'D:/Users/10061/Downloads/wubi/practice.html';
let t = fs.readFileSync(p, 'utf8');
const needle = 'out += (ch.charCodeAt(0) >= 0xE000';
const i = t.indexOf(needle);
if (i < 0) { console.log('未找到'); process.exit(1); }
const lineEnd = t.indexOf('\n', i);
const crlfEnd = t.indexOf('\r\n', i);
const end = crlfEnd >= 0 && crlfEnd < lineEnd ? crlfEnd : lineEnd;
const oldLine = t.slice(i, end);
t = t.slice(0, i) + 'out += rootHtml(ch);' + t.slice(end);
fs.writeFileSync(p, t, 'utf8');
console.log('替换:', oldLine.trim().slice(0, 80), '→ out += rootHtml(ch);');
