// 检查线上静态页的字根渲染
const https = require('node:https');

const get = (u) => new Promise((res) => {
  https.get(u, { headers: { 'User-Agent': 'check' } }, (r) => {
    let d = '';
    r.setEncoding('utf8');
    r.on('data', (c) => { d += c; });
    r.on('end', () => res({ s: r.statusCode, b: d }));
  }).on('error', () => res({ s: 0, b: '' }));
});

(async () => {
  for (const w of process.argv.slice(2)) {
    const { s, b } = await get(`https://wubi.iqiusuo.cn/ci/${encodeURIComponent(w)}.html?t=${Date.now()}`);
    const roots = (b.match(/<span class="broots">([\s\S]*?)<\/span><span class="bcode">/) || [])[1] || '';
    const text = roots.replace(/<svg[\s\S]*?<\/svg>/g, '[图]').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
    console.log(w, '| status', s, '| 字根:', text, '| 小图:', (roots.match(/<svg/g) || []).length, '| 补码虚线:', b.includes('c0392b'));
  }
})();
