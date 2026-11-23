const test = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../server');

test('server: ping, token check, hooks and status', async (t) => {
  const handled = [];
  const logger = { calls: new Map(), recent: [], handle: (event, body) => handled.push({ event, body }) };
  const server = createServer({ logger, webhookToken: 'secret' });
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const body = JSON.stringify({ uuid: 'u1', call_type: 'outbound', from: '8001', to: '+447424405482' });

  assert.strictEqual((await fetch(`${base}/ping`)).status, 200);
  assert.strictEqual((await fetch(`${base}/hook/new`, { method: 'POST', body })).status, 401);
  assert.strictEqual((await fetch(`${base}/hook/new`, { method: 'POST', body, headers: { Authorization: 'Bearer secret' } })).status, 200);
  assert.strictEqual((await fetch(`${base}/hook/answered`, { method: 'POST', body, headers: { 'X-Auth-Token': 'secret' } })).status, 200);
  assert.strictEqual((await fetch(`${base}/hook/ended?token=secret`, { method: 'POST', body })).status, 200);
  assert.strictEqual((await fetch(`${base}/hook/bogus?token=secret`, { method: 'POST', body })).status, 404);
  assert.strictEqual((await fetch(`${base}/status`)).status, 401);
  assert.strictEqual((await fetch(`${base}/status?token=secret`)).status, 200);

  assert.deepStrictEqual(handled.map((h) => h.event), ['new', 'answered', 'ended']);
  assert.strictEqual(handled[0].body.uuid, 'u1');
});
