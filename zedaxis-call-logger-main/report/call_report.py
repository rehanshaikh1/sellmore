"""Call reports: turns each new CallSwitch call transcript into a five-line
summary (free, local model via Ollama) and puts it at the top of the matching
Salesforce call Task created by zedaxis-call-logger.

Runs on ZA-SV-0001 next to the recordings sync. Python 3.9+, standard library
only. Transcripts are the .txt files the sync writes beside each .mp3, named
like "2026-09-18 14 11 07 +0100 +441614573357 442477350151.txt"
(date, time, UTC offset, caller, callee).

    python call_report.py              # process new transcripts
    python call_report.py --dry-run    # print summaries, write nothing
    python call_report.py --file PATH  # one transcript (implies --dry-run unless --write)
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HOME = Path(os.environ.get('USERPROFILE') or Path.home())
CONFIG = {
    'recordings_dir': os.environ.get('CALL_RECORDINGS_DIR', r'G:\My Drive\call-recordings\New recordings'),
    'state_file': os.environ.get('CALL_REPORT_STATE', str(HOME / '.zedaxis-call-logger' / 'report-state.json')),
    'creds_file': os.environ.get('CALL_REPORT_CREDS', str(HOME / '.zedaxis-call-logger' / 'salesforce.json')),
    'sf_login_url': os.environ.get('SF_LOGIN_URL', 'https://zedaxis.my.salesforce.com'),
    'ollama_url': os.environ.get('OLLAMA_URL', 'http://127.0.0.1:11434'),
    'ollama_model': os.environ.get('OLLAMA_MODEL', 'qwen2.5:7b-instruct'),
    'lookback_days': int(os.environ.get('CALL_REPORT_LOOKBACK_DAYS', '3')),
}

MARKER = 'CALL SUMMARY'
MIN_WORDS = 25          # shorter transcripts are IVR greetings / no-answers
MATCH_WINDOW_S = 120    # recording time vs logger start time
MAX_TRANSCRIPT = 14000  # characters sent to the model
API = 'v62.0'

NAME_RE = re.compile(
    r'^(\d{4})-(\d{2})-(\d{2}) (\d{2})[ _](\d{2})[ _](\d{2})'
    r'(?: ([+-])(\d{2})(\d{2}))? (\S+) (\S+?)(-[A-Za-z0-9-]+)?\.txt$'
)

PROMPT = """You write short CRM notes about phone calls for Zedaxis, a UK engineering manufacturer.
Below is an automatic transcript of one call. It may contain recognition errors and has no speaker labels.

Write exactly these five lines and nothing else:
Reason: <why the call happened>
Discussed: <parts, quantities, prices, deadlines mentioned>
Concerns: <customer concerns or objections, or None>
Next step: <who does what, and by when, or None agreed>
Follow-up needed: <Yes or No>

Keep each line under 30 words. Only use facts stated in the transcript; write "Not mentioned" rather than guess.
If the call reached voicemail or an answering machine and only a message was left, start the Reason line with "Voicemail left - " and describe the message.

