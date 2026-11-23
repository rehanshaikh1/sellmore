// Turns CallSwitch One webhook events into one completed call Task per call on
// the matching Salesforce Contact / Lead / Account.
//
// CallSwitch sends four separate hooks per call (new, answered, ended,
// voicemail), all keyed by `uuid`, and none carries a duration — so we time
// the call ourselves from when the answered and ended hooks arrive.

const { isExternalNumber, searchTerms, displayNumber, nationalNumber } = require('./phone');

const LONDON_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' });
const LONDON_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

// CallSwitch sends start times as UK wall-clock ("2026-10-28 22:17:54", no
// offset). Returns the UTC ISO string, or null if the value isn't a timestamp.
function londonToIso(local) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(local || ''));
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const p = Object.fromEntries(LONDON_PARTS.formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const offset = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - guess;
  return new Date(guess - offset).toISOString();
}
const STALE_MS = 6 * 60 * 60 * 1000; // drop calls that never sent "ended"

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

class CallLogger {
  constructor({ sf, extUsers = {}, defaultOwnerId, settleMs = 15000, now = () => Date.now(), log = console.log }) {
    this.sf = sf;
    this.extUsers = extUsers;
    this.defaultOwnerId = defaultOwnerId;
    this.settleMs = settleMs;
    this.now = now;
    this.log = log;
    this.calls = new Map();
    this.recent = []; // last outcomes, for /status
  }

  // event: "new" | "answered" | "ended" | "voicemail"
  handle(event, payload) {
    const uuid = payload && payload.uuid;
    if (!uuid) return;
    this.sweep();
    const call = this.calls.get(uuid) || { uuid, firstSeen: this.now() };
    Object.assign(call, payload);
    if (event === 'answered' && call.answeredAt == null) call.answeredAt = this.now();
    if (event === 'voicemail') call.voicemail = true;
    this.calls.set(uuid, call);

    if (event === 'ended' && call.endedAt == null) {
      call.endedAt = this.now();
      // Wait briefly so a voicemail hook that lands after "ended" is included.
      setTimeout(() => this.finalize(uuid).catch((err) => this.remember(call, `error: ${err.message}`)), this.settleMs);
    }
  }

  sweep() {
    const cutoff = this.now() - STALE_MS;
    for (const [uuid, call] of this.calls) {
      if (call.firstSeen < cutoff && !call.endedAt) this.calls.delete(uuid);
    }
  }

  remember(call, outcome) {
    this.log(`[call ${call.uuid}] ${outcome}`);
    this.recent.unshift({ at: new Date(this.now()).toISOString(), uuid: call.uuid, outcome });
    this.recent.length = Math.min(this.recent.length, 50);
  }

  async finalize(uuid) {
    const call = this.calls.get(uuid);
    if (!call) return;
    this.calls.delete(uuid);

    const facts = describeCall(call, this.extUsers);
    if (!facts) return this.remember(call, 'skipped: internal call');

    const match = await this.findRecord(facts.externalNumber);
    if (!match) return this.remember(call, `skipped: no Salesforce record for ${facts.externalNumber}`);

    // The native CallSwitch package logs Contact calls itself (same uuid in
    // CallObject) but without the matching fields the call report job needs,
    // so fill those in rather than creating a second Task.
    const existing = await this.sf.query(`SELECT Id, Call_Number__c FROM Task WHERE CallObject = '${uuid.replace(/'/g, '')}' LIMIT 1`);
    if (existing.totalSize > 0) {
      const task = existing.records[0];
      if (task.Call_Number__c) return this.remember(call, 'skipped: already logged');
      await this.sf.update('Task', task.Id, {
        Call_Number__c: nationalNumber(facts.externalNumber),
        Call_Started__c: facts.startedIso || undefined,
      });
      return this.remember(call, `already logged as ${task.Id}; match fields filled`);
    }

    const task = buildTask(facts, match, this.now());
    task.OwnerId = facts.repUserId || match.OwnerId || this.defaultOwnerId;
    await this.createTask(task);
    this.remember(call, `logged on ${match.type} ${match.Id}`);
  }

