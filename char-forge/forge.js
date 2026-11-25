#!/usr/bin/env node
/*
 * char-forge — 汉字笔画数据生成管线（donor 移植法）
 *
 * 命令:
 *   node forge.js norm                      重建笔画粗细规范表 (weight_norms.json)
 *   node forge.js donors <部件> [minW minH]  搜索包含该部件的 donor 字（按 wubi r 数组）
 *   node forge.js build <config.json>       生成条目 + 校验 + 预览 (输出到 out/)
 *   node forge.js install <config.json>     build + 备份 + 替换 stroke-bundle.js + 验证
 *
 * 配置格式见 configs/亱.json：
 *   strokes[i]:
 *     donor  donor 字（bundle 中已有笔画数据的字）
 *     index  donor 中的笔画序号（从 0 起）
 *     t      纯平移 { tx, ty }（推荐：donor 尺寸合适时用，粗细 100% 保留）
 *     fit    将 donor 笔画 bbox 非均匀映射到区域 { x0, x1, y0, y1 }（慎用，会改变粗细）
 *     widenX 竖类笔画拟合后增粗到目标值（沿 x 轴扩展，锚定左缘）
 *     widenY 横类笔画拟合后增粗到目标值（沿 y 轴扩展，锚定下缘）
 *     name   笔画名（报告用）
 *
 * 坐标系：1024×1024，y 轴向上（y=900 顶部，y=100 底部），与 hanzi-writer-data 一致。
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const BUNDLE = path.join(ROOT, 'data', 'stroke-bundle.js');
const NORMS = path.join(__dirname, 'weight_norms.json');
const OUT = path.join(__dirname, 'out');

// ---------------- SVG path utilities ----------------
function pathPts(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  let x = 0, y = 0, sx = 0, sy = 0, cmd = null, i = 0;
  const pts = [];
  const readN = (k) => { const a = []; for (let j = 0; j < k; j++) a.push(parseFloat(tokens[i++])); return a; };
  while (i < tokens.length) {
    const tk = tokens[i];
    if (/[a-zA-Z]/.test(tk)) { cmd = tk; i++; continue; }
    switch (cmd) {
      case 'M': { const [a, b] = readN(2); x = a; y = b; sx = x; sy = y; pts.push([x, y]); cmd = 'L'; break; }
      case 'L': { const [a, b] = readN(2); x = a; y = b; pts.push([x, y]); break; }
      case 'H': { const [a] = readN(1); x = a; pts.push([x, y]); break; }
      case 'V': { const [a] = readN(1); y = a; pts.push([x, y]); break; }
      case 'C': { const r = readN(6); for (let k = 0; k < 6; k += 2) pts.push([r[k], r[k + 1]]); x = r[4]; y = r[5]; break; }
      case 'S': { const r = readN(4); pts.push([r[0], r[1]], [r[2], r[3]]); x = r[2]; y = r[3]; break; }
      case 'Q': { const r = readN(4); pts.push([r[0], r[1]], [r[2], r[3]]); x = r[2]; y = r[3]; break; }
      case 'T': { const r = readN(2); pts.push([r[0], r[1]]); x = r[0]; y = r[1]; break; }
      case 'A': { const r = readN(7); pts.push([r[5], r[6]]); x = r[5]; y = r[6]; break; }
      case 'Z': case 'z': { x = sx; y = sy; i++; break; }
      default: i++;
    }
  }
  return pts;
}
function bboxOf(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
function strokeBBox(d) { return bboxOf(pathPts(d)); }
function orientOf(med) {
  if (!med || med.length < 2) return 'D';
  const dx = Math.abs(med[med.length - 1][0] - med[0][0]);
  const dy = Math.abs(med[med.length - 1][1] - med[0][1]);
  if (dx > dy * 2.5) return 'H';
  if (dy > dx * 2.5) return 'V';
  return 'D';
}
function xformPath(d, sx, tx, sy, ty) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  let out = [], i = 0, cmd = null;
  const f = (v) => +(v.toFixed(2));
  while (i < tokens.length) {
    const tk = tokens[i];
    if (/[a-zA-Z]/.test(tk)) { cmd = tk; out.push(tk); i++; continue; }
    switch (cmd) {
      case 'M': case 'L': case 'T': { const a = parseFloat(tokens[i++]), b = parseFloat(tokens[i++]); out.push(f(a * sx + tx), f(b * sy + ty)); break; }
      case 'H': { out.push(f(parseFloat(tokens[i++]) * sx + tx)); break; }
      case 'V': { out.push(f(parseFloat(tokens[i++]) * sy + ty)); break; }
      case 'C': { for (let k = 0; k < 6; k += 2) { const a = parseFloat(tokens[i++]), b = parseFloat(tokens[i++]); out.push(f(a * sx + tx), f(b * sy + ty)); } break; }
      case 'S': case 'Q': { for (let k = 0; k < 4; k += 2) { const a = parseFloat(tokens[i++]), b = parseFloat(tokens[i++]); out.push(f(a * sx + tx), f(b * sy + ty)); } break; }
      case 'A': { const rx = parseFloat(tokens[i++]), ry = parseFloat(tokens[i++]), rot = parseFloat(tokens[i++]), laf = parseFloat(tokens[i++]), sf = parseFloat(tokens[i++]), a = parseFloat(tokens[i++]), b = parseFloat(tokens[i++]); out.push(f(rx * sx), f(ry * sy), rot, laf, sf, f(a * sx + tx), f(b * sy + ty)); break; }
      case 'Z': case 'z': { i++; break; }
      default: i++;
    }
  }
  return out.join(' ');
}
const xformMedian = (med, sx, tx, sy, ty) => med.map(p => [+((p[0] * sx + tx).toFixed(2)), +((p[1] * sy + ty).toFixed(2))]);

// ---------------- bundle I/O ----------------
function extractObj(src, anchor) {
  const idx = src.indexOf(anchor);
  if (idx < 0) throw new Error('anchor not found: ' + anchor);
  let i = src.indexOf('{', idx);
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
    }
  }
  return { obj: JSON.parse(src.slice(i, end)), start: i, end };
}
let _bundle = null;
function loadBundle() {
  if (_bundle) return _bundle;
  const cacheJson = path.join(__dirname, 'bundle_cache.json');
  if (fs.existsSync(cacheJson)) {
    const st = fs.statSync(cacheJson), sb = fs.statSync(BUNDLE);
    if (st.mtimeMs >= sb.mtimeMs) { _bundle = JSON.parse(fs.readFileSync(cacheJson, 'utf8')); return _bundle; }
  }
  console.error('parsing bundle...');
  _bundle = extractObj(fs.readFileSync(BUNDLE, 'utf8'), 'TA=').obj;
  fs.writeFileSync(cacheJson, JSON.stringify(_bundle));
  return _bundle;
}

// ---------------- weight norms ----------------
function buildNorms() {
  const data = loadBundle();
  const buckets = { H: {}, V: {} };
  const chars = Object.keys(data);
  for (const ch of chars) {
    const e = data[ch];
    for (let i = 0; i < e.strokes.length; i++) {
      const o = orientOf(e.medians && e.medians[i]);
      if (o === 'D') continue;
      const b = strokeBBox(e.strokes[i]);
      const w = b.x1 - b.x0, h = b.y1 - b.y0;
      // strict orientation: exclude diagonals that pollute long-length buckets
      if (o === 'H' && h > w / 3) continue;
      if (o === 'V' && w > h / 3) continue;
      const len = o === 'H' ? w : h, thick = o === 'H' ? h : w;
      if (len < 150 || len > 950) continue;
      const bk = Math.round(len / 100) * 100;
      (buckets[o][bk] = buckets[o][bk] || []).push(thick);
    }
  }
  const norms = { meta: { built: new Date().toISOString(), canvas: 1024, note: 'thickness = bbox cross-dimension; median of bundle chars' }, H: {}, V: {} };
  for (const o of ['H', 'V']) {
    for (const bk of Object.keys(buckets[o]).map(Number).sort((a, b) => a - b)) {
      const a = buckets[o][bk].sort((x, y) => x - y);
      norms[o][bk] = +(a[Math.floor(a.length / 2)]).toFixed(1);
    }
  }
  fs.writeFileSync(NORMS, JSON.stringify(norms, null, 1));
  console.log('norms written:', NORMS);
  console.log(JSON.stringify(norms.H), JSON.stringify(norms.V));
}
function normFor(o, len) {
  const norms = JSON.parse(fs.readFileSync(NORMS, 'utf8'));
  const t = norms[o];
  const ks = Object.keys(t).map(Number).sort((a, b) => a - b);
  if (!ks.length) return 100;
  if (len <= ks[0]) return t[ks[0]];
  if (len >= ks[ks.length - 1]) return t[ks[ks.length - 1]];
  for (let i = 0; i < ks.length - 1; i++) {
    if (len >= ks[i] && len <= ks[i + 1]) {
      const f = (len - ks[i]) / (ks[i + 1] - ks[i]);
      return t[ks[i]] * (1 - f) + t[ks[i + 1]] * f;
    }
  }
  return 100;
}

// ---------------- donors ----------------
function findDonors(component) {
  const bundle = loadBundle();
  // load wubi files: char -> r array
  const wubi = {};
  for (const f of ['wubi86.js', 'wubi98.js', 'wubi_xsj.js']) {
    const p = path.join(ROOT, 'data', f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const re = /"([^"]+)":\{"c":"[^"]*","r":\[(.*?)\](,"comp":true)?\}/g;
    let m;
    while ((m = re.exec(src))) {
      const roots = m[2].match(/"([^"]+)"/g).map(s => s.slice(1, -1));
      (wubi[m[1]] = wubi[m[1]] || []).push({ file: f, roots, comp: !!m[3] });
    }
  }
  // stroke count of a root: RADICAL-like counts via bundle char itself
  const rootStrokes = (r) => (bundle[r] ? bundle[r].strokes.length : null);
  const out = [];
  for (const [ch, entries] of Object.entries(wubi)) {
    if (!bundle[ch]) continue;
    for (const ent of entries) {
      // flat-expand roots recursively (max depth 2) to locate `component`
      const expand = (roots, depth) => {
        const flat = [];
        for (const r of roots) {
          if (r === component) { flat.push(r); continue; }
          const sub = depth < 2 && wubi[r] && wubi[r][0] ? wubi[r][0].roots : null;
          if (sub && bundle[r] && bundle[r].strokes.length === sub.reduce((s, x) => s + (rootStrokes(x) || 0), 0)) {
            flat.push(...expand(sub, depth + 1));
          } else flat.push(r);
        }
        return flat;
      };
      const flat = expand(ent.roots, 0);
      const counts = flat.map(rootStrokes);
      if (counts.some(c => c === null)) continue;
      const total = counts.reduce((a, b) => a + b, 0);
      if (total !== bundle[ch].strokes.length) continue;
      let pos = 0;
      for (let i = 0; i < flat.length; i++) {
        if (flat[i] === component) {
          const strokes = bundle[ch].strokes.slice(pos, pos + counts[i]);
          const medians = (bundle[ch].medians || []).slice(pos, pos + counts[i]);
          const bs = strokes.map(strokeBBox);
          const bb = {
            x0: Math.min(...bs.map(b => b.x0)), x1: Math.max(...bs.map(b => b.x1)),
            y0: Math.min(...bs.map(b => b.y0)), y1: Math.max(...bs.map(b => b.y1)),
          };
          out.push({ ch, file: ent.file, range: [pos, pos + counts[i]], bbox: bb, w: +(bb.x1 - bb.x0).toFixed(0), h: +(bb.y1 - bb.y0).toFixed(0) });
        }
        pos += counts[i];
      }
    }
  }
  // dedupe by ch, sort by size
  const seen = new Set();
  return out.filter(d => !seen.has(d.ch) && seen.add(d.ch)).sort((a, b) => b.w * b.h - a.w * a.h);
}

// ---------------- build / install ----------------
function buildEntry(cfg) {
  const bundle = loadBundle();
  const strokes = [], medians = [], report = [];
  // pre-pass: group transforms (strokes sharing `group` + `fit` are mapped by their COMBINED bbox)
  const groupXf = {};
  for (const s of cfg.strokes) {
    if (!s.group || !s.fit) continue;
    if (groupXf[s.group]) continue;
    const members = cfg.strokes.filter(x => x.group === s.group && x.donor === s.donor);
    const bs = members.map(x => strokeBBox(bundle[x.donor].strokes[x.index]));
    const B = {
      x0: Math.min(...bs.map(b => b.x0)), x1: Math.max(...bs.map(b => b.x1)),
      y0: Math.min(...bs.map(b => b.y0)), y1: Math.max(...bs.map(b => b.y1)),
    };
    const sx = (s.fit.x1 - s.fit.x0) / (B.x1 - B.x0), sy = (s.fit.y1 - s.fit.y0) / (B.y1 - B.y0);
    groupXf[s.group] = { sx, tx: s.fit.x0 - B.x0 * sx, sy, ty: s.fit.y0 - B.y0 * sy, bbox: B };
  }
  for (const s of cfg.strokes) {
    const donor = bundle[s.donor];
    if (!donor) throw new Error(`donor ${s.donor} not in bundle`);
    if (s.index >= donor.strokes.length) throw new Error(`${s.donor} has no stroke ${s.index}`);
    let d = donor.strokes[s.index], m = (donor.medians || [])[s.index] || [];
    let mode;
    const gxf = s.group && s.fit ? groupXf[s.group] : null;
    if (gxf) {
      d = xformPath(d, gxf.sx, gxf.tx, gxf.sy, gxf.ty);
      m = xformMedian(m, gxf.sx, gxf.tx, gxf.sy, gxf.ty);
      mode = `groupFit(sx=${gxf.sx.toFixed(3)},sy=${gxf.sy.toFixed(3)})`;
    } else if (s.t) {
      mode = `translate(${s.t.tx},${s.t.ty})`;
      d = xformPath(d, 1, s.t.tx || 0, 1, s.t.ty || 0);
      m = xformMedian(m, 1, s.t.tx || 0, 1, s.t.ty || 0);
    } else if (s.fit) {
      const b = strokeBBox(donor.strokes[s.index]);
      const sx = (s.fit.x1 - s.fit.x0) / (b.x1 - b.x0), sy = (s.fit.y1 - s.fit.y0) / (b.y1 - b.y0);
      d = xformPath(d, sx, s.fit.x0 - b.x0 * sx, sy, s.fit.y0 - b.y0 * sy);
      m = xformMedian(m, sx, s.fit.x0 - b.x0 * sx, sy, s.fit.y0 - b.y0 * sy);
      mode = `fit(sx=${sx.toFixed(3)},sy=${sy.toFixed(3)})`;
    } else { mode = 'copy'; }
    if (s.widenX || s.widenY) {
      const b = strokeBBox(d);
      if (s.widenX) {
        const k = s.widenX / (b.x1 - b.x0);
        if (k > 1.01) { d = xformPath(d, k, b.x0 * (1 - k), 1, 0); m = xformMedian(m, k, b.x0 * (1 - k), 1, 0); mode += ` +widenX(k=${k.toFixed(2)})`; }
      }
      if (s.widenY) {
        const b2 = strokeBBox(d);
        const k = s.widenY / (b2.y1 - b2.y0);
        if (k > 1.01) { d = xformPath(d, 1, 0, k, b2.y0 * (1 - k)); m = xformMedian(m, 1, 0, k, b2.y0 * (1 - k)); mode += ` +widenY(k=${k.toFixed(2)})`; }
      }
    }
    strokes.push(d); medians.push(m);
    const nb = strokeBBox(d);
    const w = nb.x1 - nb.x0, h = nb.y1 - nb.y0;
    // weight check only for straight-ish strokes (bbox aspect agrees with median orientation)
    let o = null, thick = 0, len = 0;
    if (s.nocheck) { o = null; }
    else if (h < w / 2.5) { o = 'H'; thick = h; len = w; }
    else if (w < h / 2.5) { o = 'V'; thick = w; len = h; }
    const nv = o ? normFor(o, len) : null;
    const flag = nv === null ? '' : (thick < nv * 0.75 ? ' THIN!' : thick > nv * 1.45 ? ' FAT?' : '');
    report.push({ name: s.name || '', mode, bbox: nb, orient: o, thick: +thick.toFixed(0), len: +len.toFixed(0), norm: nv && +nv.toFixed(0), flag });
  }
  // total bbox
  const bs = strokes.map(strokeBBox);
  const T = {
    x0: Math.min(...bs.map(b => b.x0)), x1: Math.max(...bs.map(b => b.x1)),
    y0: Math.min(...bs.map(b => b.y0)), y1: Math.max(...bs.map(b => b.y1)),
  };
  return { entry: { strokes, medians }, report, total: T };
}

function previewHTML(cfg, built) {
  const bundle = loadBundle();
  const refs = [...new Set(cfg.strokes.map(s => s.donor))];
  const refDivs = refs.map(r => `<div class="lbl">${r}(donor)</div><div class="box" id="ref_${r.charCodeAt(0)}"></div>`).join('');
  const refScript = refs.map(r => `document.getElementById('ref_${r.charCodeAt(0)}').innerHTML = svgOf(DATA['${r}']);`).join('\n');
  const all = Object.fromEntries(refs.map(r => [r, bundle[r]]));
  all['__NEW__'] = built.entry || built;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#fff;font-family:sans-serif}
.row{display:flex;align-items:center;gap:8px;padding:4px 8px}
.box{width:300px;height:300px;border:1px solid #999;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.box svg{width:280px;height:280px}
.lbl{font-size:14px;width:90px}
</style></head><body><div class="row">
<div class="lbl">${cfg.char}(new)</div><div class="box" id="nw"></div>${refDivs}
</div><script>
const DATA = ${JSON.stringify(all)};
function svgOf(e){let s='<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(0,900) scale(1,-1)" fill="#222">';
for(const d of e.strokes)s+='<path d="'+d+'"/>';return s+'</g></svg>';}
document.getElementById('nw').innerHTML=svgOf(DATA['__NEW__']);
${refScript}
</script></body></html>`;
}

function cmdBuild(cfgPath) {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const { entry, report, total } = buildEntry(cfg);
  fs.mkdirSync(OUT, { recursive: true });
  const base = path.join(OUT, cfg.char.charCodeAt(0).toString(16));
  fs.writeFileSync(base + '.entry.json', JSON.stringify(entry));
  fs.writeFileSync(base + '.preview.html', previewHTML(cfg, entry));
  console.log(`== ${cfg.char} build report ==`);
  for (const r of report) {
    console.log(`${(r.name || '').padEnd(4)} ${r.mode.padEnd(28)} x[${r.bbox.x0.toFixed(0)},${r.bbox.x1.toFixed(0)}] y[${r.bbox.y0.toFixed(0)},${r.bbox.y1.toFixed(0)}] ${r.orient} thick=${r.thick} len=${r.len}${r.norm ? ' norm=' + r.norm : ''}${r.flag}`);
  }
  const bad = report.filter(r => r.flag);
  console.log(`TOTAL: x[${total.x0.toFixed(0)},${total.x1.toFixed(0)}] y[${total.y0.toFixed(0)},${total.y1.toFixed(0)}] aspect=${((total.x1 - total.x0) / (total.y1 - total.y0)).toFixed(3)}`);
  console.log(bad.length ? `WEIGHT ISSUES: ${bad.length}` : 'weights OK');
  console.log('entry:', base + '.entry.json');
  console.log('preview:', base + '.preview.html');
  return bad.length === 0;
}

function cmdInstall(cfgPath) {
  const ok = cmdBuild(cfgPath);
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const base = path.join(OUT, cfg.char.charCodeAt(0).toString(16));
  const entry = JSON.parse(fs.readFileSync(base + '.entry.json', 'utf8'));
  if (!ok) { console.error('BLOCKED: fix weight issues first (or delete this check in forge.js cmdInstall).'); process.exit(2); }
  const key = `"${cfg.char}":`;
  let src = fs.readFileSync(BUNDLE, 'utf8');
  const idx = src.indexOf(key);
  let newSrc, pos, replaceMode = idx >= 0;
  if (replaceMode) {
    let i = src.indexOf('{', idx + key.length);
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
      }
    }
    const oldCount = JSON.parse(src.slice(i, end)).strokes.length;
    if (oldCount !== entry.strokes.length) { console.error(`stroke count mismatch: old ${oldCount} vs new ${entry.strokes.length}`); process.exit(1); }
    if (src.slice(end, end + 1) !== ',') { console.error('no trailing comma after entry'); process.exit(1); }
    pos = i; newSrc = JSON.stringify(entry); src = src.slice(0, i) + newSrc + src.slice(end);
  } else {
    // insert as first key of window.STROKE_DATA
    const anchor = 'TA={';
    const a = src.indexOf(anchor);
    if (a < 0) { console.error('bundle anchor TA={ not found'); process.exit(1); }
    pos = a + anchor.length;
    newSrc = '\n"' + cfg.char + '":' + JSON.stringify(entry) + ',';
    src = src.slice(0, pos) + newSrc + src.slice(pos);
  }
  const bak = BUNDLE + '.bak_' + cfg.char.charCodeAt(0).toString(16);
  fs.copyFileSync(BUNDLE, bak);
  fs.writeFileSync(BUNDLE, src, 'utf8');
  // verify
  const re = extractObj(fs.readFileSync(BUNDLE, 'utf8'), 'TA=');
  const same = JSON.stringify(re.obj[cfg.char]) === JSON.stringify(entry);
  console.log(`${replaceMode ? 'replaced' : 'inserted'} ${cfg.char}. backup: ${bak}. verify: ${same ? 'OK' : 'FAIL'}`);
  if (fs.existsSync(path.join(__dirname, 'bundle_cache.json'))) fs.unlinkSync(path.join(__dirname, 'bundle_cache.json'));
}

// ---------------- main ----------------
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'norm') buildNorms();
else if (cmd === 'donors') {
  const list = findDonors(args[0]);
  const minW = +(args[1] || 0), minH = +(args[2] || 0);
  for (const d of list) {
    if (d.w < minW || d.h < minH) continue;
    console.log(`${d.ch} [${d.file}] strokes ${d.range[0]}-${d.range[1] - 1} bbox ${d.w}x${d.h} x[${d.bbox.x0.toFixed(0)},${d.bbox.x1.toFixed(0)}] y[${d.bbox.y0.toFixed(0)},${d.bbox.y1.toFixed(0)}]`);
  }
  console.log(`(${list.length} donors)`);
} else if (cmd === 'build') cmdBuild(args[0]);
else if (cmd === 'install') cmdInstall(args[0]);
else console.log('usage: node forge.js norm|donors <comp>|build <cfg>|install <cfg>');
