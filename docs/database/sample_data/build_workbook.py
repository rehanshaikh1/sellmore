#!/usr/bin/env python3
"""Builds table-data-sample.xlsx: example rows for every table in the database.

How it works
  1. Loads schema.sql and the sample_data/*.sql files into a real PostgreSQL database. Every row therefore passed the real
     constraints, triggers and credit functions: if a combination is impossible, the load stops with the database's error.
  2. Reads every table back, in column order, and writes one block per table: heading, one-line description,
     column names, then the rows.
  3. Prints a coverage report: enum values and true/false values that no row shows, and nullable columns that are never empty
     or never filled.

Run from docs/database:
    python3 sample_data/build_workbook.py                       # starts a throw-away PostgreSQL, writes table-data-sample.xlsx
    python3 sample_data/build_workbook.py --port 54329 --db x   # use a server that is already running (the database is recreated)

Needs PostgreSQL 15+ with the pgvector extension (initdb, pg_ctl, psql; set --pgbin or PGBIN if they are not on PATH) and openpyxl.
"""
import argparse, datetime as dt, glob, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.dirname(HERE)

# One line for each table: what it is. Shown under the table heading and on the Contents sheet.
ONE_LINERS = {
 'platform_owner_users': 'SellMore staff who run the platform (super admins). They belong to no company.',
 'plans': 'The subscription plans: price, free trial length, seat and meeting limits, monthly credits.',
 'plan_features': 'Which features each plan switches on: one row per plan and feature.',
 'platform_limits': 'Platform-wide limits (file types, size, duration, invite expiry) stored as key and value rows.',
 'platform_audit_log': 'Append-only log of what SellMore staff did to companies and platform settings.',
 'clients': 'The customer companies: plan, status, free trial, credits, timezone and recording retention.',
 'client_users': 'Everyone who works for a client: client admins, managers and sales reps, with each rep\'s one manager.',
 'auth_identities': 'How each person signs in (password, Google, Microsoft, SAML, OIDC). Hidden from the API.',
 'invitations': 'Invitations to join a company: role, manager, expiry, and whether accepted, expired or revoked.',
 'manager_assignments': 'History of which manager each rep reported to, and when.',
 'notifications': 'In-app messages for one user, with a link and a read time.',
 'audit_log': 'Append-only log of who did what inside a company.',
 'credit_transactions': 'Append-only credit ledger: every spend, grant, refund and adjustment, with the balance after it.',
 'invoices': 'What clients pay SellMore: amount, purpose, status and PDF link.',
 'integrations': 'A company\'s links to Salesforce (CRM) and Google Drive, with sync settings and status.',
 'integration_credentials': 'Encrypted access tokens for each link. Only the sync workers can read them.',
 'integration_sync_runs': 'One row per sync attempt: how it started, how it ended and how many items it handled.',
 'integration_events': 'Raw change notices from Salesforce or Drive, kept so they can be replayed.',
 'crm_stage_mappings': 'Translates a company\'s Salesforce stage names into SellMore\'s six deal stages.',
 'crm_activities': 'Salesforce calls and meetings exactly as received: who, when, outcome, AI summary, recording link.',
 'leads': 'Deals (Salesforce Opportunities, or typed in by a rep): stage, value, owner and next meeting.',
 'lead_stakeholders': 'The buyer-side people on a deal and how they feel about it.',
 'lead_timeline_events': 'The history of a deal: meetings, emails, stage changes and notes.',
 'lead_risks': 'Risks spotted on a deal. A risk stays open until it is resolved.',
 'media_files': 'The audio, video and text files behind calls, uploaded or fetched from Drive, with retention dates.',
 'meetings': 'A call as SellMore shows it: joins the CRM record and the audio, then holds status, score and summary.',
 'analysis_runs': 'One row per AI job on a call (transcription, analysis, rescore): model, tokens and cost.',
 'meeting_insights': 'The report\'s written findings: what went well, what struggled, improvements and next steps.',
 'meeting_cue_scores': 'A call\'s score on each evaluation cue, with the quote and transcript line that justify it.',
 'meeting_objections': 'Buyer objections found in a call: category, the rep\'s reply and whether it was settled.',
 'transcript_segments': 'The call transcript, one row per speaker turn, with raw text, tags, a word index and a vector.',
 'transcript_segment_cues': 'Links a transcript turn to the cues it touches.',
 'cues': 'The evaluation cues calls are scored on: 12 platform defaults plus company versions and custom cues.',
 'knowledge_sources': 'Material the AI may quote: PDFs, web pages, videos and manual answers.',
 'company_documents': 'Playbooks and guides a company uploads, tagged to the cue they support.',
 'knowledge_chunks': 'The searchable pieces of sources and documents, each with a word index and a vector.',
 'knowledge_citations': 'One row each time the AI uses a knowledge source.',
 'practice_catalog': 'Ready-made practice exercises, from the platform or from one company.',
 'practice_lessons': 'A practice lesson built by or for a rep, from a call or a deal.',
 'practice_lesson_cues': 'The cues a practice lesson works on.',
 'practice_programs': 'An AI-built coaching programme for one rep on one deal, with progress.',
 'practice_program_meetings': 'The calls a coaching programme was built from.',
 'practice_program_lessons': 'The ordered lessons in a coaching programme, each with talk track and scenario.',
 'practice_attempts': 'A rep\'s typed replies in a practice lesson, each scored.',
 'lesson_feedback': 'A manager\'s written feedback on a rep\'s practice.',
 'mock_meetings': 'AI role-play sessions, with a score and speech measurements.',
 'mock_meeting_focus_cues': 'The cues a role-play focuses on.',
 'mock_meeting_points': 'Feedback after a role-play: what went well and what to improve.',
 'live_assist_sessions': 'Live Assist sessions a rep runs before or during a call.',
 'automations': 'Rules that run when something happens: trigger, condition and action.',
 'automation_runs': 'Each time an automation ran, and whether it worked.',
 'chat_threads': 'An AI chat conversation, private to the user who started it.',
 'chat_messages': 'The messages in a chat thread, with the model\'s raw reply, citations, tags and a vector.',
}
# Order rows so a table reads naturally. Default is the primary key.
ORDER_SQL = {
 'plans': 'SELECT * FROM plans ORDER BY sort_order',
 'plan_features': 'SELECT t.* FROM plan_features t JOIN plans p USING (plan_id) ORDER BY p.sort_order, t.feature_key',
}
DOMAIN_COLOURS = {'platform': '1F3A5F', 'identity': '2E5E4E', 'billing': '7A4E1D', 'integrations': '3B4A8C', 'leads': '8C3B5A',
                  'meetings': '1F6F8B', 'cues': '6B4C9A', 'practice': '9A5B1F', 'ai': '4A4A4A'}
