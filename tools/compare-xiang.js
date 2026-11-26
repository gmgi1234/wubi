// 对比主站与本站「象」字的着色
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = path.resolve('D:/Users/10061/Downloads/wubi');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };
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

  // 主站
  const p1 = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  await p1.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 90000 });
  await p1.waitForTimeout(2500);
  const typed = await p1.evaluate((ch) => {
    const input = document.getElementById('char-input');
    if (!input) return 'no input';
    input.value = ch;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof window.renderChar === 'function') { try { window.renderChar(ch); } catch (e) {} }
    return 'typed';
  }, '象');
  await p1.waitForTimeout(1500);
  const mainFills = await p1.evaluate(() => {
    const paths = [...document.querySelectorAll('#canvas-area path, #char-svg path, svg path')]
      .map((p) => p.getAttribute('fill')).filter(Boolean);
    return [...new Set(paths)];
  });
  console.log('主站 象 fills:', mainFills.join(' '), '|', typed);
  await p1.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/xiang-main.png', clip: { x: 0, y: 80, width: 1200, height: 500 } });

  // 本站单字页
  const p2 = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
  await p2.goto(`http://127.0.0.1:${port}/char/${encodeURIComponent('象')}.html`, { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  const ours = await p2.evaluate(() => {
    const svg = document.querySelector('svg.glyph');
    return svg ? [...new Set([...svg.querySelectorAll('path')].map((p) => p.getAttribute('fill')).filter((f) => f && f !== '#fff'))] : [];
  });
  console.log('本站 象 fills:', ours.join(' '));
  await p2.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/xiang-ours.png', clip: { x: 0, y: 100, width: 1100, height: 460 } });

  await browser.close();
  server.close();
});
