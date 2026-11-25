// Add a custom subdomain to the wubi Netlify site.
// Reads the CLI token from the Netlify config so nothing is printed.
const fs = require('node:fs');
const https = require('node:https');

const cfgPath = `${process.env.APPDATA}\\netlify\\Config\\config.json`;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const token = Object.values(cfg.users)[0].auth.token;
const DOMAIN = process.argv[2] || 'wubi.iqiusuo.cn';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: 'api.netlify.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let out = '';
      res.on('data', (c) => { out += c; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(out); } catch { parsed = out; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const list = await api('GET', '/api/v1/sites?per_page=100');
  const site = (list.body || []).find((s) => s.name === 'wubi');
  if (!site) throw new Error('wubi site not found');
  console.log('site:', site.name, site.id, 'ssl_url:', site.ssl_url);

  const added = await api('POST', `/api/v1/sites/${site.id}/domains`, { name: DOMAIN });
  console.log('add domain status:', added.status);
  console.log(JSON.stringify(added.body, null, 1).slice(0, 800));
})();
