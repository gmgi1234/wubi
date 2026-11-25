// Screenshot one character's stroke drawing from the deployed page.
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const ch = process.argv[2];
  const out = process.argv[3];
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('https://wubi.netlify.app/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async (c) => {
    await loadAndRender(c);
    const map = (typeof strokeRootMap !== 'undefined' && strokeRootMap) || [];
    // annotate each stroke with its index for visual diagnosis
    const paths = [...document.querySelectorAll('#char-svg path')];
    paths.forEach((p, i) => {
      const box = p.getBBox ? p.getBBox() : null;
      if (!box) return;
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', box.x + box.width * 0.5);
      t.setAttribute('y', box.y + box.height * 0.5);
      t.setAttribute('fill', '#ff0');
      t.setAttribute('font-size', '26');
      t.setAttribute('text-anchor', 'middle');
      t.textContent = String(i);
      p.parentNode.appendChild(t);
    });
    return map;
  }, ch);
  await page.waitForTimeout(400);
  const el = await page.$('#char-svg');
  await el.screenshot({ path: out });
  console.log('saved', out);
  await browser.close();
})();
