// Compare a handful of characters rendered on the deployed site with the local baseline.
const fs = require('node:fs');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const baseline = new Map();
for (const line of fs.readFileSync('D:/Users/10061/Downloads/wubi/tools/baseline-v24.16.ndjson', 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const rec = JSON.parse(line);
  if (rec._meta || !rec.c) continue;
  baseline.set(rec.c, rec);
}

const CHARS = '巫婁嗇垂噩爾帶齊樂盥㠯燕翰犮豐彧豳齑豖冢奇齿齒厉甴酉奠尊遵酒醬釀醋醉醒醜醫鄭猶猷'.split('');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('https://wubi.netlify.app/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);

  let ok = 0;
  const bad = [];
  for (const ch of CHARS) {
    const rec = await page.evaluate(async (c) => {
      await loadAndRender(c);
      const w = WUBI[c] || {};
      return {
        map: typeof strokeRootMapForDisplay !== 'undefined' && strokeRootMapForDisplay ? [...strokeRootMapForDisplay] : null,
        n: typeof strokes !== 'undefined' ? strokes.length : -1,
        code: w.c || null,
      };
    }, ch);
    const base = baseline.get(ch);
    if (!base) { bad.push(`${ch}: no baseline`); continue; }
    if (JSON.stringify(rec.map) !== JSON.stringify(base.map) || rec.n !== base.n) {
      bad.push(`${ch}: map ${JSON.stringify(base.map)} -> ${JSON.stringify(rec.map)}`);
    } else {
      ok += 1;
    }
  }
  console.log('checked', CHARS.length, 'match', ok, 'diffs', bad.length);
  for (const b of bad.slice(0, 10)) console.log('  ', b);
  await browser.close();
})();
