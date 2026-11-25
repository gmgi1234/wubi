// Build one 词组单页 as a sample. Usage: node build-word-page-one.js 花园
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const OUT = path.join(ROOT, 'site', 'ci');
const word = process.argv[2] || '花园';
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tables.json'), 'utf8'));

const codeOf = (v, c) => (tables[v][c] || {}).c || '';
const rootsOf = (v, c) => (tables[v][c] || {}).r || [];
function wordCode(chars, v) {
  const codes = chars.map((c) => codeOf(v, c));
  if (codes.some((x) => !x)) return '';
  const n = chars.length;
  if (n === 2) return codes[0].slice(0, 2) + codes[1].slice(0, 2);
  if (n === 3) return codes[0][0] + codes[1][0] + codes[2].slice(0, 2);
  if (n === 4) return codes.map((x) => x[0]).join('');
  return codes[0][0] + codes[1][0] + codes[2][0] + codes[n - 1][0];
}
function wordRoots(chars, v) {
  const R = chars.map((c) => rootsOf(v, c));
  if (R.some((r) => !r.length)) return [];
  const n = chars.length;
  if (n === 2) return [...R[0].slice(0, 2), ...R[1].slice(0, 2)];
  if (n === 3) return [R[0][0], R[1][0], ...R[2].slice(0, 2)];
  if (n === 4) return R.map((r) => r[0]);
  return [R[0][0], R[1][0], R[2][0], R[n - 1][0]];
}

const chars = [...word];
const c86 = wordCode(chars, 'v86');
const c98 = wordCode(chars, 'v98');
const c06 = wordCode(chars, 'v06');
const r86 = wordRoots(chars, 'v86');
const r98 = wordRoots(chars, 'v98');
const r06 = wordRoots(chars, 'v06');

console.log(word, { c86, c98, c06, r86, r98, r06 });

const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#2980B9'];
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const lenLabel = (n) => (n === 2 ? '双字词' : n === 3 ? '三字词' : n === 4 ? '四字词' : n === 5 ? '五字词' : '六字词');
const ruleText = (n) => (n === 2 ? '双字词：每个字取前两码' : n === 3 ? '三字词：前两字各取首码，最后一字取前两码'
  : n === 4 ? '四字词：每个字取首码' : '五字及以上：前三字各取首码，最后一字取首码');

const card = (label, code, roots) => `<div class="vcard">
  <div class="vhead"><span class="vtag">${label}</span><span class="vcode">${[...code].map((L, i) => `<span style="color:${PALETTE[i % 4]}">${esc(L)}</span>`).join('')}</span></div>
  <div class="vroots">${roots.map((r, i) => `<span style="color:${PALETTE[i % 4]}">${esc(r)}</span>`).join('<span class="plus">+</span>')}</div>
</div>`;

const related = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'words.json'), 'utf8'))
  .filter((x) => x.chars[0] === chars[0] && x.w !== word).slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(word)}五笔怎么打？86/98/新世纪编码与拆分 · 五笔字根</title>
