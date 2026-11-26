// 审计：各长度词组里「该着色的字是否真的着色」
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const PALETTE = ['#E74C3C', '#FF9800', '#27AE60', '#3498DB'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

function expect(word) {
  const n = [...word].length;
  let cnt;
  if (n === 2) cnt = [2, 2];
  else if (n === 3) cnt = [1, 1, 2];
  else if (n === 4) cnt = [1, 1, 1, 1];
  else {
    cnt = [];
    for (let i = 0; i < n; i += 1) cnt.push(i < 3 ? 1 : (i === n - 1 ? 1 : 0));
  }
  const starts = [];
  let acc = 0;
  for (const c of cnt) { starts.push(acc); acc += c; }
  if (n >= 5) starts[n - 1] = 3;
  return { cnt, starts };
}

function rowsOf(n) {
  const f = path.join(ROOT, 'data', `practice-${n >= 6 ? 6 : n}.js`);
  const raw = fs.readFileSync(f, 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const report = [];
  for (let n = 2; n <= 6; n += 1) {
    const rows = rowsOf(n).slice(0, 120);
    let bad = 0;
    const samples = [];
    for (const row of rows) {
      const word = row[0];
      const exp = expect(word);
      await page.evaluate((r) => {
        const st = window.__pstate;
        st.pool = [{ w: r[0], c6: r[1], c86: r[2], c98: r[3], r6: r[4], r86: r[5], r98: r[6], keys: r[7] || '', cheng: r[8] || '', len: [...r[0]].length }];
        st.idx = 0; st.locked = false;
        window.__next();
      }, row);
      await page.waitForTimeout(140);
      const slots = await page.evaluate(() => [...document.querySelectorAll('.zislot')].map((s) => ({
        fills: [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff' && f !== 'none'))],
      })));

      const problems = [];
      slots.forEach((s, i) => {
        const k = exp.cnt[i];
        const want = k > 0 ? PALETTE[exp.starts[i] % 4].toUpperCase() : null;
        const hasPalette = s.fills.some((f) => PALETTE.includes(f.toUpperCase()));
        if (k > 0 && !hasPalette) problems.push(`第${i + 1}字未着色(应${want})`);
        if (k === 0 && hasPalette) problems.push(`第${i + 1}字不该着色`);
      });
      if (problems.length) {
        bad += 1;
        if (samples.length < 4) samples.push(word + ':' + problems.join(';'));
      }
    }
    report.push({ n, total: rows.length, bad, samples });
    console.log(`${n} 字词：检查 ${rows.length}，问题 ${bad}`, bad ? '| 例：' + samples.join(' | ') : '');
  }

  await browser.close();
  server.close();
});
