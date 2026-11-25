// 恢复：模板回到「拆分 · 词典」，词典里词组带编码、单字只放编码
const fs = require('node:fs');

// 1) 模板恢复
const cfg = 'D:/Users/10061/Downloads/wubi/qingfeng/WindInput/config.toml';
let c = fs.readFileSync(cfg, 'utf8');
const cur = 'text = "${code_rev} · ${chaizi}{ · ${dict:ci_chaifen}}"';
const back = 'text = "${chaizi}{ · ${dict:ci_chaifen}}"';
if (c.includes(cur)) {
  c = c.replace(cur, back);
  fs.writeFileSync(cfg, c, 'utf8');
  console.log('模板已恢复:', back);
}

// 2) 词典：词组「根 根 根 根 · 06:CODE」，单字只写「CODE」
const ROOT = 'D:/Users/10061/Downloads/wubi';
const WI = `${ROOT}/qingfeng/WindInput`;
const tables = JSON.parse(fs.readFileSync(`${ROOT}/tools/tables.json`, 'utf8'));

const chaizi = new Map();
for (const line of fs.readFileSync(`${WI}/schemas/wubi06_chaizi_pua.txt`, 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const [ch, seq] = line.split('\t');
  if (ch && seq) chaizi.set(ch, [...seq]);
}

const words = [];
for (let n = 2; n <= 12; n += 1) {
  const f = `${ROOT}/data/word-len-${n}.js`;
  if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').match(/=(\[[\s\S]*\]);?$/);
  if (m) words.push(...JSON.parse(m[1]));
}

const codeOf = (chars) => {
  const codes = chars.map((ch) => ((tables.v06[ch] || {}).c || ''));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
};

const rootsOf = (chars) => {
  const per = chars.map((ch) => chaizi.get(ch));
  if (per.some((r) => !r || !r.length)) return null;
  const n = chars.length;
  if (n === 2) return [...per[0].slice(0, 2), ...per[1].slice(0, 2)];
  if (n === 3) return [per[0][0], per[1][0], ...per[2].slice(0, 2)];
  if (n === 4) return per.map((r) => r[0]);
  return [per[0][0], per[1][0], per[2][0], per[n - 1][0]];
};

const lines = [];
let wordsOk = 0;
for (const w of words) {
  const chars = [...w];
  const roots = rootsOf(chars);
  const code = codeOf(chars);
  if (!roots || roots.length !== 4 || !code) continue;
  lines.push(`${w}\t${roots.join(' ')} · 06:${code}`);
  wordsOk += 1;
}

// 单字：只放编码，靠 ${chaizi} 显示字根
let charsOk = 0;
for (const ch of chaizi.keys()) {
  const code = (tables.v06[ch] || {}).c || '';
  if (!code) continue;
  lines.push(`${ch}\t${code}`);
  charsOk += 1;
}

lines.sort((a, b) => a.localeCompare(b));
const target = `${WI}/schemas/comments/ci_chaifen.txt`;
fs.writeFileSync(target, lines.join('\n') + '\n', 'utf8');
console.log('词条:', wordsOk, '| 单字:', charsOk, '| 合计:', lines.length, '| 大小:', Math.round(fs.statSync(target).size / 1024), 'KB');
