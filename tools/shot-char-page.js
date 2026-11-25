// Screenshot a generated character page.
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const ch = process.argv[2] || '革';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 2 });
  await page.goto('file:///' + path.join(BASE, 'site', 'char', `${ch}.html`).replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = path.join(BASE, 'tools', 'compare', `char-page-${ch}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
