const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  for (const [url, name] of [
    ['https://wubi.iqiusuo.cn/ci.html?w=' + encodeURIComponent('米饭'), 'live-ci-mifan'],
    ['https://wubi.iqiusuo.cn/practice.html', 'live-practice'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    const st = await page.evaluate(() => ({
      dashes: document.querySelectorAll('svg path[stroke-dasharray]').length,
      glyphs: document.querySelectorAll('svg.glyph').length,
      title: document.title.slice(0, 20),
    }));
    console.log(name, JSON.stringify(st), '| errs:', errs.join('|') || 'none');
    await page.close();
  }
  await browser.close();
})();
