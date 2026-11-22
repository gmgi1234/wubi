// Smoke-test a single-file wubi page in headless Chromium.
// Usage: node test-page.js <file.html> [chars...]
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:\\Users\\10061\\Downloads\\wubi';
const PAGE = process.argv[2];
const CHARS = process.argv.slice(3);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

  const url = `http://127.0.0.1:${port}/${encodeURIComponent(path.basename(PAGE))}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => ({
    title: document.title,
    badge: (document.getElementById('app-version') || {}).textContent || '',
    hasInput: !!document.getElementById('char-input'),
    svgPaths: document.querySelectorAll('svg path').length,
  }));
  console.log('title:', info.title);
  console.log('badge:', JSON.stringify(info.badge), 'input:', info.hasInput, 'svgPaths:', info.svgPaths);

  for (const ch of CHARS) {
    const result = await page.evaluate(async (c) => {
      const input = document.getElementById('char-input');
      if (!input) return { error: 'no input' };
      input.value = c;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      await new Promise((r) => setTimeout(r, 1200));
      const paths = [...document.querySelectorAll('svg path')];
      const fills = new Set(paths.map((p) => p.getAttribute('stroke') || p.getAttribute('fill')).filter(Boolean));
      const rootNames = [...document.querySelectorAll('.root-name')].map((e) => e.textContent.trim()).slice(0, 8);
      return { paths: paths.length, colors: fills.size, roots: rootNames, shown: (document.querySelector('.char-cell') || {}).textContent || '' };
    }, ch);
    console.log('char', ch, JSON.stringify(result).slice(0, 240));
  }

  if (errors.length) {
    console.log('ERRORS:');
    for (const e of errors.slice(0, 8)) console.log('  ' + e);
  } else {
    console.log('ERRORS: none');
  }
  await browser.close();
  server.close();
});