MONEY_COLUMNS = {'price_monthly', 'amount'}
NOT_A_GAP = {'created_at', 'updated_at'}          # stamped by the database on every row


def find_bin(name, pgbin):
    for d in [pgbin, os.environ.get('PGBIN'), '/opt/homebrew/opt/postgresql@17/bin', '/opt/homebrew/opt/postgresql@16/bin',
              '/usr/local/opt/postgresql@17/bin', '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin']:
        if d and os.path.exists(os.path.join(d, name)): return os.path.join(d, name)
    p = shutil.which(name)
    if p: return p
    sys.exit(f'Cannot find {name}. Install PostgreSQL 15+ with pgvector, or pass --pgbin / set PGBIN.')


class Pg:
    def __init__(self, bindir, port, db):
        self.psql, self.port, self.db = find_bin('psql', bindir), port, db
        self.env = dict(os.environ, PGOPTIONS='-c timezone=UTC', LC_ALL='en_US.UTF-8')

    def run(self, args, db=None, check=True):
        cmd = [self.psql, '-h', '127.0.0.1', '-p', str(self.port), '-U', 'postgres', '-d', db or self.db, '-X', '-q'] + args
        r = subprocess.run(cmd, capture_output=True, text=True, env=self.env)
        if check and r.returncode != 0: sys.exit(f'psql failed:\n{r.stderr.strip()}')
        return r.stdout

    def load(self):
        self.run(['-c', f'DROP DATABASE IF EXISTS {self.db}'], db='postgres')
        self.run(['-c', f'CREATE DATABASE {self.db}'], db='postgres')
        self.run(['-v', 'ON_ERROR_STOP=1', '--single-transaction', '-o', os.devnull, '-f', os.path.join(DB_DIR, 'schema.sql')])
        parts = sorted(glob.glob(os.path.join(HERE, '[0-9]*.sql')))
        args = ['-v', 'ON_ERROR_STOP=1', '--single-transaction', '-o', os.devnull]
        for p in parts: args += ['-f', p]
        self.run(args)

    def rows(self, table, schema_table):
        pk = [c['n'] for c in schema_table['cols'] if c['pk']]
        sql = ORDER_SQL.get(table) or f'SELECT * FROM {table} ORDER BY {", ".join(pk)}'
        out = self.run(['-At', '-c', f"SELECT coalesce(json_agg(t), '[]'::json) FROM ({sql}) t"])
        return json.loads(out)


