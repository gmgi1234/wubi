// Check (and if needed trigger) the Netlify TLS certificate for the custom domain.
const fs = require('node:fs');
const https = require('node:https');

const cfg = JSON.parse(fs.readFileSync(`${process.env.APPDATA}\\netlify\\Config\\config.json`, 'utf8'));
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
  const ssl = await api('GET', `/api/v1/sites/${SITE}/ssl`);
  console.log('ssl status:', ssl.status);
  if (ssl.body && typeof ssl.body === 'object') {
    console.log(JSON.stringify({
      state: ssl.body.state,
      domains: ssl.body.domains,
      expires_at: ssl.body.expires_at,
      updated_at: ssl.body.updated_at,
      error: ssl.body.error_message,
    }, null, 1));
  } else {
    console.log(String(ssl.body).slice(0, 300));
  }
})();
