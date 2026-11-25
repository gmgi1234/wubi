// 线上检查：静态页是否用 sprite 引用复合字根
const https = require('node:https');

const get = (u) => new Promise((r) => {
  https.get(u, { headers: { 'User-Agent': 'check' } }, (s) => {
    let d = '';
    s.setEncoding('utf8');
    s.on('data', (c) => { d += c; });
    s.on('end', () => r({ s: s.statusCode, b: d }));
  }).on('error', () => r({ s: 0, b: '' }));
});

(async () => {
  const w = process.argv[2] || '一世';
  const { s, b } = await get(`https://wubi.iqiusuo.cn/ci/${encodeURIComponent(w)}.html?t=${Date.now()}`);
  const uses = (b.match(/use href="[^"]*frag-sprite[^"]*"/g) || []).length;
  const inlinePaths = (b.match(/<path d="M/g) || []).length;
  console.log(w, '| status', s, '| sprite 引用', uses, '| 内联路径', inlinePaths, '| 页面大小', b.length);
  const sp = await get('https://wubi.iqiusuo.cn/data/frag-sprite.svg');
  console.log('sprite 文件:', sp.s, '| 字节', sp.b.length);
})();
