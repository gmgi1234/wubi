// Build the 25-key colouring practice book: HTML -> A4 PDF.
// Each key page: letter/mnemonic/roots + six characters (coloured reference + blank outline).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const W = 'D:/Users/10061/Downloads/wubi';
const OUT = `${W}/tools/book`;
const plan = JSON.parse(fs.readFileSync(`${W}/tools/book-plan.json`, 'utf8'));
const ROOT = path.resolve(W);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const cards = {};
  for (const key of plan) {
    for (const c of key.chars) {
      const ch = c.char;
      if (cards[ch]) continue;
      const svg = await page.evaluate(async (char) => {
        await loadAndRender(char);
        const el = document.querySelector('#char-svg');
        if (!el) return null;
        const colored = el.outerHTML;
        const clone = el.cloneNode(true);
        clone.querySelectorAll('path').forEach((p) => {
          if (!p.hasAttribute('data-stroke-index')) return;
          p.setAttribute('fill', '#ffffff');
          p.setAttribute('stroke', '#aab2bd');
          p.setAttribute('stroke-width', '3.2');
        });
        const rect = clone.querySelector('rect');
        if (rect) rect.setAttribute('fill', '#ffffff');
        return { colored, outline: clone.outerHTML };
      }, ch);
      cards[ch] = svg;
      process.stdout.write('.');
    }
  }
  console.log('\nrendered chars:', Object.keys(cards).length);

  const order = 'GFDSA HJKL MTREW QYUIOP NBVCX'.split(' ');
  const pageHtml = plan.map((k, idx) => {
    const chips = k.roots.map((r) => `<span class="chip">${esc(r)}</span>`).join('');
    const items = k.chars.map((c) => {
      const svg = cards[c.char] || {};
      return `<div class="card">
        <div class="pair">
          <div class="box">${svg.colored || ''}</div>
          <div class="box blank">${svg.outline || ''}</div>
        </div>
        <div class="meta"><b>${esc(c.char)}</b><span>${esc(c.code)}</span></div>
        <div class="roots">${esc((c.roots || []).join(' + '))}</div>
      </div>`;
    }).join('');
    return `<section class="page">
      <header class="head">
        <div class="keybox"><div class="letter">${k.key}</div><div class="keyname">${esc(k.name)}</div></div>
        <div class="headtext">
          <h2>${esc(k.key)} 键 · ${esc(k.name)}</h2>
          <p class="kuoju">${esc(k.kuoju)}</p>
          <div class="chips">${chips}</div>
        </div>
      </header>
      <div class="grid">${items}</div>
      <div class="practice-title">描红区 · 照着左边的颜色，把右边的字涂满</div>
      <div class="practice">${'<div class="pbox"></div>'.repeat(6)}</div>
      <footer class="foot">五笔字根涂色练习册 · 86 版 · 第 ${idx + 1} / 25 键</footer>
    </section>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>五笔字根涂色练习册</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'KaiTi','楷体','STKaiti',serif; color: #1f2430; background: #fff; }
    .page { width: 210mm; height: 297mm; padding: 12mm 12mm 10mm; position: relative; page-break-after: always; overflow: hidden; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .cover h1 { font-size: 40pt; line-height: 1.25; margin: 0 0 6mm; letter-spacing: 2mm; }
    .cover .sub { font-size: 15pt; color: #5b6472; margin-bottom: 12mm; }
    .cover .tag { font-size: 11pt; color: #8a929e; }
    .cover .bar { width: 120mm; height: 1.2mm; background: linear-gradient(90deg,#E74C3C,#FF9800,#27AE60,#3498DB); border-radius: 1mm; margin: 8mm 0; }
    .head { display: flex; gap: 6mm; align-items: center; border-bottom: 0.6mm solid #dfe3ea; padding-bottom: 4mm; }
    .keybox { width: 26mm; height: 26mm; border: 0.8mm solid #2b3444; border-radius: 3mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .letter { font-size: 20pt; font-weight: 700; line-height: 1; }
    .keyname { font-size: 11pt; color: #666; margin-top: 1mm; }
    .headtext h2 { margin: 0 0 1.5mm; font-size: 15pt; }
    .kuoju { margin: 0 0 2mm; font-size: 11pt; color: #3d4657; letter-spacing: 0.4mm; }
    .chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .chip { font-size: 9pt; border: 0.25mm solid #c9ced6; border-radius: 1mm; padding: 0.6mm 1.4mm; color: #4a5364; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm 4mm; margin-top: 6mm; }
    .practice-title { margin-top: 9mm; font-size: 10pt; color: #5b6472; letter-spacing: 0.3mm; }
    .practice { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 3mm; }
    .pbox { height: 52mm; border: 0.3mm dashed #b9c0ca; border-radius: 1.5mm;
      background-image: linear-gradient(#e6e9ef, #e6e9ef), linear-gradient(#e6e9ef, #e6e9ef);
      background-size: 0.25mm 100%, 100% 0.25mm; background-position: center, center; background-repeat: no-repeat; }
    .card { border: 0.3mm dashed #c9ced6; border-radius: 2.5mm; padding: 2.6mm 2.6mm 2mm; display: flex; flex-direction: column; align-items: center; }
    .pair { display: flex; gap: 1.6mm; }
    .box { width: 24mm; height: 24mm; border-radius: 1.5mm; overflow: hidden; background: #fff; }
    .box.blank { border: 0.3mm dashed #d6dbe3; }
    .box svg { width: 100%; height: 100%; display: block; }
    .meta { margin-top: 2mm; font-size: 11pt; display: flex; gap: 2mm; align-items: baseline; }
    .meta b { font-size: 14pt; }
    .meta span { font-size: 9pt; color: #5b6472; letter-spacing: 0.4mm; }
    .roots { font-size: 8pt; color: #8a929e; margin-top: 0.6mm; text-align: center; }
    .foot { position: absolute; left: 12mm; right: 12mm; bottom: 6mm; font-size: 8pt; color: #9aa2ae; display: flex; justify-content: space-between; }
    .hint { font-size: 9pt; color: #8a929e; margin-top: 4mm; }
  </style></head><body>
  <section class="page cover">
    <h1>五笔字根<br>涂色练习册</h1>
    <div class="bar"></div>
    <div class="sub">86 版 · 25 个键位 · 150 个常用字</div>
    <div class="tag">左侧彩色为参考，右侧空白图为涂色区</div>
    <div class="hint">按 G F D S A / H J K L M / T R E W Q / Y U I O P / N B V C X 顺序编排</div>
  </section>
  ${pageHtml}
  </body></html>`;

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/book.html`, html, 'utf8');
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.pdf({ path: `${OUT}/五笔字根涂色练习册_86版.pdf`, format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  console.log('pdf written');

  // preview screenshots of the first two pages
  const pages = await page.$$('.page');
  for (let i = 0; i < Math.min(2, pages.length); i += 1) {
    await pages[i].screenshot({ path: `${OUT}/preview-${i + 1}.png` });
  }
  console.log('previews written');
  await browser.close();
  server.close();
});



