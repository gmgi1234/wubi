const fs = require('node:fs');
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/data/practice-2.js', 'utf8');
const start = raw.indexOf('[');
const end = raw.lastIndexOf(']');
const arr = JSON.parse(raw.slice(start, end + 1));
const s = arr.find((r) => r[0] === '山上') || arr[0];
console.log('样例:', JSON.stringify(s));
console.log('字段数:', s.length, '| 带 key 标记:', typeof s[7] === 'string' ? s[7] : '无');
