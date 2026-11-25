// Test the offline bundle: open the page over file:// and inspect 馺's rendered paths.
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('node:path');

(async () => {
  const file = 'file:///D:/Users/10061/Downloads/wubi/20261122wubi-stroke-colorV24.17.html';
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.goto(file, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(30000); // bundle is large; give it time to parse
  const info = await page.evaluate(async () => {
    const ready = !!window._bundleReady;
    const has = !!(window.STROKE_DATA && window.STROKE_DATA['馺']);
    const boost = has ? window.STROKE_DATA['馺'].boost : null;
    await loadAndRender('馺');
    const paths = [...document.querySelectorAll('#char-svg path')].filter((p) => p.dataset.strokeIndex !== undefined);
    return { ready, has, boost, paths: paths.length, firstStrokeWidth: paths[0] ? paths[0].getAttribute('stroke-width') : null };
  });
  console.log(JSON.stringify(info));
  await page.screenshot({ path: 'D:/Users/10061/Downloads/wubi/tools/compare/file-sa.png' });
  await browser.close();
})();
