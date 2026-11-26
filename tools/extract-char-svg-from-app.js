// 从主站应用里抓取「象」的三版 SVG，覆盖我们本地文件
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const CHAR = process.argv[2] || '象';

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);

  // 切到目标字
  await page.evaluate((ch) => {
    const input = document.getElementById('char-input');
    input.value = ch;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof window.renderChar === 'function') window.renderChar(ch);
  }, CHAR);
  await page.waitForTimeout(1500);

  for (const [ver, label] of [['86', '86'], ['98', '98'], ['06', '06']]) {
    // 切换版本
    await page.evaluate((v) => {
      if (typeof window.setWubiVersion === 'function') window.setWubiVersion(v);
      else {
        const btns = [...document.querySelectorAll('button')];
        const b = btns.find((x) => x.textContent.trim() === (v === '06' ? '新世纪' : v + ' 版'));
        if (b) b.click();
      }
    }, ver);
    await page.waitForTimeout(800);
    const svg = await page.evaluate(() => {
      const el = document.getElementById('char-svg');
      return el ? el.outerHTML : null;
    });
    if (!svg) { console.log(ver, '取不到 SVG'); continue; }
    const full = svg.replace('<svg id="char-svg"', '<svg xmlns="http://www.w3.org/2000/svg"');
    const out = path.join(ROOT, 'svg', `${CHAR}-${ver}.svg`);
    fs.writeFileSync(out, full, 'utf8');
    console.log(ver, '已写入', Math.round(full.length / 1024) + 'KB', '| path 数:', (full.match(/<path/g) || []).length);
  }
  await browser.close();
  server.close();
});
