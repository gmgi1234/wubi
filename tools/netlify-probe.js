// Probe Netlify domain endpoints for the wubi site.
const fs = require('node:fs');
const https = require('node:https');

const cfgPath = `${process.env.APPDATA}\\netlify\\Config\\config.json`;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const token = Object.values(cfg.users)[0].auth.token;
const SITE = '72e4dd16-6d50-4926-b5b6-035afb2d32a2';

function api(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: 'api.netlify.com', path, method,
      headers: { Authorization: `Bearer ${token}`, ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) },
    }, (res) => {
      let out = '';
      res.on('data', (c) => { out += c; });
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(out); } catch { parsed = out; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: String(e) }));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const checks = [
    ['GET', `/api/v1/sites/${SITE}/domains`],
    ['GET', `/api/v1/sites/${SITE}/domain_aliases`],
    ['GET', `/api/v1/sites/${SITE}`],
  ];
  for (const [m, p] of checks) {
    const r = await api(m, p);
    console.log(m, p, '->', r.status);
    if (r.status === 200) {
      if (Array.isArray(r.body)) console.log('   domains:', r.body.map((d) => d.name || d.domain).join(', '));
      else console.log('   custom_domain:', r.body.custom_domain, '| domain_aliases:', (r.body.domain_aliases || []).join(', '));
    }
  }
})();
