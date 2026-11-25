// Align the site's expanded root names with the PUA characters in the chaizi database.
// Output: tools/root-pua-map.json  { "pua char": { "name": ..., "pua": "U+E1xx", votes, total } }
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const CHAIZI = path.join(ROOT, 'qingfeng/WindInput/schemas/wubi06_chaizi_pua.txt');

// 1) chaizi: char -> array of PUA root characters
const chaizi = new Map();
for (const line of fs.readFileSync(CHAIZI, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const parts = line.split('\t');
  if (parts.length < 2) continue;
  const ch = parts[0];
  if ([...ch].length !== 1) continue;
  const roots = [...parts[1].replace(/\s+/g, '')];
  if (roots.length) chaizi.set(ch, roots);
}
console.log('chaizi chars:', chaizi.size);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.resolve(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const chars = Object.keys(tables.v86);

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/20261122wubi-stroke-colorV24.17.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  const samples = [];
  let matched = 0;
  let mismatched = 0;
  let missing = 0;

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const pua = chaizi.get(ch);
    if (!pua) { missing += 1; continue; }
    const expanded = await page.evaluate((c) => {
      try {
        const w = WUBI_86[c];
        if (!w || !w.r) return null;
        return recursivelyExpandRoots(w.r, c);
      } catch (e) { return null; }
    }, ch);
    if (!expanded) { missing += 1; continue; }
    if (expanded.length !== pua.length) { mismatched += 1; continue; }
    samples.push({ ch, expanded, pua });
    if (samples.length >= 4000) break;
  }

  console.log('samples', samples.length, 'mismatched', mismatched, 'missing', missing);

  // 2) vote: pua char -> root name
  const votes = new Map();
  for (const { expanded, pua } of samples) {
    for (let k = 0; k < pua.length; k += 1) {
      const p = pua[k];
      const name = expanded[k];
      if (!p || !name) continue;
      if (!votes.has(p)) votes.set(p, new Map());
      const m = votes.get(p);
      m.set(name, (m.get(name) || 0) + 1);
    }
  }

  const out = {};
  let resolved = 0;
  let ambiguous = 0;
  for (const [p, m] of votes) {
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, e) => s + e[1], 0);
    const [name, best] = sorted[0];
    const second = sorted[1] ? sorted[1][1] : 0;
    const confident = best >= 3 && best >= second * 3;
    out[p] = {
      name,
      pua: 'U+' + p.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
      votes: best,
      total,
      confident,
      alts: sorted.slice(1, 4).map(([n, v]) => [n, v]),
    };
    if (confident) resolved += 1;
    else ambiguous += 1;
  }

  fs.writeFileSync(path.join(ROOT, 'tools/root-pua-map.json'), JSON.stringify(out, null, 1), 'utf8');
  console.log('PUA chars seen:', Object.keys(out).length, '| confident:', resolved, '| ambiguous:', ambiguous);
  const sampleRows = Object.values(out).filter((v) => v.confident).slice(0, 12);
  for (const r of sampleRows) console.log('  ', r.name, '->', r.pua, `(${r.votes}/${r.total})`);

  await browser.close();
  server.close();
});
