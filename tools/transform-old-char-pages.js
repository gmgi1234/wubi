// 把旧版单字页改成：sprite 引用 + 新世纪在前
const fs = require('node:fs');
const path = require('node:path');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/root-glyphs.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/frag-map.json'), 'utf8'));
const byPaths = new Map();
for (const [name, g] of Object.entries(lib)) byPaths.set(g.paths.join('|'), name);

// 找到从 start 开始的那个 <div ...> 的配对结束位置（返回结束标签之后的索引）
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
  let out = '';
  let pos = 0;
  const re = /<svg class="frag"[^>]*>[\s\S]*?<\/svg>/g;
  let m;
  while ((m = re.exec(html))) {
    out += html.slice(pos, m.index);
    const block = m[0];
    const ds = [...block.matchAll(/d="([^"]+)"/g)].map((x) => x[1]);
    const name = ds.length ? byPaths.get(ds.join('|')) : null;
    const idx = name !== undefined && name !== null ? fragMap[name] : undefined;
    if (idx === undefined) { out += block; pos = m.index + block.length; continue; }
    const colorMatch = block.match(/fill="(#[0-9A-Fa-f]{3,6})"/);
    const color = colorMatch ? colorMatch[1] : '#2a2320';
    const sizeMatch = block.match(/width="(\d+)"/);
    const size = sizeMatch ? sizeMatch[1] : '20';
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

let n = 0;
let changed = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'char'))) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const p = path.join(ROOT, 'char', f);
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('frag-sprite') && t.indexOf('新世纪') < t.indexOf('86 版')) continue; // 已处理
  const before = t;
  t = spritefy(t);
  t = reorderCards(t);
  if (t !== before) { fs.writeFileSync(p, t, 'utf8'); changed += 1; }
  n += 1;
}
console.log('处理页面:', n, '| 改动:', changed);
