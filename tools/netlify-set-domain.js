// Set the wubi site's custom domain to wubi.iqiusuo.cn.
const fs = require('node:fs');
const https = require('node:https');

const cfgPath = `${process.env.APPDATA}\\netlify\\Config\\config.json`;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const token = Object.values(cfg.users)[0].auth.token;
const SITE = '72e4dd16-6d50-4926-b5b6-035afb2d32a2';
const DOMAIN = process.argv[2] || 'wubi.iqiusuo.cn';

const data = JSON.stringify({ custom_domain: DOMAIN });
const req = https.request({
  host: 'api.netlify.com',
  path: `/api/v1/sites/${SITE}`,
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
}, (res) => {
  let out = '';
  res.on('data', (c) => { out += c; });
  res.on('end', () => {
    console.log('status', res.statusCode);
    try {
      const j = JSON.parse(out);
      console.log(JSON.stringify({ custom_domain: j.custom_domain, domain_aliases: j.domain_aliases, ssl_url: j.ssl_url, error: j.message }, null, 1));
    } catch {
      console.log(out.slice(0, 400));
    }
  });
});
req.on('error', (e) => console.log('error', e.message));
req.write(data);
req.end();
