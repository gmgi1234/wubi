// Check the live page: scripts, their status, and basic runtime health.
const https = require('node:https');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const get = (u) => new Promise((res) => {
  https.get(u, (r) => {
    let d = '';
    r.setEncoding('utf8');
    r.on('data', (c) => { d += c; });
    r.on('end', () => res({ s: r.statusCode, b: d }));
  }).on('error', (e) => res({ s: 0, b: String(e) }));
});

(async () => {
  const page = await get('https://wubi.iqiusuo.cn/');
  console.log('index', page.s, 'bytes', page.b.length);
  const scripts = [...page.b.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  console.log('scripts:', scripts.join(' | '));
  for (const s of scripts) {
    const r = await get('https://wubi.iqiusuo.cn/' + s.replace(/^\//, ''));
    console.log('  ', r.s, s, r.b.length, r.b.slice(0, 60).replace(/\n/g, ' '));
  }

  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const p = await browser.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  await p.goto('https://wubi.iqiusuo.cn/', { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(3000);
  const has = await p.evaluate(() => typeof loadAndRender);
  console.log('typeof loadAndRender:', has);
  console.log('errors:', errors.length ? errors.join(' || ') : 'none');
  await browser.close();
})();
