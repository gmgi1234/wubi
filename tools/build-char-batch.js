// Batch-build character pages (one browser session) from tools/char-meta.json.
// Usage: node build-char-batch.js [count]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const OUT = path.join(ROOT, 'site', 'char');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'char-meta.json'), 'utf8'));
const chars = Object.keys(meta);
const limit = Number(process.argv[2] || chars.length);

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

function pageHtml(ch, info, m) {
  const legend = [];
  const seen = new Set();
  for (const s of info.strokes || []) {
    const ri = info.map[s.i];
    if (ri === undefined || ri < 0 || seen.has(ri)) continue;
    seen.add(ri);
    legend.push({ ri, color: s.fill });
  }
  const roots86 = info['86'].roots.join(' + ');
  const isFragmentName = (name) => {
    const chars = [...String(name)];
    return chars.length !== 1 || chars[0].codePointAt(0) > 0xffff;
  };
  const fragmentSvg = (ri, color, size = 22) => {
    const map = info.map || [];
    const paths = [];
    for (let si = 0; si < map.length; si += 1) {
      if (map[si] !== ri) continue;
      const s = (info.strokes || []).find((x) => x.i === si);
      if (s && s.d) paths.push(s.d);
    }
    if (!paths.length) return '';
    return `<svg class="frag" viewBox="0 0 1024 1024" width="${size}" height="${size}"><g transform="translate(0,900) scale(1,-1)">${paths.map((d) => `<path d="${d}" fill="${color}"/>`).join('')}</g></svg>`;
  };
  const legendHtml = legend.filter((l) => info['86'].roots[l.ri]).map((l) => {
    const name = info['86'].roots[l.ri];
    const frag = isFragmentName(name) ? fragmentSvg(l.ri, l.color) : '';
    return `<span class="chip"><i style="background:${l.color}"></i>${frag}${esc(name)}</span>`;
  }).join('');

  const rows = ['86', '98', '06'].map((v) => {
    const ver = v === '86' ? '86 版' : v === '98' ? '98 版' : '新世纪';
    return `<tr><th>${ver}</th><td class="code">${esc(info[v].code || '—')}</td><td>${esc(info[v].roots.join(' + ') || '—')}</td></tr>`;
  }).join('');

  const ex = info.explain;
  let ruleHtml = '';
  if (ex && ex.split && ex.split.length) {
    const parts = [`<p>拆分表拆为：<strong>${esc(ex.split.join(' + '))}</strong>。</p>`];
    if (ex.subs && ex.subs.length) {
      parts.push(`<p>其中 ${ex.subs.map((s) => `${esc(s.root)} → ${esc(s.ex.join(' + '))}`).join('；')}，继续展开。</p>`);
    }
    parts.push(`<p>展开后共 ${ex.items.length} 个字根：${ex.items.map((it) => `${esc(it.root)}${it.letter ? '（' + esc(it.letter) + '）' : ''}`).join('、')}。</p>`);
    parts.push(`<p>编码：<code>${esc(ex.code)}</code></p>`);
    ruleHtml = `<h2>取码规则</h2>\n<div class="rule">\n${parts.join('\n')}\n</div>`;
  }

  const wordsHtml = (m.words && m.words.length)
    ? m.words.map((w) => `<a class="word" href="/?q=${encodeURIComponent(w)}">${esc(w)}</a>`).join('')
    : '<span class="muted">暂无</span>';
  const relatedHtml = (m.related && m.related.length)
    ? m.related.map((c) => `<a class="rel" href="/char/${encodeURIComponent(c)}.html">${esc(c)}</a>`).join('')
    : '<span class="muted">暂无</span>';

  const title = `${ch}字五笔怎么打？86/98/新世纪编码与拆分`;
  const pinyin = info.pinyin;

  return `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · 五笔字根</title>
<meta name="description" content="「${esc(ch)}」的五笔编码：86版 ${esc(info['86'].code)}，98版 ${esc(info['98'].code)}，新世纪 ${esc(info['06'].code)}；字根拆分 ${esc(roots86)}。附笔画着色图片、取码规则、常用词组与相关字。">
<link rel="canonical" href="https://wubi.iqiusuo.cn/char/${encodeURIComponent(ch)}.html">
<style>
  :root { --ink:#1f2430; --muted:#6b7486; --line:#e3e7ee; --bg:#fff; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:14px 20px; display:flex; justify-content:space-between; align-items:center; }
  header a { color:var(--muted); text-decoration:none; font-size:15px; }
  main { max-width:900px; margin:0 auto; padding:26px 20px 60px; }
  h1 { font-size:34px; margin:0 0 6px; }
  .sub { color:var(--muted); font-size:16px; margin-bottom:24px; }
  .py { font-family:"Segoe UI",Arial,sans-serif; }
  .hero { display:flex; gap:30px; align-items:center; flex-wrap:wrap; margin-bottom:28px; }
  .art { width:340px; height:340px; border:1px solid var(--line); border-radius:14px; overflow:hidden; background:#fff; }
  .art svg { width:100%; height:100%; display:block; }
  .legend { flex:1; min-width:240px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .chip { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--line); border-radius:999px; padding:5px 13px; font-size:16px; }
  .chip i { width:14px; height:14px; border-radius:3px; display:inline-block; }
  .chip svg.frag { width:22px; height:22px; background:#fff; border-radius:4px; padding:1px; box-shadow:0 0 0 1px rgba(0,0,0,.08); }
  table { width:100%; border-collapse:collapse; margin:18px 0 28px; }
  th, td { border-bottom:1px solid var(--line); padding:12px 8px; text-align:left; font-size:18px; }
  th { width:110px; color:var(--muted); font-weight:400; }
  td.code { font-family:ui-monospace,Consolas,monospace; font-size:21px; letter-spacing:1px; }
  h2 { font-size:21px; margin:32px 0 12px; }
  p { margin:8px 0; }
  .words, .rels { display:flex; flex-wrap:wrap; gap:10px; }
  .word, .rel { border:1px solid var(--line); border-radius:8px; padding:7px 14px; font-size:17px; color:#2f6f8f; text-decoration:none; }
  .rel { font-size:22px; padding:4px 12px; }
  .links a { color:#2f6f8f; text-decoration:none; margin-right:14px; }
  .muted { color:var(--muted); }
  .rule { background:#fafbfd; border:1px solid var(--line); border-radius:12px; padding:16px 22px; }
  .rule p { margin:7px 0; }
  .rule code { font-family:ui-monospace,Consolas,monospace; font-size:19px; }
  .cta { margin-top:38px; border:1px solid var(--line); border-radius:14px; padding:20px 24px;
         display:flex; gap:18px; align-items:center; justify-content:space-between; flex-wrap:wrap; background:#f7fafc; }
  .cta a { background:#2f6f8f; color:#fff; text-decoration:none; padding:11px 20px; border-radius:9px; font-size:17px; white-space:nowrap; }
  footer { border-top:1px solid var(--line); padding:18px 20px; color:var(--muted); font-size:14px; text-align:center; }
</style>
</head><body>
<header><a href="/">五笔字根 · 笔画着色</a><a href="/">返回查字</a></header>
<main>
  <h1>「${esc(ch)}」的五笔编码与拆分</h1>
  <div class="sub">读音 <span class="py">${esc(pinyin || '—')}</span> · 三版编码对照 · 字根拆分 · 笔画着色</div>

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
  <p>输入 <code>${esc(info['86'].code)}</code> 即可打出「${esc(ch)}」（86 版）。98 版用 <code>${esc(info['98'].code)}</code>，新世纪版用 <code>${esc(info['06'].code)}</code>，在五笔大一统方案里三种都能出字。</p>

  ${ruleHtml}

  <h2>常用词组</h2>
  <div class="words">${wordsHtml}</div>

  <h2>相关字</h2>
  <div class="rels">${relatedHtml}</div>

  <h2>相关</h2>
  <p class="links">
    <a href="/">查其它字</a>
    <a href="/">三版编码对照</a>
    <a href="/">字根速查表</a>
  </p>

  <div class="cta">
    <div>
      <strong>想边看边学？</strong><br>
      在网页版里输入任意汉字，可以看到笔画着色、字根高亮、笔顺演示和三版对比。
    </div>
    <a href="https://wubi.iqiusuo.cn/">打开 wubi.iqiusuo.cn →</a>
  </div>
</main>
<footer>数据来源：Make Me a Hanzi（笔画）· Rime 五笔码表（编码）</footer>
</body></html>`;
}

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
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  fs.mkdirSync(OUT, { recursive: true });
  const started = Date.now();
  let done = 0;

  for (const ch of chars.slice(0, limit)) {
    const info = await page.evaluate(async (c) => {
      await loadAndRender(c);
      const w86 = WUBI_86[c] || {};
      const w98 = WUBI_98[c] || {};
      const w06 = WUBI_06[c] || {};
      const svg = document.querySelector('#char-svg');
      const strokes = [];
      svg.querySelectorAll('path').forEach((p) => {
        if (p.dataset.strokeIndex === undefined) return;
        strokes.push({ i: Number(p.dataset.strokeIndex), fill: p.getAttribute('fill'), d: p.getAttribute('d') });
      });
      const out = {
        '86': { code: w86.c || '', roots: w86.r || [] },
        '98': { code: w98.c || '', roots: w98.r || [] },
        '06': { code: w06.c || '', roots: w06.r || [] },
        svg: svg.outerHTML,
        strokes,
        map: Array.from(strokeRootMap || []),
        pinyin: (window.CC_PINYIN && window.CC_PINYIN[c]) || '',
        explain: null,
      };
      try {
        const split = w86.r || [];
        const expanded = recursivelyExpandRoots(split, c);
        const letters = (w86.c || '').split('');
        const items = expanded.map((root, i) => {
          let pos = -1;
          if (i < 3) pos = i;
          else if (i === expanded.length - 1 && expanded.length >= 4) pos = letters.length - 1;
          return { root, letter: pos >= 0 ? (letters[pos] || '') : '' };
        });
        const subs = [];
        for (const root of split) {
          const ex = recursivelyExpandRoots([root], c);
          if (ex.length > 1) subs.push({ root, ex });
        }
        out.explain = { split, expanded, code: w86.c || '', items, subs };
      } catch (e) { out.explain = null; }
      return out;
    }, ch);

    fs.writeFileSync(path.join(OUT, `${ch}.html`), pageHtml(ch, info, meta[ch] || {}), 'utf8');
    done += 1;
    if (done % 100 === 0) {
      const sec = (Date.now() - started) / 1000;
      console.log(`${done}/${limit} chars, ${sec.toFixed(0)}s, ${(done / sec).toFixed(1)}/s`);
    }
  }

  // sitemap for generated pages
  const urls = chars.slice(0, limit).map((c) => `  <url><loc>https://wubi.iqiusuo.cn/char/${encodeURIComponent(c)}.html</loc></url>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'sitemap-char.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');

  console.log('done', done, 'pages in', ((Date.now() - started) / 1000).toFixed(0), 's');
  await browser.close();
  server.close();
});
