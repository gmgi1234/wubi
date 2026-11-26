// 复现：切到 86/98 后词组字形是否消失
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  page.on('requestfailed', (r) => { if (r.url().includes('svg/')) console.log('404:', r.url().slice(-60)); });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.fill('#jumpInput', '回家');
  await page.press('#jumpInput', 'Enter');
  await page.waitForTimeout(1500);

  for (const ver of ['6', '8', '9']) {
    await page.click(`[data-ver="${ver}"]`);
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => ({
      slots: document.querySelectorAll('.zislot').length,
      filled: [...document.querySelectorAll('.zislot')].filter((s) => s.querySelector('svg')).length,
      code: document.getElementById('codline').textContent,
    }));
    console.log('版本', ver, JSON.stringify(info));
  }
  await browser.close();
  server.close();
});
