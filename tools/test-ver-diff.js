// 验证切换版本后编码与字根是否更新（用「不是」：06 dhjg / 86 gijg）
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.fill('#jumpInput', '不是');
  await page.press('#jumpInput', 'Enter');
  await page.waitForTimeout(1200);

  for (const ver of ['6', '8', '9']) {
    await page.click(`[data-ver="${ver}"]`);
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => ({
      code: document.getElementById('codline').textContent,
      kb: (document.querySelector('.kb-title') || {}).textContent,
    }));
    console.log('版本', ver, '→', info.code, '|', info.kb);
  }
  await browser.close();
  server.close();
});