<meta name="description" content="「${esc(word)}」的五笔编码：86版 ${esc(c86)}，98版 ${esc(c98)}，新世纪 ${esc(c06)}。${ruleText(chars.length)}。">
<link rel="canonical" href="https://wubi.iqiusuo.cn/ci/${encodeURIComponent(word)}.html">
<style>
  :root { --ink:#2a2320; --muted:#8a7b6c; --line:#e6dcc9; --bg:#fbf7ef; --accent:#a33c2f; --paper:#fffdf8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:'KaiTi','楷体','STKaiti',serif; line-height:1.7; }
  header { border-bottom:1px solid var(--line); padding:12px 20px; display:flex; justify-content:space-between; font-size:15px; }
  header a { color:var(--muted); text-decoration:none; }
  main { max-width:900px; margin:18px auto 0; background:var(--paper); box-shadow:0 0 0 1px var(--line); border-radius:16px; padding:26px 22px 44px; }
  h1 { font-size:32px; margin:0 0 6px; letter-spacing:2px; }
  .sub { color:var(--muted); font-size:16px; margin-bottom:22px; }
  .vers { display:flex; gap:16px; flex-wrap:wrap; }
  .vcard { flex:1; min-width:240px; border:1px solid var(--line); border-radius:14px; padding:12px 14px; background:#fff; }
  .vhead { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
  .vtag { color:var(--muted); font-size:15px; }
  .vcode { font-family:ui-monospace,Consolas,monospace; font-size:22px; letter-spacing:3px; }
  .vroots { display:flex; flex-wrap:wrap; gap:5px; align-items:center; font-size:19px; }
  .plus { color:var(--muted); font-size:14px; }
  h2 { font-size:20px; margin:28px 0 10px; }
  .rule { background:#faf6ee; border:1px solid var(--line); border-radius:10px; padding:12px 16px; font-size:15px; }
  .rule p { margin:5px 0; }
  .chars { display:flex; gap:10px; flex-wrap:wrap; }
  .ch { width:52px; height:52px; display:flex; align-items:center; justify-content:center; font-size:28px;
        border:1px solid var(--line); border-radius:10px; background:#fff; color:var(--ink); text-decoration:none; }
  .words { display:flex; flex-wrap:wrap; gap:10px; }
  .word { border:1px solid var(--line); border-radius:8px; padding:7px 14px; font-size:18px; color:var(--accent); text-decoration:none; background:#fff; }
  .cta { margin-top:30px; border:1px solid var(--line); border-radius:14px; padding:18px 22px; display:flex; gap:16px; align-items:center; justify-content:space-between; flex-wrap:wrap; background:#fff; }
  .cta a.primary { background:var(--accent); color:#fff; text-decoration:none; padding:10px 18px; border-radius:9px; }
  footer { text-align:center; color:var(--muted); font-size:13px; padding:18px; }
  @media (max-width:640px){ h1{font-size:26px} main{padding:18px 14px 36px} .vcard{min-width:0} }
</style>
</head><body>
<header><a href="/">五笔字根 · 笔画着色</a><a href="../char/">全部单字</a></header>
<main>
  <h1>「${esc(word)}」的五笔编码与拆分</h1>
  <div class="sub">${lenLabel(chars.length)} · 三版编码对照</div>

  <div class="vers">
    ${card('86 版', c86, r86)}
    ${card('98 版', c98, r98)}
    ${card('新世纪', c06, r06)}
  </div>

  <h2>怎么拆</h2>
  <div class="rule">
    <p>${esc(word)} = ${chars.map((c) => esc(c)).join(' + ')}</p>
    <p>${ruleText(chars.length)}，所以：${r86.map((r, i) => `${esc(r)}（${esc(c86[i] || '')}）`).join(' + ')} → <strong>${esc(c86)}</strong></p>
  </div>

  <h2>单字拆分</h2>
  <div class="chars">${chars.map((c) => `<a class="ch" href="../char/${encodeURIComponent(c)}.html">${esc(c)}</a>`).join('')}</div>

  <h2>相关词组</h2>
  <div class="words">${related.map((x) => `<a class="word" href="${encodeURIComponent(x.w)}.html">${esc(x.w)}</a>`).join('') || '<span>暂无</span>'}</div>

  <div class="cta">
    <div><strong>想边看边学？</strong><br>在网页版里输入任意汉字，可以看到笔画着色、字根高亮和笔顺演示。</div>
    <a class="primary" href="https://wubi.iqiusuo.cn/">打开 wubi.iqiusuo.cn →</a>
  </div>
</main>
<footer>数据来源：Rime 五笔码表 · 五笔大一统方案</footer>
</body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${word}.html`);
fs.writeFileSync(file, html, 'utf8');
console.log('written', file, html.length, 'bytes');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const p = await browser.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const shot = path.join(ROOT, 'tools', 'compare', `word-${word}.png`);
  await p.screenshot({ path: shot, fullPage: true });
  console.log('screenshot', shot);
  await browser.close();
})();
