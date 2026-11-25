// Build one SEO character page (static HTML) and a preview screenshot.
// Usage: node build-char-page.js 王
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const OUT = path.join(ROOT, 'site', 'char');
const ch = process.argv[2] || '王';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(async (c) => {
    const versions = ['86', '98', '06'];
    const out = {};
    for (const v of versions) {
      await setWubiVersion(v);
      await new Promise((r) => setTimeout(r, 250));
      await loadAndRender(c);
      const w = (v === '86' ? WUBI_86 : v === '98' ? WUBI_98 : WUBI_06)[c] || {};
      out[v] = { code: w.c || '', roots: w.r || [] };
      if (v === '86') {
        const svg = document.querySelector('#char-svg');
        out.svg = svg ? svg.outerHTML : '';
        out.strokes = [];
        svg.querySelectorAll('path').forEach((p) => {
          if (p.dataset.strokeIndex === undefined) return;
          out.strokes.push({ i: Number(p.dataset.strokeIndex), fill: p.getAttribute('fill') });
        });
        out.map = (typeof strokeRootMap !== 'undefined' && strokeRootMap) ? Array.from(strokeRootMap) : [];
      }
    }
    out.pinyin = (window.CC_PINYIN && window.CC_PINYIN[c]) || '';
    return out;
  }, ch);

  await browser.close();
  server.close();

  // legend: root index -> colour (first stroke colour seen)
  const legend = [];
  const seen = new Set();
  for (const s of info.strokes || []) {
    const ri = info.map[s.i];
    if (ri === undefined || ri < 0 || seen.has(ri)) continue;
    seen.add(ri);
    legend.push({ ri, color: s.fill });
  }

  const roots86 = info['86'].roots.join(' + ');
  const code86 = info['86'].code;
  const pinyin = info.pinyin;
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  const legendHtml = legend.map((l) => {
    const name = info['86'].roots[l.ri] || '';
    return `<span class="chip"><i style="background:${l.color}"></i>${esc(name)}</span>`;
  }).join('');

  const rows = ['86', '98', '06'].map((v) => {
    const ver = v === '86' ? '86 版' : v === '98' ? '98 版' : '新世纪';
    return `<tr><th>${ver}</th><td class="code">${esc(info[v].code || '—')}</td><td>${esc(info[v].roots.join(' + ') || '—')}</td></tr>`;
  }).join('');

  const title = `${ch}字五笔怎么打？86/98/新世纪编码与拆分`;
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · 五笔字根</title>
<meta name="description" content="「${esc(ch)}」的五笔编码：86版 ${esc(code86)}，98版 ${esc(info['98'].code)}，新世纪 ${esc(info['06'].code)}；字根拆分 ${esc(roots86)}。附笔画着色图与笔顺。">
<link rel="canonical" href="https://wubi.iqiusuo.cn/char/${encodeURIComponent(ch)}.html">
<style>
  :root { --ink:#1f2430; --muted:#6b7486; --line:#e3e7ee; --bg:#fff; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:14px 20px; display:flex; justify-content:space-between; align-items:center; }
  header a { color:var(--muted); text-decoration:none; font-size:15px; }
  main { max-width:860px; margin:0 auto; padding:24px 20px 60px; }
  h1 { font-size:30px; margin:0 0 6px; }
  .sub { color:var(--muted); font-size:15px; margin-bottom:22px; }
  .hero { display:flex; gap:26px; align-items:center; flex-wrap:wrap; margin-bottom:26px; }
  .art { width:260px; height:260px; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; }
  .art svg { width:100%; height:100%; display:block; }
  .legend { flex:1; min-width:220px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .chip { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--line); border-radius:999px; padding:4px 12px; font-size:15px; }
  .chip i { width:13px; height:13px; border-radius:3px; display:inline-block; }
  table { width:100%; border-collapse:collapse; margin:18px 0 26px; }
  th, td { border-bottom:1px solid var(--line); padding:11px 8px; text-align:left; font-size:17px; }
  th { width:110px; color:var(--muted); font-weight:400; }
  td.code { font-family:ui-monospace,Consolas,monospace; font-size:20px; letter-spacing:1px; }
  h2 { font-size:20px; margin:30px 0 10px; }
  p { margin:8px 0; }
  .links a { color:#2f6f8f; text-decoration:none; margin-right:14px; }
  footer { border-top:1px solid var(--line); padding:18px 20px; color:var(--muted); font-size:14px; text-align:center; }
</style>
</head><body>
<header><a href="/">五笔字根 · 笔画着色</a><a href="/">返回查字</a></header>
<main>
  <h1>「${esc(ch)}」的五笔编码与拆分</h1>
  <div class="sub">读音 ${esc(pinyin || '—')} · 三版编码对照 · 字根拆分 · 笔画着色</div>

  <div class="hero">
    <div class="art">${info.svg}</div>
    <div class="legend">
      <p>字根拆分（86 版）：<strong>${esc(roots86)}</strong></p>
      <div class="chips">${legendHtml}</div>
    </div>
  </div>

  <h2>三版编码</h2>
  <table>${rows}</table>

  <h2>怎么打</h2>
  <p>输入 <code>${esc(code86)}</code> 即可打出「${esc(ch)}」（86 版）。98 版用 <code>${esc(info['98'].code)}</code>，新世纪版用 <code>${esc(info['06'].code)}</code>，在五笔大一统方案里三种都能出字。</p>

  <h2>相关</h2>
  <p class="links">
    <a href="/">查其它字</a>
    <a href="/">三版编码对照</a>
    <a href="/">字根速查表</a>
  </p>
</main>
<footer>数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）</footer>
</body></html>`;

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${ch}.html`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('written', file, html.length, 'bytes');

  // preview screenshot
  const browser2 = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const p2 = await browser2.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  await p2.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load' });
  await p2.waitForTimeout(400);
  const shot = path.join(ROOT, 'tools', 'compare', `char-page-${ch}.png`);
  await p2.screenshot({ path: shot, fullPage: true });
  console.log('screenshot', shot);
  await browser2.close();
});

