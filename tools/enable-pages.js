// 开启 GitHub Pages（source: main / root），并查询状态
const { execSync } = require('node:child_process');
const https = require('node:https');

const owner = 'gmgi1234';
const repo = 'wubi';

const credIn = 'protocol=https\nhost=github.com\n\n';
const out = execSync('git -c credential.helper=wincred credential fill', { input: credIn, encoding: 'utf8' });
const token = (out.split('\n').find((l) => l.startsWith('password=')) || '').replace('password=', '').trim();

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: 'api.github.com',
      path,
      method,
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'wubi-bot',
        Accept: 'application/vnd.github+json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const cur = await api('GET', `/repos/${owner}/${repo}/pages`);
  console.log('pages status:', cur.status, cur.body.slice(0, 200));
  if (cur.status === 404) {
    const create = await api('POST', `/repos/${owner}/${repo}/pages`, { source: { branch: 'main', path: '/' } });
    console.log('create:', create.status, create.body.slice(0, 300));
  } else if (cur.status === 200) {
    const upd = await api('PUT', `/repos/${owner}/${repo}/pages`, { source: { branch: 'main', path: '/' } });
    console.log('update:', upd.status, upd.body.slice(0, 300));
  }
})();
