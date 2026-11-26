// 测试：练习页切换版本后编码是否变化
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.fill('#jumpInput', '米饭');
  await page.press('#jumpInput', 'Enter');
  await page.waitForTimeout(1500);

  for (const ver of ['6', '8', '9']) {
    await page.click(`[data-ver="${ver}"]`);
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => ({
      code: document.getElementById('codline').textContent,
      slots: document.querySelectorAll('.zislot').length,
      kbTitle: (document.querySelector('.kb-title') || {}).textContent,
      firstKeyRoots: (document.querySelector('.kb-key .kb-roots') || {}).textContent,
    }));
    console.log('版本', ver, '→', JSON.stringify(info));
  }
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/practice-version-switch.png', clip: { x: 0, y: 60, width: 1200, height: 640 } });
  await browser.close();
  server.close();
});
