// Build a self-contained branch-grouping tool for one character.
// Usage: node make-grouper.js 永
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'D:/Users/10061/Downloads/wubi';
const ch = process.argv[2] || '永';
const data = JSON.parse(fs.readFileSync(path.join(BASE, 'tools', 'font-strokes', `${ch}-branches.json`), 'utf8'));

const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><title>${ch} · 碎片分组</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Microsoft YaHei',sans-serif; background:#0f1117; color:#e8ecf4; display:flex; }
  #stage { flex:1; display:flex; align-items:center; justify-content:center; padding:20px; }
  #panel { width:300px; background:#171b24; padding:18px; border-left:1px solid #242a36; }
  h2 { font-size:16px; margin:0 0 10px; color:#9fb3c8; }
  .slot { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .chip { padding:6px 10px; border-radius:6px; border:1px solid #2c3442; cursor:pointer; font-size:13px; }
  .chip.active { outline:2px solid #fff; }
  button { width:100%; padding:10px; margin-top:8px; border-radius:6px; border:0; background:#2f6f8f; color:#fff; font-size:14px; cursor:pointer; }
  button.alt { background:#3a4356; }
  .hint { font-size:12px; color:#8b95a8; line-height:1.6; margin-top:12px; }
  .branch { cursor:pointer; }
  .branch:hover { opacity:0.85; }
  .num { font-size:13px; fill:#0f1117; pointer-events:none; font-weight:700; }
</style></head>
<body>
<div id="stage"><svg id="svg" viewBox="0 0 1024 1024" width="760" height="760"></svg></div>
<div id="panel">
  <h2>① 选一笔</h2>
  <div class="slot" id="slots"></div>
  <h2>② 点对应碎片</h2>
  <div class="hint">点一次归属当前笔；再点一次取消。同一笔可以由多段拼成。</div>
  <button id="gen">生成笔画并预览</button>
  <button id="dl" class="alt">下载 JSON</button>
  <div class="hint" id="status">未分配 0 段</div>
</div>
<script>
const DATA = ${JSON.stringify(data)};
const COLORS = ['#E74C3C','#FF9800','#27AE60','#3498DB','#9B59B6','#16A085','#E67E22','#2C3E50'];
const N = 5;
let current = 1;
const assign = {};   // branchId -> stroke no

const svg = document.getElementById('svg');
const NS = 'http://www.w3.org/2000/svg';

function draw() {
  svg.innerHTML = '';
  for (const b of DATA.branches) {
    const stroke = assign[b.id] || 0;
    const color = stroke ? COLORS[(stroke - 1) % COLORS.length] : '#6b7787';
    const pts = b.pts.map(([x, y]) => x + ',' + (900 - y)).join(' ');
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', pts);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '22');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('class', 'branch');
    line.addEventListener('click', () => {
      if (assign[b.id] === current) delete assign[b.id];
      else assign[b.id] = current;
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
  document.getElementById('status').textContent = '已分配 ' + Object.keys(assign).length + ' / ' + DATA.branches.length + ' 段';
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
    d.onclick = () => { current = i; drawSlots(); };
    box.appendChild(d);
  }
}
function drawSlots() { buildSlots(); draw(); }

// merge branches of the same stroke into one polyline (nearest-end chaining)
function merge(strokeNo) {
  const parts = DATA.branches.filter((b) => assign[b.id] === strokeNo).map((b) => ({ pts: b.pts.slice(), w: b.w.slice(), used: false }));
  if (!parts.length) return null;
  const first = parts.shift();
  const chain = { pts: first.pts.slice(), w: first.w.slice() };
  let guard = 0;
  while (parts.length && guard++ < 50) {
    let best = null;
    for (let i = 0; i < parts.length; i += 1) {
      const p = parts[i];
      const combos = [[0, 0], [0, 1], [1, 0], [1, 1]];
      for (const [a, b] of combos) {
        const ea = a ? chain.pts[chain.pts.length - 1] : chain.pts[0];
        const eb = b ? p.pts[p.pts.length - 1] : p.pts[0];
        const d = Math.hypot(ea[0] - eb[0], ea[1] - eb[1]);
        if (!best || d < best.d) best = { d, i, a, b };
      }
    }
    if (!best) break;
    const p = parts.splice(best.i, 1)[0];
    let pts = p.pts.slice(); let w = p.w.slice();
    if (best.b === 1) { pts.reverse(); w.reverse(); }
    if (best.a === 0) { chain.pts = pts.concat(chain.pts); chain.w = w.concat(chain.w); }
    else { chain.pts = chain.pts.concat(pts); chain.w = chain.w.concat(w); }
  }
  return chain;
}

// outline polygon from centreline + half widths
function outline(chain) {
  const { pts, w } = chain;
  const left = [], right = [];
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const prev = pts[i - 1] || p;
    const next = pts[i + 1] || p;
    let dx = next[0] - prev[0], dy = next[1] - prev[1];
    const n = Math.hypot(dx, dy) || 1;
    dx /= n; dy /= n;
    const r = Math.max(2, w[i] / 2);
    left.push([p[0] - dy * r, p[1] + dx * r]);
    right.push([p[0] + dy * r, p[1] - dx * r]);
  }
  return left.concat(right.reverse());
}

function renderPreview() {
  svg.innerHTML = '';
  const out = [];
  for (let s = 1; s <= N; s += 1) {
    const chain = merge(s);
    if (!chain) continue;
    const poly = outline(chain);
    const d = 'M ' + poly.map(([x, y]) => x.toFixed(1) + ' ' + (900 - y).toFixed(1)).join(' L ') + ' Z';
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', COLORS[(s - 1) % COLORS.length]);
    p.setAttribute('stroke', '#fff');
    p.setAttribute('stroke-width', '1');
    svg.appendChild(p);
    out.push({ stroke: s, d, medians: chain.pts });
  }
  window.__result = out;
  document.getElementById('status').textContent = '生成 ' + out.length + ' 笔';
}

document.getElementById('gen').onclick = renderPreview;
document.getElementById('dl').onclick = () => {
  const blob = new Blob([JSON.stringify({ char: DATA.char, strokes: window.__result || [] }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = DATA.char + '-strokes.json';
  a.click();
};

drawSlots();
</script>
</body></html>`;

fs.writeFileSync(path.join(BASE, 'tools', 'branch-grouper.html'), html, 'utf8');
console.log('written tools/branch-grouper.html for', ch, 'branches', data.branches.length);
