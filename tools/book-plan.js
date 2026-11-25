// Build the 25-key practice-book plan (86) with curated, common example characters.
const fs = require('node:fs');
const vm = require('node:vm');

const W = 'D:/Users/10061/Downloads/wubi';

function load(file, names) {
  const code = fs.readFileSync(file, 'utf8');
  const expr = `;globalThis.__d = {${names.map((n) => `${n}: ${n}`).join(', ')}};`;
  const sandbox = { console, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(code + expr, sandbox);
  return sandbox.globalThis.__d;
}

const roots = load(`${W}/data/wubi_roots_all.js`, ['WUBI_KOuju_86', 'WUBI_ROOT_TABLE_86', 'KEY_NAMES']);
const { WUBI_86 } = load(`${W}/data/wubi86.js`, ['WUBI_86']);

const ORDER = 'GFDSAHJKLMTREWQYUIOPNBVCX'.split('');

const CURATED = {
  G: ['一', '王', '玉', '理', '现', '球'],
  F: ['地', '土', '二', '十', '寺', '雨'],
  D: ['大', '三', '石', '太', '原', '厂'],
  S: ['木', '要', '本', '机', '林', '术'],
  A: ['工', '七', '革', '式', '花', '区'],
  H: ['目', '上', '止', '虎', '皮', '占'],
  J: ['日', '是', '早', '时', '里', '虫'],
  K: ['口', '中', '只', '兄', '号', '叫'],
  L: ['田', '国', '四', '车', '力', '男'],
  M: ['山', '同', '由', '贝', '几', '岁'],
  T: ['禾', '和', '竹', '千', '生', '利'],
  R: ['白', '的', '手', '斤', '打', '看'],
  E: ['月', '有', '用', '且', '朋', '服'],
  W: ['人', '你', '个', '会', '从', '们'],
  Q: ['金', '儿', '多', '钱', '角', '争'],
  Y: ['言', '主', '文', '方', '说', '广'],
  U: ['立', '产', '六', '门', '亲', '病'],
  I: ['水', '不', '小', '少', '学', '光'],
  O: ['火', '米', '业', '灯', '类', '炎'],
  P: ['之', '家', '定', '字', '安', '完'],
  N: ['已', '民', '心', '尺', '羽', '快'],
  B: ['子', '了', '也', '耳', '阳', '阵'],
  V: ['女', '刀', '九', '好', '妈', '如'],
  C: ['又', '以', '马', '巴', '双', '台'],
  X: ['纟', '经', '红', '线', '给', '纪'],
};

function strokeCount(ch) {
  try {
    return JSON.parse(fs.readFileSync(`${W}/data/chars/${ch}.json`, 'utf8')).strokes.length;
  } catch {
    return 99;
  }
}

const plan = [];
for (const key of ORDER) {
  const name = roots.KEY_NAMES[key] || '';
  const kuoju = roots.WUBI_KOuju_86[key] || '';
  const rootList = ((roots.WUBI_ROOT_TABLE_86[key] || '').match(/\[[^\]]+\]|./gu) || []).slice(0, 12);

  const chars = [];
  const seen = new Set();
  const push = (ch) => {
    const entry = WUBI_86[ch];
    if (!entry || !entry.r || seen.has(ch)) return false;
    if (!entry.c || entry.c[0] !== key) return false;
    seen.add(ch);
    chars.push({ char: ch, code: entry.c, roots: entry.r });
    return true;
  };

  for (const ch of CURATED[key]) push(ch);
  // top up from the dictionary if the curated list came up short
  if (chars.length < 6) {
    for (const [ch, entry] of Object.entries(WUBI_86)) {
      if (chars.length >= 6) break;
      if (entry.c && entry.c[0] === key && strokeCount(ch) <= 10) push(ch);
    }
  }
  plan.push({ key, name, kuoju, roots: rootList, chars });
}

fs.writeFileSync(`${W}/tools/book-plan.json`, JSON.stringify(plan, null, 1), 'utf8');
for (const p of plan) console.log(p.key, p.name, '|', p.chars.map((c) => c.char + '(' + c.code + ')').join(' '));
