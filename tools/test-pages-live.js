// 在 GitHub Pages 上验证动态页面能否正常渲染
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const BASE = 'https://gmgi1234.github.io/wubi';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const targets = [
    ['/site/char.html?c=' + encodeURIComponent('狗'), 'gh-char-gou'],
    ['/site/ci.html?w=' + encodeURIComponent('中国'), 'gh-ci-zhongguo'],
    ['/site/char/' + encodeURIComponent('王') + '.html', 'gh-static-wang'],
  ];
  for (const [p, name] of targets) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    const bodyLen = (await page.evaluate(() => document.body.innerText.length));
    await page.screenshot({ path: `D:/Users/10061/Downloads/wubi/tools/compare/${name}.png`, fullPage: true });
    console.log(name, '| title:', title.slice(0, 30), '| text chars:', bodyLen, '| errors:', errs.length ? errs.join('|') : 'none');
    await page.close();
  }
  await browser.close();
})();