Transcript:
{transcript}
"""
LINE_KEYS = ['Reason', 'Discussed', 'Concerns', 'Next step', 'Follow-up needed']


def digits(s):
    return re.sub(r'\D', '', s or '')


def national(number):
    d = digits(number)
    if d.startswith('0044'):
        d = d[4:]
    elif d.startswith('44') and len(d) >= 12:
        d = d[2:]
    return d[1:] if d.startswith('0') else d


def uk_offset_hours(utc):
    """1 during British Summer Time, else 0 (last Sunday of March/October, 01:00 UTC)."""
    def last_sunday(year, month):
        d = dt.datetime(year, month + 1, 1) - dt.timedelta(days=1) if month < 12 else dt.datetime(year, 12, 31)
        return d - dt.timedelta(days=(d.weekday() + 1) % 7)
    start = last_sunday(utc.year, 3).replace(hour=1)
    end = last_sunday(utc.year, 10).replace(hour=1)
    return 1 if start <= utc.replace(tzinfo=None) < end else 0


def parse_name(filename):
    """Returns {key, started (UTC datetime), number (national digits), variant} or None.

    Outbound files read "<ext> <number>", inbound "<caller> <our line>";
    extension-to-extension calls return None.
    """
    m = NAME_RE.match(filename)
    if not m:
        return None
    y, mo, d, h, mi, s, sign, oh, om, a, b, variant = m.groups()
    local = dt.datetime(int(y), int(mo), int(d), int(h), int(mi), int(s))
    if sign:
        offset = dt.timedelta(hours=int(oh), minutes=int(om)) * (1 if sign == '+' else -1)
    else:
        offset = dt.timedelta(hours=uk_offset_hours(local))
    started = (local - offset).replace(tzinfo=dt.timezone.utc)
    a_is_ext, b_is_ext = len(digits(a)) <= 5, len(digits(b)) <= 5
    if a_is_ext and b_is_ext:
        return None
    number = national(b if a_is_ext else a)
    return {'key': f'{y}-{mo}-{d} {h}:{mi}:{s} {a} {b}', 'started': started, 'number': number, 'variant': bool(variant)}


def find_transcripts(root, since):
    """Newest-first list of (path, parsed). Prefers the plain transcript over a
    '-DESKTOP-…' re-transcription of the same call."""
    chosen = {}
    for path in Path(root).rglob('*.txt'):
        if path.name.startswith('_'):
            continue
        p = parse_name(path.name)
        if not p or p['started'] < since:
            continue
        current = chosen.get(p['key'])
        if current is None or (current[1]['variant'] and not p['variant']):
            chosen[p['key']] = (path, p)
    return sorted(chosen.values(), key=lambda x: x[1]['started'], reverse=True)


def shorten(text, limit=MAX_TRANSCRIPT):
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= limit:
        return text
    half = limit // 2
    return text[:half] + ' […] ' + text[-half:]


def tidy_summary(raw):
    """Keeps the five expected lines in order; falls back to the trimmed raw text."""
    found = {}
    for line in raw.splitlines():
        line = line.strip().lstrip('-*• ').replace('**', '')
        for key in LINE_KEYS:
            if line.lower().startswith(key.lower() + ':') and key not in found:
                found[key] = line[len(key) + 1:].strip()
    if len(found) >= 3:
        return '\n'.join(f'{k}: {found.get(k, "Not mentioned")}' for k in LINE_KEYS)
    return raw.strip()[:1500]


def http_json(url, data=None, headers=None, method=None, timeout=60):
    body = None
    headers = dict(headers or {})
    if isinstance(data, dict) and headers.get('Content-Type') == 'application/x-www-form-urlencoded':
        body = urllib.parse.urlencode(data).encode()
    elif data is not None:
        body = json.dumps(data).encode()
        headers.setdefault('Content-Type', 'application/json')
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def summarise(transcript, cfg=CONFIG, post=http_json):
    res = post(f"{cfg['ollama_url']}/api/generate", {
        'model': cfg['ollama_model'],
        'prompt': PROMPT.format(transcript=shorten(transcript)),
        'stream': False,
        'options': {'temperature': 0.2, 'num_ctx': 8192},
    }, timeout=600)
    return tidy_summary(res.get('response', ''))


class Salesforce:
    def __init__(self, login_url, client_id, client_secret, request=http_json):
        self.login_url, self.client_id, self.client_secret = login_url.rstrip('/'), client_id, client_secret
        self.request = request
        self.token = self.instance = None

    def auth(self):
        res = self.request(f'{self.login_url}/services/oauth2/token', {
            'grant_type': 'client_credentials', 'client_id': self.client_id, 'client_secret': self.client_secret,
        }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        self.token, self.instance = res['access_token'], res['instance_url']

    def call(self, method, path, data=None):
        if not self.token:
            self.auth()
        return self.request(f'{self.instance}/services/data/{API}{path}', data,
                            headers={'Authorization': f'Bearer {self.token}'}, method=method)

    def find_task(self, number, started):
        lo = (started - dt.timedelta(seconds=MATCH_WINDOW_S)).strftime('%Y-%m-%dT%H:%M:%SZ')
        hi = (started + dt.timedelta(seconds=MATCH_WINDOW_S)).strftime('%Y-%m-%dT%H:%M:%SZ')
        soql = ("SELECT Id, Description, Call_Started__c FROM Task WHERE TaskSubtype = 'Call' "
                f"AND Call_Number__c = '{national(number)}' AND Call_Started__c >= {lo} AND Call_Started__c <= {hi}")
        recs = self.call('GET', '/query?q=' + urllib.parse.quote(soql))['records']
        if not recs:
            return None
        def gap(r):
            t = dt.datetime.strptime(r['Call_Started__c'][:19], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=dt.timezone.utc)
            return abs((t - started).total_seconds())
        return min(recs, key=gap)

    def add_summary(self, task, summary, today):
        text = f'{MARKER} (automatic, local AI, {today})\n{summary}\n\n{task.get("Description") or ""}'.strip()
        self.call('PATCH', f"/sobjects/Task/{task['Id']}", {'Description': text[:32000]})


def load_state(path):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def save_state(path, state):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(state, indent=1), encoding='utf-8')


def process(items, sf, state, summarise_fn, now, dry_run=False, log=print):
    """Returns counts per outcome. A transcript with no Task yet is retried on
    later runs until it is two days old (the logger may not have caught it)."""
    counts = {}
    def done(key, outcome):
        counts[outcome] = counts.get(outcome, 0) + 1
        if not dry_run:
            state[key] = {'outcome': outcome, 'at': now.isoformat(timespec='seconds')}

    for path, p in items:
        if p['key'] in state:
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        if len(text.split()) < MIN_WORDS:
            done(p['key'], 'too short')
            continue
        task = sf.find_task(p['number'], p['started']) if sf else None
        if task is None and not dry_run:
            if now - p['started'] > dt.timedelta(days=2):
                done(p['key'], 'no task')
            else:
                counts['waiting'] = counts.get('waiting', 0) + 1
            continue
        if task and MARKER in (task.get('Description') or ''):
            done(p['key'], 'already summarised')
            continue
        summary = summarise_fn(text)
        if dry_run:
            log(f'--- {path.name} -> {task["Id"] if task else "no task"}\n{summary}\n')
            counts['previewed'] = counts.get('previewed', 0) + 1
            continue
        sf.add_summary(task, summary, now.strftime('%d/%m/%Y'))
        done(p['key'], 'summarised')
        log(f'summarised {path.name} -> Task {task["Id"]}')
    return counts


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--dry-run', action='store_true', help='print summaries, write nothing')
    ap.add_argument('--file', help='process a single transcript')
    ap.add_argument('--write', action='store_true', help='with --file: really update Salesforce')
    ap.add_argument('--no-salesforce', action='store_true', help='with --dry-run: skip the Task lookup')
    args = ap.parse_args(argv)
    now = dt.datetime.now(dt.timezone.utc)
    dry = args.dry_run or (args.file and not args.write)

    sf = None
    if not args.no_salesforce:
        creds = json.loads(Path(CONFIG['creds_file']).read_text(encoding='utf-8'))
        sf = Salesforce(CONFIG['sf_login_url'], creds['client_id'], creds['client_secret'])

    if args.file:
        path = Path(args.file)
        p = parse_name(path.name)
        if not p:
            sys.exit(f'Not a call transcript name: {path.name}')
        items = [(path, p)]
    else:
        items = find_transcripts(CONFIG['recordings_dir'], now - dt.timedelta(days=CONFIG['lookback_days']))

    state = load_state(CONFIG['state_file'])
    counts = process(items, sf, state, summarise, now, dry_run=dry)
    if not dry:
        save_state(CONFIG['state_file'], state)
    print(f'{now:%Y-%m-%d %H:%M:%S}  transcripts seen: {len(items)}  ' + '  '.join(f'{k}: {v}' for k, v in sorted(counts.items())))


if __name__ == '__main__':
    main()
