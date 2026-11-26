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
  for (const [u, name] of [
    ['char/' + encodeURIComponent('米') + '.html', 'mi-char'],
    ['ci/' + encodeURIComponent('米饭') + '.html', 'mi-word'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
    const err = [];
    page.on('pageerror', (e) => err.push(e.message.slice(0, 80)));
    const resp = await page.goto(`http://127.0.0.1:${port}/${u}`, { waitUntil: 'load' }).catch((e) => null);
    await page.waitForTimeout(500);
    console.log(name, '| 状态:', resp ? resp.status() : 'fail', err.join('|'));
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, clip: { x: 0, y: 0, width: 900, height: 420 } });
    await page.close();
  }
  await browser.close();
  server.close();
});
