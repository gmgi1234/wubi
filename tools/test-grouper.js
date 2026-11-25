// Open the grouping tool, simulate a demo assignment, and screenshot it.
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 840 }, deviceScaleFactor: 2 });
  await page.goto('file:///D:/Users/10061/Downloads/wubi/tools/branch-grouper.html', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  // demo assignment so the screenshot shows colours
  await page.evaluate(() => {
    order[1] = [0];
    order[2] = [2, 10, 3];
    order[3] = [4, 8, 14, 13];
    order[4] = [12];
    order[5] = [11, 6, 1, 5];
    draw();
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/grouper.png' });
  console.log('saved');
  await browser.close();
})();

