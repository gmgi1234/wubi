// Screenshot a generated character page at phone width.
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'D:/Users/10061/Downloads/wubi';
const ch = process.argv[2] || '革';
const style = process.argv[3] || 'copybook';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await page.goto('file:///' + path.join(BASE, 'site', 'char', `${ch}.html`).replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = path.join(BASE, 'tools', 'compare', `mobile-${ch}-${style}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
