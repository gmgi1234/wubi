// Add the ten reviewed characters to the three wubi dictionaries.
const fs = require('node:fs');
const vm = require('node:vm');

const DIR = 'D:/Users/10061/Downloads/wubi/data';

const CHARS = [
  { ch: '贠', r: ['厶', '贝'], v86: 'CMU', v98: 'CMU', v06: 'CMU' },
  { ch: '菓', r: ['艹', '果'], v86: 'ASU', v98: 'ASU', v06: 'ASU' },
  { ch: '幋', r: ['般', '巾'], v86: 'TEMH', v98: 'TUWH', v06: 'TEWH' },
  { ch: '燊', r: ['焱', '木'], v86: 'OOOS', v98: 'OOOS', v06: 'OOOS' },
  { ch: '凅', r: ['冫', '固'], v86: 'ULDG', v98: 'ULDG', v06: 'ULDG' },
  { ch: '坘', r: ['土', '互'], v86: 'FGXG', v98: 'FGXG', v06: 'FGXG' },
  { ch: '脮', r: ['月', '妥'], v86: 'EEVG', v98: 'EEVG', v06: 'EEVG' },
  { ch: '馺', r: ['馬', '及'], v86: 'CEYY', v98: 'COBY', v06: 'COBY' },
  { ch: '秎', r: ['禾', '分'], v86: 'TWVN', v98: 'TWVT', v06: 'TWVT' },
  { ch: '镠', r: ['钅', '翏'], v86: 'QNWE', v98: 'QNWE', v06: 'QNWE' },
];

const FILES = {
  86: { file: `${DIR}/wubi86.js`, constName: 'WUBI_86', key: 'v86' },
  98: { file: `${DIR}/wubi98.js`, constName: 'WUBI_98', key: 'v98' },
  06: { file: `${DIR}/wubi_xsj.js`, constName: 'WUBI_06', key: 'v06' },
};

for (const [ver, cfg] of Object.entries(FILES)) {
  let text = fs.readFileSync(cfg.file, 'utf8');
  fs.writeFileSync(`${cfg.file}.bak-20261122`, text, 'utf8');

  const existing = new Set();
  const sandbox = { console, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(`${text};globalThis.__d = ${cfg.constName};`, sandbox);
  for (const k of Object.keys(sandbox.globalThis.__d)) existing.add(k);

  const lines = [];
  for (const c of CHARS) {
    if (existing.has(c.ch)) { console.log(ver, c.ch, '已存在，跳过'); continue; }
    const code = c[cfg.key];
    lines.push(`    ${JSON.stringify(c.ch)}:{"c":"${code}","r":${JSON.stringify(c.r)}}`);
  }
  if (!lines.length) { console.log(ver, 'no new entries'); continue; }

  // drop the trailing "};" (with optional newline) and append with commas intact
  const idx = text.lastIndexOf('};');
  if (idx < 0) throw new Error('cannot find terminator');
  let head = text.slice(0, idx).replace(/\s*$/, '');
  let tail = text.slice(idx);
  // ensure the previous last entry gets a comma
  if (!head.endsWith(',')) head += ',';
  text = `${head}\n${lines.join(',\n')}\n${tail}`;

  // validate
  const sandbox2 = { console, globalThis: {} };
  vm.createContext(sandbox2);
  vm.runInContext(`${text};globalThis.__d = ${cfg.constName};`, sandbox2);
  const obj = sandbox2.globalThis.__d;
  console.log(ver, 'entries', Object.keys(obj).length, '新增', lines.length);
  fs.writeFileSync(cfg.file, text, 'utf8');
}
