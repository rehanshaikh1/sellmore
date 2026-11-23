const test = require('node:test');
const assert = require('node:assert');
const { searchTerms, nationalNumber, isExternalNumber } = require('../lib/phone');
const { CallLogger, describeCall, buildTask, londonToIso } = require('../lib/calls');
const { parseExtUsers } = require('../server');

const EXT = { 8001: 'USER_YASH', 8004: 'USER_KEERTHY' };

test('phone: UK numbers reduce to national digits', () => {
  assert.strictEqual(nationalNumber('+447424405482'), '7424405482');
  assert.strictEqual(nationalNumber('07424 405482'), '7424405482');
  assert.strictEqual(nationalNumber('+44 (0)7979 343231'), '7979343231');
  assert.strictEqual(nationalNumber('00441773522300'), '1773522300');
  assert.deepStrictEqual(searchTerms('+447424405482'), ['7424405482', '07424405482']);
  assert.deepStrictEqual(searchTerms('8001'), []);
  assert.strictEqual(isExternalNumber('8001'), false);
  assert.strictEqual(isExternalNumber('+443301226020'), true);
});

test('describeCall: outbound answered call from an extension', () => {
  const facts = describeCall(
    { uuid: 'u1', call_type: 'outbound', from_type: 'sipuser', from: '8001', to_type: 'number', to: '+447424405482', answeredAt: 1000, endedAt: 35000 },
    EXT,
  );
  assert.strictEqual(facts.direction, 'Outbound');
  assert.strictEqual(facts.externalNumber, '+447424405482');
  assert.strictEqual(facts.repUserId, 'USER_YASH');
  assert.strictEqual(facts.outcome, 'Answered');
  assert.strictEqual(facts.durationSeconds, 34);
});

test('describeCall: inbound missed call and internal call', () => {
  const missed = describeCall({ uuid: 'u2', call_type: 'inbound', from_type: 'number', from: '+441902865777', to: '+442477350151', endedAt: 5 }, EXT);
  assert.strictEqual(missed.outcome, 'Missed');
  assert.strictEqual(missed.externalNumber, '+441902865777');
  assert.strictEqual(missed.repUserId, null);

  const answered = describeCall(
    { uuid: 'u3', call_type: 'inbound', from: '+441902865777', to: '+442477350151', answer_type: 'sipuser', answered_by: '8004', answeredAt: 0, endedAt: 125000 },
    EXT,
  );
  assert.strictEqual(answered.repUserId, 'USER_KEERTHY');
  assert.strictEqual(answered.durationSeconds, 125);

  assert.strictEqual(describeCall({ uuid: 'u4', call_type: 'outbound', from: '8001', to: '8004' }, EXT), null);
});

test('buildTask: lead gets WhoId only; contact gets its account as WhatId', () => {
  const facts = describeCall(
    { uuid: 'u1', call_type: 'outbound', from_type: 'sipuser', from: '8001', to: '+447424405482', answeredAt: 0, endedAt: 34000 },
    EXT,
  );
  const onLead = buildTask(facts, { type: 'Lead', Id: 'LEAD1' }, Date.UTC(2026, 9, 28, 21, 25));
  assert.strictEqual(onLead.Subject, 'Call (outbound) – 0:34');
  assert.strictEqual(onLead.WhoId, 'LEAD1');
  assert.strictEqual(onLead.WhatId, undefined);
  assert.strictEqual(onLead.TaskSubtype, 'Call');
  assert.strictEqual(onLead.CallObject, 'u1');
  assert.strictEqual(onLead.ActivityDate, '2026-10-28');

  const onContact = buildTask(facts, { type: 'Contact', Id: 'C1', AccountId: 'A1' }, 0);
  assert.strictEqual(onContact.WhatId, 'A1');
  const onAccount = buildTask(facts, { type: 'Account', Id: 'A1' }, 0);
  assert.strictEqual(onAccount.WhoId, undefined);
  assert.strictEqual(onAccount.WhatId, 'A1');
});

test('CallLogger: full lifecycle creates one Task with the rep as owner', async () => {
  let clock = 0;
  const created = [];
  const sf = {
    search: async (sosl) => {
      assert.match(sosl, /"7424405482" OR "07424405482"/);
      return { searchRecords: [{ attributes: { type: 'Lead' }, Id: 'LEAD1', OwnerId: 'USER_OTHER' }] };
    },
    query: async () => ({ totalSize: created.length }),
    create: async (obj, fields) => created.push({ obj, fields }),
  };
  const logger = new CallLogger({ sf, extUsers: EXT, settleMs: 0, now: () => clock, log: () => {} });
  const base = { uuid: 'u1', call_type: 'outbound', from_type: 'sipuser', from: '8001', to_type: 'number', to: '+447424405482', start: '2026-10-28 21:25:07' };
  logger.handle('new', base);
  clock = 5000;
  logger.handle('answered', { ...base, answered_at: '2026-10-28 21:25:12' });
  clock = 39000;
  logger.handle('ended', base);
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(created.length, 1);
  assert.strictEqual(created[0].fields.OwnerId, 'USER_YASH');
  assert.strictEqual(created[0].fields.CallDurationInSeconds, 34);
  assert.strictEqual(logger.calls.size, 0);
  assert.match(logger.recent[0].outcome, /logged on Lead LEAD1/);
});

