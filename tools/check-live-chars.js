// Verify deployed character pages.
const https = require('node:https');
const get = (u) => new Promise((r) => {
  https.get(u, (s) => {
    let d = '';
    s.setEncoding('utf8');
    s.on('data', (c) => { d += c; });
    s.on('end', () => r({ s: s.statusCode, b: d }));
  }).on('error', () => r({ s: 0, b: '' }));
});

(async () => {
  for (const c of ['狗', '革', '國', '的', '王']) {
    const { s, b } = await get('https://wubi.iqiusuo.cn/char/' + encodeURIComponent(c) + '.html');
    const title = (b.match(/<title>([^<]+)/) || [])[1] || '';
    const style = b.includes('fbf7ef') ? 'copybook' : 'plain';
    const cards = (b.match(/class="vcard"/g) || []).length;
    console.log(c, s, style, 'cards=' + cards, 'bytes=' + b.length, title.slice(0, 22));
  }
  const sm = await get('https://wubi.iqiusuo.cn/char/sitemap-char.xml');
  console.log('sitemap', sm.s, 'urls', (sm.b.match(/<url>/g) || []).length);
})();