  // Retries once per known recoverable error: an inactive record owner falls
  // back to the default owner, and missing matching fields (not deployed, or
  // no field access) are dropped so the call is still logged.
  async createTask(task) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.sf.create('Task', task);
      } catch (err) {
        if (/INACTIVE_OWNER_OR_USER|INVALID_CROSS_REFERENCE_KEY/.test(err.message) && this.defaultOwnerId && task.OwnerId !== this.defaultOwnerId) {
          task.OwnerId = this.defaultOwnerId;
        } else if (/INVALID_FIELD|No such column|Call_(Number|Started)__c/.test(err.message) && 'Call_Number__c' in task) {
          delete task.Call_Number__c;
          delete task.Call_Started__c;
        } else {
          throw err;
        }
      }
    }
    return this.sf.create('Task', task);
  }

  // Prefer a Contact, then an open Lead, then an Account.
  async findRecord(number) {
    const terms = searchTerms(number);
    if (!terms.length) return null;
    const find = terms.map((t) => `"${t}"`).join(' OR ');
    const sosl =
      `FIND {${find}} IN PHONE FIELDS RETURNING ` +
      'Contact(Id, AccountId, OwnerId ORDER BY LastModifiedDate DESC LIMIT 1), ' +
      'Lead(Id, OwnerId WHERE IsConverted = false ORDER BY LastModifiedDate DESC LIMIT 1), ' +
      'Account(Id, OwnerId ORDER BY LastModifiedDate DESC LIMIT 1)';
    const res = await this.sf.search(sosl);
    const records = (res && res.searchRecords) || [];
    for (const type of ['Contact', 'Lead', 'Account']) {
      const r = records.find((rec) => rec.attributes.type === type);
      if (r) return { ...r, type };
    }
    return null;
  }
}

// Works out direction, the outside number and which rep was on the call.
// Returns null for internal (extension-to-extension) calls.
function describeCall(call, extUsers) {
  const inbound = String(call.call_type || '').toLowerCase() === 'inbound';
  let externalNumber = inbound ? call.from : call.to;
  if (!isExternalNumber(externalNumber)) {
    externalNumber = [call.to, call.from].find(isExternalNumber);
  }
  if (!externalNumber) return null;

  const extension = inbound
    ? (call.answer_type === 'sipuser' ? call.answered_by : null)
    : (call.from_type === 'sipuser' ? call.from : null);

  const answered = call.answeredAt != null;
  const durationSeconds = answered ? Math.max(0, Math.round((call.endedAt - call.answeredAt) / 1000)) : 0;
  let outcome;
  if (answered) outcome = 'Answered';
  else if (call.voicemail) outcome = 'Voicemail';
  else outcome = inbound ? 'Missed' : 'No answer';

  return {
    uuid: call.uuid,
    direction: inbound ? 'Inbound' : 'Outbound',
    externalNumber,
    extension: extension ? String(extension) : null,
    repUserId: extension ? extUsers[String(extension)] || null : null,
    outcome,
    durationSeconds,
    start: call.start || null,
    startedIso: londonToIso(call.start) || (call.firstSeen != null ? new Date(call.firstSeen).toISOString() : null),
  };
}

function buildTask(facts, match, nowMs) {
  const dir = facts.direction.toLowerCase();
  let subject;
  if (facts.outcome === 'Answered') subject = `Call (${dir}) – ${formatDuration(facts.durationSeconds)}`;
  else if (facts.outcome === 'Missed') subject = `Missed call (${dir})`;
  else if (facts.outcome === 'Voicemail') subject = `Voicemail (${dir})`;
  else subject = `Call (${dir}) – no answer`;

  const description = [
    'Logged automatically from CallSwitch One.',
    `Direction: ${facts.direction}`,
    `Number: ${displayNumber(facts.externalNumber)}`,
    `Extension: ${facts.extension || 'n/a'}`,
    `Started: ${facts.start || new Date(nowMs).toISOString()}`,
    `Outcome: ${facts.outcome}${facts.outcome === 'Answered' ? `, ${formatDuration(facts.durationSeconds)}` : ''}`,
    `Call ID: ${facts.uuid} (recording, if any, is in the CallSwitch portal)`,
  ].join('\n');

  const task = {
    Subject: subject,
    TaskSubtype: 'Call',
    Status: 'Completed',
    Priority: 'Normal',
    ActivityDate: LONDON_DATE.format(new Date(nowMs)),
    CallType: facts.direction,
    CallDurationInSeconds: facts.durationSeconds,
    CallDisposition: facts.outcome,
    CallObject: facts.uuid,
    Description: description,
    // Lets the call report job match a recording file (number + start time) to this Task.
    Call_Number__c: nationalNumber(facts.externalNumber),
    Call_Started__c: facts.startedIso || undefined,
    WhoId: match.type === 'Account' ? undefined : match.Id,
    WhatId: match.type === 'Account' ? match.Id : match.type === 'Contact' ? match.AccountId || undefined : undefined,
  };
  for (const k of Object.keys(task)) if (task[k] === undefined) delete task[k];
  return task;
}

module.exports = { CallLogger, describeCall, buildTask, formatDuration, londonToIso };