test('CallLogger: unmatched numbers are skipped, not logged', async () => {
  const sf = { search: async () => ({ searchRecords: [] }), query: async () => ({ totalSize: 0 }), create: async () => assert.fail('should not create') };
  const logger = new CallLogger({ sf, settleMs: 0, log: () => {} });
  logger.handle('ended', { uuid: 'u9', call_type: 'outbound', from: '8001', from_type: 'sipuser', to: '+447700900123' });
  await new Promise((r) => setTimeout(r, 20));
  assert.match(logger.recent[0].outcome, /no Salesforce record/);
});

test('londonToIso: UK wall-clock to UTC in both GMT and BST', () => {
  assert.strictEqual(londonToIso('2026-10-28 22:17:54'), '2026-10-28T22:17:54.000Z'); // GMT
  assert.strictEqual(londonToIso('2026-09-18 14:11:07'), '2026-09-18T13:11:07.000Z'); // BST
  assert.strictEqual(londonToIso('not a time'), null);
});

test('buildTask: sets the matching fields', () => {
  const facts = describeCall(
    { uuid: 'u1', call_type: 'outbound', from_type: 'sipuser', from: '8001', to: '+447424405482', start: '2026-10-28 22:17:54', answeredAt: 0, endedAt: 32000 },
    EXT,
  );
  const task = buildTask(facts, { type: 'Lead', Id: 'LEAD1' }, 0);
  assert.strictEqual(task.Call_Number__c, '7424405482');
  assert.strictEqual(task.Call_Started__c, '2026-10-28T22:17:54.000Z');
});

test('CallLogger: still logs the call when the matching fields are missing', async () => {
  const attempts = [];
  const sf = {
    search: async () => ({ searchRecords: [{ attributes: { type: 'Lead' }, Id: 'LEAD1', OwnerId: 'U' }] }),
    query: async () => ({ totalSize: 0 }),
    create: async (obj, fields) => {
      attempts.push({ ...fields });
      if ('Call_Number__c' in fields) throw new Error("Salesforce POST /sobjects/Task failed (400): [{\"errorCode\":\"INVALID_FIELD\",\"message\":\"No such column 'Call_Number__c'\"}]");
      return { id: 'T1' };
    },
  };
  const logger = new CallLogger({ sf, extUsers: EXT, settleMs: 0, log: () => {} });
  logger.handle('ended', { uuid: 'u7', call_type: 'outbound', from_type: 'sipuser', from: '8001', to: '+447424405482', start: '2026-10-28 22:17:54' });
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(attempts.length, 2);
  assert.ok(!('Call_Number__c' in attempts[1]));
  assert.match(logger.recent[0].outcome, /logged on Lead/);
});

test('CallLogger: fills match fields on a Task the native package already created', async () => {
  const updates = [];
  const sf = {
    search: async () => ({ searchRecords: [{ attributes: { type: 'Contact' }, Id: 'C1', AccountId: 'A1', OwnerId: 'U' }] }),
    query: async () => ({ totalSize: 1, records: [{ Id: 'NATIVE1', Call_Number__c: null }] }),
    update: async (obj, id, fields) => updates.push({ id, fields }),
    create: async () => assert.fail('should not create a second Task'),
  };
  const logger = new CallLogger({ sf, extUsers: EXT, settleMs: 0, log: () => {} });
  logger.handle('ended', { uuid: 'u8', call_type: 'outbound', from_type: 'sipuser', from: '8007', to: '+441234567890', start: '2026-10-29 12:32:00' });
  await new Promise((r) => setTimeout(r, 20));
  assert.deepStrictEqual(updates, [{ id: 'NATIVE1', fields: { Call_Number__c: '1234567890', Call_Started__c: '2026-10-29T12:32:00.000Z' } }]);
  assert.match(logger.recent[0].outcome, /match fields filled/);
});

test('parseExtUsers', () => {
  assert.deepStrictEqual(parseExtUsers('8001:A, 8004:B,bad'), { 8001: 'A', 8004: 'B' });
});
