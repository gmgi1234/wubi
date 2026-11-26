// 线上验证：练习页切换版本后字形与编码
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const misses = [];
  page.on('requestfailed', (r) => { if (r.url().includes('svg/')) misses.push(r.url().slice(-40)); });
  await page.goto('https://wubi.iqiusuo.cn/practice.html', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.fill('#jumpInput', '回家');
  await page.press('#jumpInput', 'Enter');
  await page.waitForTimeout(2000);

  for (const ver of ['6', '8', '9']) {
    await page.click(`[data-ver="${ver}"]`);
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => ({
      slots: document.querySelectorAll('.zislot').length,
      filled: [...document.querySelectorAll('.zislot')].filter((s) => s.querySelector('svg')).length,
      code: document.getElementById('codline').textContent,
      kb: (document.querySelector('.kb-title') || {}).textContent,
    }));
    console.log('线上版本', ver, JSON.stringify(info));
  }
  console.log('失败的 svg 请求:', misses.length ? misses.join(',') : '无');
  await browser.close();
})();
