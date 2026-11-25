// 线上验证词组页分类浏览
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  await page.goto('https://wubi.iqiusuo.cn/ci/?t=' + Date.now(), { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(4000);
  const init = await page.evaluate(() => ({
    hint: document.getElementById('hint').textContent,
    first: [...document.querySelectorAll('#results a')].slice(0, 5).map((a) => a.textContent),
    tabs: [...document.querySelectorAll('.tabs button')].map((b) => b.textContent.trim()),
  }));
  console.log('初始:', JSON.stringify(init));

  await page.click('.tabs button[data-n="4"]');
  await page.waitForTimeout(9000);
  const four = await page.evaluate(() => ({
    hint: document.getElementById('hint').textContent,
    first: [...document.querySelectorAll('#results a')].slice(0, 4).map((a) => a.textContent),
  }));
  console.log('四字:', JSON.stringify(four));

  await browser.close();
})();
