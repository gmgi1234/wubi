const fs = require('node:fs');
const html = fs.readFileSync('D:/Users/10061/Downloads/wubi/practice.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
console.log('内联脚本数:', scripts.length);
scripts.forEach((s, i) => {
  try {
    new Function(s);
    console.log('脚本', i, '语法 OK, 长度', s.length);
  } catch (e) {
    console.log('脚本', i, '语法错误:', e.message);
    const lines = s.split('\n');
    for (let k = 0; k < lines.length; k++) {
      if (lines[k].includes('dataset.cheng') || lines[k].includes('dashOnSecondRoot')) {
        console.log('附近行', k + 1, ':', lines.slice(Math.max(0, k - 3), k + 4).join('\n'));
        break;
      }
    }
  }
});
