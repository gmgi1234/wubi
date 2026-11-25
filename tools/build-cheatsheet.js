// Build the 25-key cheat sheet (A4 PDF) and a phone wallpaper (PNG).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const W = 'D:/Users/10061/Downloads/wubi';
const OUT = `${W}/tools/products`;
fs.mkdirSync(OUT, { recursive: true });

function load(file, name) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { console, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(`${code};globalThis.__d = ${name};`, sandbox);
  return sandbox.globalThis.__d;
}

const ko = load(`${W}/data/wubi_roots_all.js`, 'WUBI_KOuju_86');
const table = load(`${W}/data/wubi_roots_all.js`, 'WUBI_ROOT_TABLE_86');
const names = load(`${W}/data/wubi_roots_all.js`, 'KEY_NAMES');

const LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function rootsOf(key) {
  const raw = table[key] || '';
  const items = raw.match(/\[[^\]]+\]|./gu) || [];
  return items.map((s) => s.replace(/^\[|\]$/g, ''));
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const usedKeys = 'GFDSAHJKLMTREWQYUIOPNBVCX'.split('');
const rows = usedKeys.map((k) => {
  const roots = rootsOf(k).slice(0, 9).join(' ');
  return `<tr><td class="k">${k}</td><td class="n">${esc(names[k] || '')}</td><td class="j">${esc(ko[k] || '')}</td><td class="r">${esc(roots)}</td></tr>`;
}).join('');

const kb = LAYOUT.map((line, idx) => {
  const cells = line.map((k) => {
    const n = names[k] || '';
    return `<div class="key"><div class="kl">${k}</div><div class="kn">${esc(n)}</div></div>`;
  }).join('');
  return `<div class="kbrow" style="margin-left:${idx * 14}px">${cells}</div>`;
}).join('');

const sheet = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 10mm; }
  body { font-family: 'KaiTi','楷体','STKaiti',serif; color:#1f2430; margin:0; }
  h1 { font-size: 22pt; margin: 0 0 2mm; letter-spacing: 1mm; }
  .sub { font-size: 9pt; color:#6b7486; margin-bottom: 5mm; }
  .kbrow { display:flex; gap:2.2mm; margin-bottom:2.2mm; }
  .key { width: 15mm; height: 15mm; border:0.4mm solid #2b3444; border-radius:2mm; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .kl { font-size: 11pt; font-weight:700; line-height:1; }
  .kn { font-size: 7.5pt; color:#5b6472; margin-top:0.8mm; }
  table { width:100%; border-collapse: collapse; margin-top:4mm; }
  th,td { border:0.25mm solid #d9dde4; padding:1.1mm 1.6mm; font-size:8.6pt; vertical-align:middle; }
  th { background:#1f2937; color:#fff; font-weight:600; }
  td.k { width:8mm; text-align:center; font-weight:700; font-size:10pt; }
  td.n { width:10mm; text-align:center; }
  td.j { width:42mm; }
  td.r { color:#3d4657; }
  .foot { margin-top:4mm; font-size:8pt; color:#9aa2ae; display:flex; justify-content:space-between; }
</style></head><body>
  <h1>五笔字根速查表 · 86 版</h1>
  <div class="sub">25 个键位 · 口诀 + 字根 · wubi.netlify.app</div>
  ${kb}
  <div style="font-size:8pt;color:#8a929e;margin-top:2mm">Z 为万能键（无字根），25 个键位从 G 到 X</div>
  <table><thead><tr><th>键</th><th>键名</th><th>口诀</th><th>字根</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="foot"><span>字体：楷体 · A4 打印</span><span>数据来源：Make Me a Hanzi（Arphic Public License）</span></div>
</body></html>`;

const GROUPS = [
  ['横区', 'GFDSA'],
  ['竖区', 'HJKLM'],
  ['撇区', 'TREWQ'],
  ['捺区', 'YUIOP'],
  ['折区', 'NBVCX'],
];

const wallpaper = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:2400px; background:#0f1117; color:#e8ecf4;
    font-family:'KaiTi','楷体','STKaiti',serif; display:flex; flex-direction:column; padding:60px 54px 40px; }
  h1 { font-size:64px; letter-spacing:6px; }
  .sub { font-size:24px; color:#8b95a8; margin-top:10px; letter-spacing:2px; }
  .groups { margin-top:34px; display:flex; flex-direction:column; gap:18px; flex:1; justify-content: space-between; }
  .group { display:flex; flex-direction:column; gap:8px; }
  .gt { font-size:20px; color:#5d6678; letter-spacing:4px; }
  .row { display:flex; align-items:center; gap:18px; background:#151922; border-left:4px solid #2f6f8f; border-radius:6px; padding:7px 16px; }
  .kl { width:44px; font-size:30px; font-weight:700; color:#7dd3fc; text-align:center; }
  .kn { width:44px; font-size:24px; color:#e8ecf4; }
  .kr { flex:1; font-size:19px; color:#9aa4b6; letter-spacing:1px; }
  .foot { margin-top:16px; font-size:20px; color:#5d6678; display:flex; justify-content:space-between; }
</style></head><body>
  <h1>五笔字根</h1>
  <div class="sub">86 版 · 25 键速查</div>
  <div class="groups">
  ${GROUPS.map(([name, keys]) => `<div class="group"><div class="gt">${name}</div>${keys.split('').map((k) => {
    const roots = rootsOf(k).slice(0, 10).join(' ');
    return `<div class="row"><div class="kl">${k}</div><div class="kn">${esc(names[k] || '')}</div><div class="kr">${esc(roots)}</div></div>`;
  }).join('')}</div>`).join('')}
  </div>
  <div class="foot"><span>wubi.netlify.app</span><span>86 版</span></div>
</body></html>`;
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 2400 }, deviceScaleFactor: 2 });

  await page.setContent(sheet, { waitUntil: 'load' });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.pdf({ path: path.join(OUT, '五笔字根速查表_86版.pdf'), format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  await page.screenshot({ path: path.join(OUT, 'preview-cheatsheet.png') });
  console.log('pdf ok');

  await page.setContent(wallpaper, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, '五笔字根壁纸_86版.png'), fullPage: false });
  console.log('wallpaper ok');

  await browser.close();
})();




