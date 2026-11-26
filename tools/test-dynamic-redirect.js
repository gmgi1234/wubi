// 验证 char.html?c= 会跳到静态完整页
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
  if (req.method === 'HEAD') { res.writeHead(200); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  for (const ch of ['大', '象', '狗']) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
    await page.goto(`http://127.0.0.1:${port}/char.html?c=${encodeURIComponent(ch)}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const url = decodeURIComponent(page.url());
    const hasKeyTable = await page.evaluate(() => document.body.textContent.includes('涉及的键位'));
    console.log(ch, '→', url.replace(`http://127.0.0.1:${port}/`, ''), '| 键位表:', hasKeyTable, '| err:', errs.join(';') || 'none');
    await page.close();
  }
  await browser.close();
  server.close();
});
