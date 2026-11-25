// 本地渲染新生成的单字页，检查版式
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.resolve(path.join(ROOT, p));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  for (const [p, name] of [['char/狗.html', 'new-char-gou'], ['char/犇.html', 'new-char-ben']]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
    await page.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({
      kb: Math.round(document.documentElement.innerHTML.length / 1024),
      glyphs: document.querySelectorAll('svg.glyph').length,
      frags: document.querySelectorAll('svg.frag').length,
    }));
    console.log(p, JSON.stringify(st), '| errs:', errs.join('|') || 'none');
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
  server.close();
});
