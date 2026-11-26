// 验证单字页「下一个」跳转目标
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await page.goto(`http://127.0.0.1:${port}/char/${encodeURIComponent('大')}.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const link = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => x.textContent.includes('人'));
    return a ? a.getAttribute('href') : null;
  });
  console.log('大 页的「下一个」链接:', link);
  await page.click(`a[href="${link}"]`);
  await page.waitForTimeout(900);
  console.log('跳转后 URL:', decodeURIComponent(page.url().split('/').pop()));
  console.log('新页面有键位表:', await page.evaluate(() => document.body.textContent.includes('涉及的键位')));
  await browser.close();
  server.close();
});
