// Check the latest Netlify deploys for the wubi site.
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const cfgPath = path.join(process.env.APPDATA, 'netlify', 'Config', 'config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const token = Object.values(cfg.users)[0].auth.token;

const get = (p) => new Promise((res, rej) => {
  https.get({ host: 'api.netlify.com', path: p, headers: { Authorization: `Bearer ${token}` } }, (r) => {
    let d = '';
    r.on('data', (c) => { d += c; });
    r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});

(async () => {
  const deploys = await get('/api/v1/sites/72e4dd16-6d50-4926-b5b6-035afb2d32a2/deploys?per_page=5');
  for (const d of deploys) {
    console.log(d.created_at, '|', d.state, '|', d.branch, '|', d.title || '', '|', d.error_message || '');
  }
})();