def short_vector(text):
    nums = text.strip('[]').split(',')
    return '[' + ', '.join(nums[:4]) + f', ... {len(nums):,} numbers]'


def cell_value(col, v):
    """Turn a database value into what goes in the cell: (value, number_format)."""
    if v is None: return None, None
    t = col['t']
    if t == 'timestamptz': return dt.datetime.fromisoformat(v).astimezone(dt.timezone.utc).replace(tzinfo=None, microsecond=0), 'yyyy-mm-dd hh:mm:ss'
    if t == 'date': return dt.date.fromisoformat(v), 'yyyy-mm-dd'
    if t == 'jsonb':
        s = json.dumps(v, ensure_ascii=False)
        return (s if len(s) <= 600 else s[:600] + ' ...'), None
    if t.endswith('[]'): return '{' + ','.join(str(x) for x in v) + '}', None
    if t.startswith('halfvec'): return short_vector(v), None
    if t == 'bytea':
        n = (len(v) - 2) // 2
        return f'({"encrypted" if col["n"].endswith("_enc") else "binary"}, {n} bytes)', None
    if t == 'tsvector': return (v if len(v) <= 400 else v[:400] + ' ...'), None
    if t == 'boolean': return bool(v), None
    if t.startswith('numeric'): return float(v), ('#,##0.00' if col['n'] in MONEY_COLUMNS else None)
    if t == 'bigint': return int(v), '#,##0'
    if t == 'int': return int(v), None
    return v, None


def combos(schema_table, rows):
    """Short text on the Contents sheet: which enum and true/false values the rows show."""
    parts = []
    for c in schema_table['cols']:
        vals = [r.get(c['n']) for r in rows]
        if c['note'].startswith('enum:'):
            allowed = c['note'][5:].split('|')
            if len(allowed) < 2: continue
            present = [a for a in allowed if a in vals]
            miss = [a for a in allowed if a not in vals]
            parts.append(f"{c['n']}: {', '.join(present)}" + (f' (not shown: {", ".join(miss)})' if miss else ''))
        elif c['t'] == 'boolean' and not c['pk']:
            seen = {v for v in vals if v is not None}
            parts.append(f"{c['n']}: " + ('true and false' if seen == {True, False} else f'only {str(next(iter(seen))).lower()}'))
    if any(r.get('deleted_at') for r in rows): parts.append('a soft-deleted row')
    optional = [c for c in schema_table['cols'] if c['null'] and not c['note'].startswith('gen:') and not c['pk'] and c['n'] not in NOT_A_GAP]
    if optional and len(rows) > 1:
        both = [c for c in optional if {r.get(c['n']) is None for r in rows} == {True, False}]
        parts.append(f'optional columns shown both filled and empty: {len(both)} of {len(optional)}')
    return ' | '.join(parts)


