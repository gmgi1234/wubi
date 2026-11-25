// Check the deployed page: title, version badge, and a few characters.
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
  await page.goto(process.argv[2] || 'https://wubi.netlify.app/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => ({
    title: document.title,
    badge: (document.getElementById('app-version') || {}).textContent || '',
    hasInput: !!document.getElementById('char-input'),
  }));
  console.log('title:', info.title, '| badge:', info.badge, '| input:', info.hasInput);

  for (const ch of process.argv.slice(3)) {
    const r = await page.evaluate(async (c) => {
      await loadAndRender(c);
      const w = WUBI[c] || {};
      return {
        roots: w.r || null,
        code: w.c || null,
        n: typeof strokes !== 'undefined' ? strokes.length : -1,
        colors: new Set((strokeRootMapForDisplay || []).map(String)).size,
      };
    }, ch);
    console.log('char', ch, JSON.stringify(r));
  }
  console.log('errors:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
