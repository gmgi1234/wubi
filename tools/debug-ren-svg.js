const fs = require('node:fs');
const raw = fs.readFileSync('D:/Users/10061/Downloads/wubi/svg/人-86.svg', 'utf8');
const inner = raw
  .replace(/<path[^>]*stroke="#c0392b"[^>]*\/>/g, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');
console.log('inner len:', inner.length);
const re = /<path([^>]*?)fill="(#[0-9A-Fa-f]{3,6})"([^>]*?)\/>/g;
const matches = [...inner.matchAll(re)];
console.log('matches:', matches.length);
const out = inner.replace(re, (m, pre, fill, post) => `<path${pre}fill="#27AE60"${post}/>`);
console.log('out len:', out.length);
console.log('first 200:', inner.slice(0, 200));
