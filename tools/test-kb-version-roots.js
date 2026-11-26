// 验证切换版本后键盘字根是否真的变化
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
  await page.goto(`http://127.0.0.1:${port}/practice.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  for (const ver of ['6', '8', '9']) {
    await page.click(`[data-ver="${ver}"]`);
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => {
      const key = document.querySelector('.kb-key[data-k="W"]');
      const roots = key.querySelector('.kb-roots');
      return {
        title: document.querySelector('.kb-title').textContent,
        wRoots: roots.innerHTML.length,
        svgs: roots.querySelectorAll('svg').length,
        texts: roots.textContent.trim().slice(0, 10),
        sample: roots.innerHTML.slice(0, 80),
      };
    });
    console.log('版本', ver, '|', info.title, '| svg 数:', info.svgs, '| 文本:', info.texts, '| 长度:', info.wRoots);
  }
  await browser.close();
  server.close();
});
