// Build the branch-grouping tool with per-stroke ordering.
// Usage: node make-grouper2.js 永
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const ch = process.argv[2] || '永';
const data = JSON.parse(fs.readFileSync(path.join(BASE, 'tools', 'font-strokes', `${ch}-branches.json`), 'utf8'));

const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><title>${ch} · 碎片分组（带顺序）</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Microsoft YaHei',sans-serif; background:#0f1117; color:#e8ecf4; display:flex; }
  #stage { flex:1; display:flex; align-items:center; justify-content:center; padding:20px; }
  #panel { width:320px; background:#171b24; padding:18px; border-left:1px solid #242a36; }
  h2 { font-size:15px; margin:0 0 8px; color:#9fb3c8; }
  .slot { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
  .chip { padding:6px 10px; border-radius:6px; border:1px solid #2c3442; cursor:pointer; font-size:13px; }
  .chip.active { outline:2px solid #fff; }
  button { width:100%; padding:10px; margin-top:8px; border-radius:6px; border:0; background:#2f6f8f; color:#fff; font-size:14px; cursor:pointer; }
  button.alt { background:#3a4356; }
  .hint { font-size:12px; color:#8b95a8; line-height:1.6; margin-top:10px; }
  .branch { cursor:pointer; }
  .num { font-size:13px; fill:#fff; pointer-events:none; font-weight:700; paint-order:stroke; stroke:#0f1117; stroke-width:4px; }
</style></head>
<body>
<div id="stage"><svg id="svg" viewBox="0 0 1024 1024" width="760" height="760"></svg></div>
<div id="panel">
  <h2>① 选一笔</h2>
  <div class="slot" id="slots"></div>
  <h2>② 按书写顺序点碎片</h2>
  <div class="hint">第一次点 = 这一笔的起点，往后点依次接续。再点同一碎片可取消（后面的顺序会前移）。</div>
  <button id="gen">生成笔画并预览</button>
  <button id="dl" class="alt">下载 JSON</button>
  <div class="hint" id="status"></div>
</div>
<script>
const DATA = ${JSON.stringify(data)};
const COLORS = ['#E74C3C','#FF9800','#27AE60','#3498DB','#9B59B6','#16A085','#E67E22','#2C3E50'];
const N = 5;
let current = 1;
const order = {};   // strokeNo -> [branchId, ...] in click order

const svg = document.getElementById('svg');
const NS = 'http://www.w3.org/2000/svg';

function strokeOf(bid) {
  for (const s in order) if (order[s].includes(bid)) return Number(s);
  return 0;
}

function draw() {
  svg.innerHTML = '';
  for (const b of DATA.branches) {
    const s = strokeOf(b.id);
    const color = s ? COLORS[(s - 1) % COLORS.length] : '#6b7787';
    const pts = b.pts.map(([x, y]) => x + ',' + (900 - y)).join(' ');
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', s ? '24' : '16');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('class', 'branch');
    line.addEventListener('click', () => {
      const list = order[current] || (order[current] = []);
      const at = list.indexOf(b.id);
      if (s === current && at >= 0) {
        list.splice(at, 1);
      } else {
        // remove from any other stroke first
        for (const k in order) order[k] = order[k].filter((x) => x !== b.id);
        (order[current] = order[current] || []).push(b.id);
      }
      draw();
    });
    svg.appendChild(line);

    const [x, y] = b.pts[Math.floor(b.pts.length / 2)];
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', 900 - y);
    t.setAttribute('class', 'num'); t.setAttribute('text-anchor', 'middle');
    t.textContent = b.id + 1;
    svg.appendChild(t);
  }
  const assigned = Object.values(order).reduce((a, l) => a + l.length, 0);
  document.getElementById('status').textContent =
    '已分配 ' + assigned + ' / ' + DATA.branches.length + ' 段 · ' +
    Object.keys(order).sort().map((k) => '第' + k + '笔:' + order[k].length).join('  ');
}

function buildSlots() {
  const box = document.getElementById('slots');
  box.innerHTML = '';
  for (let i = 1; i <= N; i += 1) {
    const d = document.createElement('div');
    d.className = 'chip' + (i === current ? ' active' : '');
    d.style.background = COLORS[(i - 1) % COLORS.length];
    d.style.color = '#111';
    d.textContent = '第 ' + i + ' 笔';
    d.onclick = () => { current = i; buildSlots(); draw(); };
    box.appendChild(d);
  }
}

function chainFor(strokeNo) {
  const ids = order[strokeNo] || [];
  if (!ids.length) return null;
  const segs = ids.map((id) => {
    const b = DATA.branches.find((x) => x.id === id);
    return b.pts.map((p) => [p[0], p[1]]);
  });
  let chain = segs[0].slice();
  for (let i = 1; i < segs.length; i += 1) {
    let seg = segs[i].slice();
    const end = chain[chain.length - 1];
    const dStart = Math.hypot(seg[0][0] - end[0], seg[0][1] - end[1]);
    const dEnd = Math.hypot(seg[seg.length - 1][0] - end[0], seg[seg.length - 1][1] - end[1]);
    if (dEnd < dStart) seg.reverse();
    chain = chain.concat(seg);
  }
  return chain;
}

function renderPreview() {
  svg.innerHTML = '';
  const out = [];
  for (let s = 1; s <= N; s += 1) {
    const chain = chainFor(s);
    if (!chain) continue;
    const pts = chain.map(([x, y]) => x + ',' + (900 - y)).join(' ');
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', COLORS[(s - 1) % COLORS.length]);
    line.setAttribute('stroke-width', '26');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);
    out.push({ stroke: s, branchIds: (order[s] || []).slice(), medians: chain });
  }
  window.__result = out;
  document.getElementById('status').textContent = '生成 ' + out.length + ' 笔（示意线），可下载 JSON';
}

document.getElementById('gen').onclick = renderPreview;
document.getElementById('dl').onclick = () => {
  const strokes = [];
  for (let s = 1; s <= N; s += 1) {
    const chain = chainFor(s);
    if (!chain) continue;
    strokes.push({ stroke: s, branchIds: (order[s] || []).slice(), medians: chain });
  }
  const blob = new Blob([JSON.stringify({ char: DATA.char, strokes }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = DATA.char + '-strokes.json';
  a.click();
};

buildSlots();
draw();
</script>
</body></html>`;

fs.writeFileSync(path.join(BASE, 'tools', 'branch-grouper.html'), html, 'utf8');
console.log('written tools/branch-grouper.html (ordered) for', ch, 'branches', data.branches.length);
