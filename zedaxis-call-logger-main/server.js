// zedaxis-call-logger — receives CallSwitch One call webhooks and logs each
// call as a completed Task on the matching Salesforce record.
//
// Routes:
//   POST /hook/new | /hook/answered | /hook/ended | /hook/voicemail
//   GET  /ping                       health check (Render)
//   GET  /status?token=...           last 50 outcomes + calls in progress

const http = require('http');
const crypto = require('crypto');
const { Salesforce } = require('./lib/salesforce');
const { CallLogger } = require('./lib/calls');

const EVENTS = new Set(['new', 'answered', 'ended', 'voicemail']);

// "8001:005...,8004:005..." -> { "8001": "005...", ... }
function parseExtUsers(value) {
  const map = {};
  for (const pair of String(value || '').split(',')) {
    const [ext, userId] = pair.split(':').map((s) => s && s.trim());
    if (ext && userId) map[ext] = userId;
  }
  return map;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// CallSwitch's docs don't say where the "Auth Token" goes, so accept it from
// the usual places: Authorization (with or without "Bearer"), an x-*-token
// header, a ?token= query parameter, or a token field in the body.
function tokenCandidates(req, url, body) {
  const out = [];
  const auth = req.headers.authorization;
  if (auth) out.push(auth, auth.replace(/^(Bearer|Token)\s+/i, ''));
  for (const h of ['x-auth-token', 'x-api-key', 'x-token', 'auth-token', 'authtoken', 'token']) {
    if (req.headers[h]) out.push(req.headers[h]);
  }
  if (url.searchParams.get('token')) out.push(url.searchParams.get('token'));
  for (const k of ['auth_token', 'authToken', 'token']) {
    if (body && body[k]) out.push(body[k]);
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(data)));
      }
    });
    req.on('error', reject);
  });
}

function createServer({ logger, webhookToken }) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (status, obj) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    };

    if (req.method === 'GET' && url.pathname === '/ping') return send(200, { ok: true });

    if (req.method === 'GET' && url.pathname === '/status') {
      if (!tokenCandidates(req, url, null).some((t) => safeEqual(t, webhookToken))) return send(401, { error: 'unauthorised' });
      return send(200, { inProgress: logger.calls.size, recent: logger.recent });
    }

    const m = url.pathname.match(/^\/hook\/([a-z]+)$/);
    if (req.method === 'POST' && m && EVENTS.has(m[1])) {
      const body = await readBody(req).catch(() => ({}));
      if (!tokenCandidates(req, url, body).some((t) => safeEqual(t, webhookToken))) {
        // Header names only (never values) so we can see where CallSwitch puts the token.
        console.log(`[auth] rejected /hook/${m[1]}; headers: ${Object.keys(req.headers).join(', ')}`);
        return send(401, { error: 'unauthorised' });
      }
      console.log(`[hook ${m[1]}] uuid=${body.uuid} fields=${Object.keys(body).join(',')}`);
      logger.handle(m[1], body);
      return send(200, { ok: true });
    }

    send(404, { error: 'not found' });
  });
}

if (require.main === module) {
  for (const key of ['SF_LOGIN_URL', 'SF_CLIENT_ID', 'SF_CLIENT_SECRET', 'WEBHOOK_TOKEN']) {
    if (!process.env[key]) {
      console.error(`Missing env var ${key}`);
      process.exit(1);
    }
  }
  const sf = new Salesforce({
    loginUrl: process.env.SF_LOGIN_URL,
    clientId: process.env.SF_CLIENT_ID,
    clientSecret: process.env.SF_CLIENT_SECRET,
  });
  const logger = new CallLogger({
    sf,
    extUsers: parseExtUsers(process.env.EXT_USERS),
    defaultOwnerId: process.env.DEFAULT_OWNER_ID,
  });
  const port = Number(process.env.PORT) || 5230;
  createServer({ logger, webhookToken: process.env.WEBHOOK_TOKEN }).listen(port, () => {
    console.log(`zedaxis-call-logger listening on ${port}`);
  });
}

module.exports = { createServer, parseExtUsers };
