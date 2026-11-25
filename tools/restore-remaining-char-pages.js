// 把仍是轻量模板的单字页，从 git 历史取回旧版并按新规则转换
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR_DIR = path.join(ROOT, 'char');
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/root-glyphs.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/frag-map.json'), 'utf8'));
const byPaths = new Map();
for (const [name, g] of Object.entries(lib)) byPaths.set(g.paths.join('|'), name);

function findDivEnd(html, start) {
  let depth = 0;
  let i = start;
  while (i < html.length) {
    const open = html.indexOf('<div', i);
    const close = html.indexOf('</div>', i);
    if (close < 0) return html.length;
    if (open >= 0 && open < close) { depth += 1; i = open + 4; continue; }
    depth -= 1; i = close + 6;
    if (depth === 0) return i;
  }
  return html.length;
}

function spritefy(html) {
  const re = /<svg class="frag"[^>]*>[\s\S]*?<\/svg>/g;
  let out = '';
  let pos = 0;
  let m;
  while ((m = re.exec(html))) {
    out += html.slice(pos, m.index);
    const block = m[0];
    const ds = [...block.matchAll(/d="([^"]+)"/g)].map((x) => x[1]);
    const name = ds.length ? byPaths.get(ds.join('|')) : null;
    const idx = name ? fragMap[name] : undefined;
    if (idx === undefined) { out += block; pos = m.index + block.length; continue; }
    const color = (block.match(/fill="(#[0-9A-Fa-f]{3,6})"/) || [])[1] || '#2a2320';
    const size = (block.match(/width="(\d+)"/) || [])[1] || '20';
    out += `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}" style="color:${color};vertical-align:-4px"><use href="../data/frag-sprite.svg#frag-${idx}"/></svg>`;
    pos = m.index + block.length;
  }
  return out + html.slice(pos);
}

function reorderCards(html) {
  const marks = [...html.matchAll(/<div class="vcard">/g)].map((m) => m.index);
  if (marks.length !== 3) return html;
  const ends = marks.map((s) => findDivEnd(html, s));
  const cards = marks.map((s, i) => html.slice(s, ends[i]));
  const labels = cards.map((c) => (c.match(/class="vtag">([^<]+)</) || [])[1] || '');
  const order = ['新世纪', '86 版', '98 版'].map((lb) => cards[labels.indexOf(lb)]);
  if (order.some((x) => !x)) return html;
  return html.slice(0, marks[0]) + order.join('') + html.slice(ends[2]);
}

const files = fs.readdirSync(CHAR_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html');
let restored = 0;
let failed = 0;
for (const f of files) {
  const p = path.join(CHAR_DIR, f);
  const t = fs.readFileSync(p, 'utf8');
  if (t.includes('涉及的键位')) continue; // 已经是旧版结构
  try {
    const raw = execFileSync('git', ['show', `1b205d2:char/${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 << 20 });
    if (!raw.includes('涉及的键位')) { failed += 1; continue; }
    fs.writeFileSync(p, reorderCards(spritefy(raw)), 'utf8');
    restored += 1;
    if (restored % 1000 === 0) console.log(restored, 'restored');
  } catch (e) {
    failed += 1;
  }
}
console.log('恢复旧版:', restored, '| 失败:', failed);
