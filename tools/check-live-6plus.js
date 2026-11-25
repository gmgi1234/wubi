const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 100)));
  await page.goto('https://wubi.iqiusuo.cn/ci/?t=' + Date.now(), { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.click('.tabs button[data-n="6"]');
  await page.waitForTimeout(8000);
  const st = await page.evaluate(() => ({
    hint: document.getElementById('hint').textContent,
    first: [...document.querySelectorAll('#results a')].slice(0, 4).map((a) => a.textContent),
  }));
  console.log(JSON.stringify(st));
  await browser.close();
})();
