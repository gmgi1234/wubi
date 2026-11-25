// 裁剪静态页：单字保留前 2000，词组保留前 5000；其余交给动态页
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const ranking = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-ranking.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'));

const keepChars = ranking.slice(0, 2000);
const keepWords = words.slice(0, 5000).map((x) => x.w);
fs.writeFileSync(path.join(ROOT, 'tools', 'keep-chars.json'), JSON.stringify(keepChars), 'utf8');
fs.writeFileSync(path.join(ROOT, 'tools', 'keep-words.json'), JSON.stringify(keepWords), 'utf8');
console.log('keep chars:', keepChars.length, '| keep words:', keepWords.length);

const charDir = path.join(ROOT, 'site', 'char');
const ciDir = path.join(ROOT, 'site', 'ci');
const keepCharSet = new Set(keepChars.map((c) => `${c}.html`));
const keepWordSet = new Set(keepWords.map((w) => `${w}.html`));

let removedChars = 0;
for (const f of fs.readdirSync(charDir)) {
  if (f.endsWith('.html') && f !== 'index.html' && !keepCharSet.has(f)) {
    fs.unlinkSync(path.join(charDir, f));
    removedChars += 1;
  }
}
let removedWords = 0;
for (const f of fs.readdirSync(ciDir)) {
  if (f.endsWith('.html') && f !== 'index.html' && !keepWordSet.has(f)) {
    fs.unlinkSync(path.join(ciDir, f));
    removedWords += 1;
  }
}
console.log('removed char pages:', removedChars, '| removed word pages:', removedWords);
console.log('remaining chars:', fs.readdirSync(charDir).filter((f) => f.endsWith('.html')).length);
console.log('remaining words:', fs.readdirSync(ciDir).filter((f) => f.endsWith('.html')).length);
