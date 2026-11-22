// Extract the single big inline script of the wubi page into dist/app.js.
// Usage: node extract-script.js <html>
const fs = require('node:fs');
const path = require('node:path');

const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');

// locate the largest inline <script> ... </script> block
const blocks = [];
let start = -1;
for (let i = 0; i < lines.length; i += 1) {
  const t = lines[i].trim();
  if (t === '<script>') start = i;
  else if (t === '</script>' && start >= 0) {
    blocks.push({ start, end: i });
    start = -1;
  }
}
if (!blocks.length) { console.error('no inline script'); process.exit(1); }
const big = blocks.sort((a, b) => (b.end - b.start) - (a.end - a.start))[0];
console.log('block lines', big.start + 1, '..', big.end + 1, 'js lines', big.end - big.start - 1);

const dir = path.dirname(file);
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist', 'app.js'), lines.slice(big.start + 1, big.end).join('\n'), 'utf8');

const head = lines.slice(0, big.start);
const tail = lines.slice(big.end + 1);
const rebuilt = head.concat(['<script src="dist/app.js"></script>'], tail);
fs.writeFileSync(file, rebuilt.join('\n'), 'utf8');
console.log('rewrote', file, 'lines now', rebuilt.length);
