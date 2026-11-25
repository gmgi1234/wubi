// 检查键名字词组是否带虚线框（本地静态页 + 动态页）
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
  for (const [p, name] of [
    ['ci/' + encodeURIComponent('工人') + '.html', 'key-ci-gongren'],
    ['ci/' + encodeURIComponent('人民') + '.html', 'key-ci-renmin'],
    ['ci.html?w=' + encodeURIComponent('北京人'), 'key-dyn-beijingren'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const st = await page.evaluate(() => ({
      dashes: document.querySelectorAll('svg.glyph path[stroke-dasharray]').length,
      strokes: document.querySelectorAll('svg.glyph path[stroke]').length,
    }));
    console.log(name, JSON.stringify(st));
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, clip: { x: 0, y: 60, width: 900, height: 420 } });
    await page.close();
  }
  await browser.close();
  server.close();
});
