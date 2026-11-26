// 单独渲染一个键盘字根，检查方向
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/10061/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const ROOT = 'D:/Users/10061/Downloads/wubi';
const lib = fs.readFileSync(path.join(ROOT, 'data/kb-root-glyphs.js'), 'utf8');
const json = JSON.parse(lib.slice(lib.indexOf('{'), lib.lastIndexOf('}') + 1));

const html = `<!DOCTYPE html><html><body style="background:#fffdf8">
<div style="display:flex;gap:20px;padding:20px">
  <div><div>KB 金</div><svg viewBox="0 0 1024 1024" width="160" height="160" style="border:1px solid #ccc">${json['金']}</svg></div>
  <div><div>原字 金</div><img src="file:///${ROOT.replace(/\\/g, '/')}/svg/金-06.svg" width="160" height="160" style="border:1px solid #ccc"></div>
</div></body></html>`;

const tmp = path.join(ROOT, 'tools', 'compare', 'kb-orient-test.html');
fs.writeFileSync(tmp, html, 'utf8');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 500, height: 260 }, deviceScaleFactor: 2 });
  await page.goto('file:///' + tmp.replace(/\\/g, '/'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'tools', 'compare', 'kb-orient.png') });
  await browser.close();
})();
