// 从 a1d6a17:site/char/ 取回完整旧版单字页，转换成当前规则
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const CHAR_DIR = path.join(ROOT, 'char');
const COMMIT = 'a1d6a17';
const PREFIX = 'site/char/';

const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/root-glyphs.json'), 'utf8'));
const fragMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/frag-map.json'), 'utf8'));
const byPaths = new Map();
for (const [name, g] of Object.entries(lib)) byPaths.set(g.paths.join('|'), name);

// 1) 列出提交里的文件 → { name: blobHash }
const raw = execFileSync('git', ['ls-tree', '-z', '-r', COMMIT, PREFIX], { cwd: ROOT, maxBuffer: 256 << 20 });
const entries = raw.toString('utf8').split('\0').filter(Boolean);
const blobs = new Map();
for (const line of entries) {
  const m = line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/);
  if (!m) continue;
  const name = path.basename(m[2]);
  if (name.endsWith('.html') && name !== 'index.html') blobs.set(name, m[1]);
}
console.log('提交里的页面:', blobs.size);

// 2) 批量读取 blob
function batchRead(hashes) {
  const input = hashes.map((h) => h).join('\n') + '\n';
  const out = execFileSync('git', ['cat-file', '--batch'], { cwd: ROOT, input, maxBuffer: 1 << 30 });
  const result = new Map();
  let i = 0;
  while (i < out.length) {
    const nl = out.indexOf(10, i);
    if (nl < 0) break;
    const header = out.slice(i, nl).toString('utf8'); // "<sha> <type> <size>"
    const size = Number(header.split(' ')[2]);
    const start = nl + 1;
    const content = out.slice(start, start + size).toString('utf8');
    result.set(header.split(' ')[0], content);
    i = start + size + 1;
  }
  return result;
}

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

function fixLinks(html) {
  return html
    .replace(/href="\/"/g, 'href="../"')
    .replace(/href="\/char\/([^"\/]+?)\.html"/g, (m, c) => `href="../char.html?c=${c}"`)
    .replace(/href="\/ci\/([^"\/]+?)\.html"/g, (m, w) => `href="../ci.html?w=${w}"`)
    .replace(/href="\.\.\/ci\/([^"\/]+?)\.html"/g, (m, w) => `href="../ci.html?w=${w}"`)
    .replace(/href="\.\.\/char\/([^"\/]+?)\.html"/g, (m, c) => `href="../char.html?c=${c}"`)
    .replace(/href="([^"\/:?]+?)\.html"/g, (m, c) => (c === 'index' ? m : `href="../char.html?c=${c}"`));
}

const need = fs.readdirSync(CHAR_DIR)
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .filter((f) => process.env.FORCE === '1' || !fs.readFileSync(path.join(CHAR_DIR, f), 'utf8').includes('涉及的键位'));

console.log('需要补齐:', need.length);
const hashes = need.map((f) => blobs.get(f)).filter(Boolean);
const unique = [...new Set(hashes)];
console.log('可取的 blob:', unique.length);

const contents = batchRead(unique);
let done = 0;
let miss = 0;
for (const f of need) {
  const h = blobs.get(f);
  const html = h ? contents.get(h) : null;
  if (!html || !html.includes('涉及的键位')) { miss += 1; continue; }
  fs.writeFileSync(path.join(CHAR_DIR, f), reorderCards(fixLinks(spritefy(html))), 'utf8');
  done += 1;
}
console.log('补齐完成:', done, '| 仍缺:', miss);
