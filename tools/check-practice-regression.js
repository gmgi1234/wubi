// 练习页回归检查：格子数、虚线、配色是否符合规则
// 用法：node tools/check-practice-regression.js [--verbose]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const VERBOSE = process.argv.includes('--verbose');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

// ---------- 期望值计算（与页面规则一致） ----------
const tables = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tables.json'), 'utf8'));
const isKeyNameChar = (c) => {
  const r = (tables.v06[c] || {}).r || [];
  return r.length === 1 && r[0] === c;
};
const isChengChar = (c) => {
  const r = (tables.v06[c] || {}).r || [];
  return r.length >= 2 && r[0] === c;
};

function counts(n) {
  if (n === 2) return [2, 2];
  if (n === 3) return [1, 1, 2];
  if (n === 4) return [1, 1, 1, 1];
  const out = [];
  for (let i = 0; i < n - 1; i += 1) out.push(i < 3 ? 1 : 0);
  out[n - 1] = 1;
  return out;
}

function expectFor(word) {
  const chars = [...word];
  const cnt = counts(chars.length);
  const slots = [];
  chars.forEach((c, i) => {
    const k = cnt[i];
    if (k === 0) { slots.push({ c, k: 0, kind: 'none' }); return; }
    if (k >= 2 && isKeyNameChar(c)) {
      slots.push({ c, k, kind: 'key' });
    } else if (k >= 2 && isChengChar(c)) {
      slots.push({ c, k, kind: 'cheng' });
    } else {
      slots.push({ c, k, kind: 'normal' });
    }
  });
  return slots;
}

// ---------- 抽样 ----------
const samples = new Set([
  '中国', '我们', '无从', '从此', '很多', '产品', '双方', '哥哥', '森林', '发炎',
  '米饭', '大门', '西方', '一个', '王八', '北京人', '山水', '多少', '从来', '品种',
  '人口', '山林', '火焰', '三个', '品质', '商品', '双手', '晶片', '虫害',
  // 重复字根字（从 / 林 / 炎 / 品 / 多 / 双 / 哥…）与成字字根
  '因此', '服从', '林业', '炎症', '味精', '看待', '平行', '相互', '群体', '议论',
  '入口', '出口', '喜欢', '洪水', '火灾', '药方', '门口', '水面', '手心', '大米',
  '危机', '危机感'
]);

const PRACTICE_DATA = {};
for (let n = 2; n <= 6; n += 1) {
  const f = path.join(ROOT, 'data', `practice-${n}.js`);
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  PRACTICE_DATA[n] = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
}

// 题库里没有时，从词组数据里回退取记录
const WORD_BUCKETS = {};
function loadWordRecord(w) {
  const b = w.charCodeAt(0) % 64;
  if (!WORD_BUCKETS[b]) {
    const f = path.join(ROOT, 'data', `word-${b}.js`);
    if (!fs.existsSync(f)) return null;
    const raw = fs.readFileSync(f, 'utf8');
    try { WORD_BUCKETS[b] = JSON.parse(raw.slice(raw.indexOf('=') + 1).replace(/;\s*$/, '')); } catch (e) { return null; }
  }
  const rec = WORD_BUCKETS[b][w];
  if (!rec) return null;
  const chars = [...w];
  const keys = chars.map((c) => {
    const r = (tables.v06[c] || {}).r || [];
    return r.length === 1 && r[0] === c ? '1' : '0';
  }).join('');
  const cheng = chars.map((c) => {
    const r = (tables.v06[c] || {}).r || [];
    return r.length && r[0] === c ? '1' : '0';
  }).join('');
  const join = (arr) => (arr || []).join(' ');
  return [w, rec.c86, rec.c86, rec.c98, join(rec.r06), join(rec.r86), join(rec.r98), keys, cheng];
}

const rowOf = (w) => {
  const n = [...w].length;
  const rows = PRACTICE_DATA[n >= 6 ? 6 : n] || [];
  return rows.find((r) => r[0] === w) || loadWordRecord(w);
};

// ---------- 本地服务 + 浏览器 ----------
const MIME2 = MIME;
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME2[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1288\\chrome-win64\\chrome.exe',
    headless: true,
  }).catch(async () => chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  }));

  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const results = [];
  for (const w of samples) {
    const row = rowOf(w);
    if (!row) { results.push({ w, skipped: '题库里没有' }); continue; }
    await page.evaluate((arg) => {
      const st = window.__pstate;
      const r = arg.row;
      st.pool = [{ w: r[0], c6: r[1], c86: r[2], c98: r[3], r6: r[4], r86: r[5], r98: r[6], keys: r[7] || '', cheng: r[8] || '', len: [...r[0]].length }];
      st.idx = 0; st.locked = false;
      window.__next();
    }, { row, word: w });
    await page.waitForTimeout(450);

    const dom = await page.evaluate(() => [...document.querySelectorAll('.zislot')].map((s) => ({
      dashes: s.querySelectorAll('path[stroke-dasharray]').length,
      fills: [...new Set([...s.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))],
    })));

    const exp = expectFor(w);
    const problems = [];
    if (dom.length !== exp.length) problems.push(`格数 ${dom.length} ≠ 期望 ${exp.length}`);
    exp.forEach((e, i) => {
      const d = dom[i];
      if (!d) return;
      if (e.kind === 'key' && d.dashes === 0) problems.push(`第${i + 1}格（键名字）缺整字虚线`);
      if (e.kind === 'key' && d.fills.length === 0) problems.push(`第${i + 1}格（键名字）没上色`);
      if (e.kind === 'cheng' && d.dashes === 0) problems.push(`第${i + 1}格缺第二根虚线`);
      if (e.kind === 'normal' && d.dashes > 0) problems.push(`第${i + 1}格不该有虚线`);
    });
    results.push({ w, problems, slots: dom.length });
  }

  // 输出
  const failed = results.filter((r) => r.problems && r.problems.length);
  for (const r of results) {
    const tag = r.skipped ? 'SKIP' : r.problems.length ? 'FAIL' : 'PASS';
    if (tag === 'PASS' && !VERBOSE) continue;
    console.log(tag, r.w, r.skipped || (r.problems.length ? r.problems.join('; ') : `(${r.slots} 格)`));
  }
  console.log('');
  console.log(`共 ${results.length} 个样例，失败 ${failed.length} 个`);
  if (errs.length) console.log('页面报错:', errs.join(' | '));

  await browser.close();
  server.close();
  process.exit(failed.length ? 1 : 0);
});
