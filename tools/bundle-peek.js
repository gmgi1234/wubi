// Show how one character is stored inside data/stroke-bundle.js
const fs = require('node:fs');

const ch = process.argv[2] || '翰';
const file = 'D:/Users/10061/Downloads/wubi/data/stroke-bundle.js';
const fd = fs.openSync(file, 'r');
const size = fs.fstatSync(fd).size;
const chunk = 8 * 1024 * 1024;
const buf = Buffer.alloc(chunk);
let off = 0;
let carry = '';
const needle = `"${ch}"`;
while (off < size) {
  const n = fs.readSync(fd, buf, 0, chunk, off);
  const s = carry + buf.subarray(0, n).toString('utf8');
  const i = s.indexOf(needle);
  if (i >= 0) {
    console.log('offset', off - carry.length + i);
    console.log(s.slice(i - 40, i + 420));
    process.exit(0);
  }
  carry = s.slice(-64);
  off += n;
}
console.log('not found');