def coverage_gaps(schema, data):
    gaps = []
    for t in schema['tables']:
        rows = data[t['name']]
        for c in t['cols']:
            vals = [r.get(c['n']) for r in rows]
            if c['note'].startswith('enum:'):
                miss = [a for a in c['note'][5:].split('|') if a not in vals]
                if miss: gaps.append(f"{t['name']}.{c['n']}: no row with {', '.join(miss)}")
            elif c['t'] == 'boolean' and {v for v in vals if v is not None} != {True, False}:
                gaps.append(f"{t['name']}.{c['n']}: only {sorted({v for v in vals})}")
            elif c['null'] and not c['note'].startswith('gen:') and c['n'] not in NOT_A_GAP and len(rows) > 1 and not c['pk']:
                if all(v is None for v in vals): gaps.append(f"{t['name']}.{c['n']}: always empty")
                elif all(v is not None for v in vals): gaps.append(f"{t['name']}.{c['n']}: never empty")
    return gaps


def write_workbook(schema, data, out_path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.hyperlink import Hyperlink
    F = 'Arial'
    thin = Side(style='thin', color='BFBFBF'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
    wb = Workbook(); ws = wb.active; ws.title = 'Table data'; ws.sheet_view.showGridLines = False
    widths, starts = {}, {}
    row = 1
    for i, t in enumerate(schema['tables'], 1):
        name, cols, rows = t['name'], t['cols'], data[t['name']]
        starts[name] = row
        fill = PatternFill('solid', fgColor=DOMAIN_COLOURS[t['domain']])
        for c in range(1, len(cols) + 1): ws.cell(row, c).fill = fill
        ws.cell(row, 1, f'Table {i}: {name}').font = Font(name=F, size=13, bold=True, color='FFFFFF')
        ws.row_dimensions[row].height = 22; row += 1
        ws.cell(row, 1, ONE_LINERS[name]).font = Font(name=F, size=10, italic=True, color='404040'); row += 1
        for c, col in enumerate(cols, 1):
            cell = ws.cell(row, c, col['n']); cell.font = Font(name=F, size=10, bold=True); cell.border = box
            cell.fill = PatternFill('solid', fgColor='DCE6F1'); cell.alignment = Alignment(vertical='center')
            widths[c] = max(widths.get(c, 0), len(col['n']) + 2)
        row += 1
        for r in rows:
            for c, col in enumerate(cols, 1):
                v, fmt = cell_value(col, r.get(col['n']))
                cell = ws.cell(row, c, v); cell.font = Font(name=F, size=10); cell.border = box
                cell.alignment = Alignment(vertical='top', horizontal='left', wrap_text=True)
                if fmt: cell.number_format = fmt
                if v is not None:
                    longest = max((len(x) for x in str(v).split('\n')), default=0) if not isinstance(v, (dt.datetime, dt.date)) else 19
                    widths[c] = max(widths.get(c, 0), min(longest + 2, 46))
            row += 1
        row += 2
    for c, w in widths.items(): ws.column_dimensions[get_column_letter(c)].width = max(w, 10)

    # Contents sheet: where each table is, what it is, and which combinations its rows show
    cs = wb.create_sheet('Contents'); cs.sheet_view.showGridLines = False
    cs['A1'] = 'SellMore sample data: one example block for every table'; cs['A1'].font = Font(name=F, size=14, bold=True)
    notes = ['Every row was loaded into a real PostgreSQL database built from schema.sql, so each value passed the real constraints, triggers and credit functions.',
             'Ids are readable: the first part is the table number, the last part is the row number. 00000007-0000-0000-0000-000000000004 is row 4 of table 7 (client_users).',
             'An empty cell means NULL. Vectors and encrypted tokens are shortened. Times are UTC. created_at and updated_at show when the sample was loaded.',
             'All people, companies, phone numbers and ids are made up (example domains). Salesforce and Drive ids only follow the real format.',
             'Click a table name to jump to it. Colours group the tables by area.']
    for k, n in enumerate(notes, 2):
        cs.cell(k, 1, n).font = Font(name=F, size=10)
    hdr = 8
    for c, h in enumerate(['#', 'Table', 'Area', 'What it is', 'Rows', 'Combinations shown'], 1):
        cell = cs.cell(hdr, c, h); cell.font = Font(name=F, size=10, bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='1F3A5F')
    for i, t in enumerate(schema['tables'], 1):
        r = hdr + i
        cs.cell(r, 1, i)
        link = cs.cell(r, 2, t['name']); link.hyperlink = Hyperlink(ref=link.coordinate, location=f"'Table data'!A{starts[t['name']]}", display=t['name']); link.font = Font(name=F, size=10, color='0563C1', underline='single')
        cs.cell(r, 3, schema['domains'][t['domain']])
        cs.cell(r, 4, ONE_LINERS[t['name']])
        cs.cell(r, 5, len(data[t['name']]))
        cs.cell(r, 6, combos(t, data[t['name']]))
        for c in (1, 3, 4, 5, 6): cs.cell(r, c).font = Font(name=F, size=10)
        for c in range(1, 7):
            cs.cell(r, c).alignment = Alignment(vertical='top', wrap_text=(c in (4, 6)))
            cs.cell(r, c).border = box
    for col, w in zip('ABCDEF', (5, 26, 22, 70, 7, 90)): cs.column_dimensions[col].width = w
    wb.active = 0
    wb.save(out_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=os.path.join(DB_DIR, 'table-data-sample.xlsx'))
    ap.add_argument('--pgbin'); ap.add_argument('--port', type=int); ap.add_argument('--db', default='sellmore_sample')
    ap.add_argument('--no-report', action='store_true', help='skip the coverage report')
    a = ap.parse_args()
    schema = json.load(open(os.path.join(DB_DIR, 'schema.json')))
    tmp = None
    port = a.port
    if not port:
        tmp = tempfile.mkdtemp(prefix='sellmore_sample_'); port = 54399
        initdb, pg_ctl = find_bin('initdb', a.pgbin), find_bin('pg_ctl', a.pgbin)
        env = dict(os.environ, LC_ALL='en_US.UTF-8')
        subprocess.run([initdb, '-D', tmp + '/data', '-U', 'postgres', '--auth=trust', '-E', 'UTF8'], capture_output=True, check=True, env=env)
        subprocess.run([pg_ctl, '-D', tmp + '/data', '-o', f"-p {port} -c unix_socket_directories=''", '-l', tmp + '/log', '-w', 'start'], capture_output=True, check=True, env=env)
    try:
        pg = Pg(a.pgbin, port, a.db)
        pg.load()
        data = {t['name']: pg.rows(t['name'], t) for t in schema['tables']}
    finally:
        if tmp:
            subprocess.run([find_bin('pg_ctl', a.pgbin), '-D', tmp + '/data', 'stop', '-m', 'fast'], capture_output=True)
            shutil.rmtree(tmp, ignore_errors=True)
    write_workbook(schema, data, a.out)
    print(f'wrote {a.out}: {len(schema["tables"])} tables, {sum(len(v) for v in data.values())} rows')
    if not a.no_report:
        gaps = coverage_gaps(schema, data)
        print(f'coverage: {len(gaps)} gaps' + (':' if gaps else ''))
        for g in gaps: print('  ', g)


if __name__ == '__main__':
    main()
