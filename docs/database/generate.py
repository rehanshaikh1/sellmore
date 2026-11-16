import re, sys
sys.path.insert(0,'.')
from schema_def import TABLES, DOMAINS

def parse(flags): 
    f=[x for x in flags.split(',') if x]
    return {'pk':'pk' in f,'n':'n' in f,'uq':'uq' in f,'fk':next((x[3:] for x in f if x.startswith('fk:')),None)}

names=[t[0] for t in TABLES]
by={t[0]:t for t in TABLES}
# validate references
errs=[]
for name,dom,cols,uqs in TABLES:
    for cn,ty,fl,note in cols:
        p=parse(fl)
        if p['fk']:
            tt,tc=p['fk'].split('.')
            if tt not in by: errs.append(f'{name}.{cn} -> unknown table {tt}')
            elif tc not in [x[0] for x in by[tt][2]]: errs.append(f'{name}.{cn} -> unknown column {p["fk"]}')
            else:
                pt=[x for x in by[tt][2] if x[0]==tc][0]
                if pt[1]!=ty: errs.append(f'type mismatch {name}.{cn} {ty} vs {p["fk"]} {pt[1]}')
if errs: print('\n'.join(errs)); sys.exit(1)

# order tables by dependencies, ignoring self references
order=[]; seen=set()
def visit(n,stack=()):
    if n in seen: return
    seen.add(n)
    for cn,ty,fl,note in by[n][2]:
        fk=parse(fl)['fk']
        if fk:
            t=fk.split('.')[0]
            if t!=n and t not in stack: visit(t,stack+(n,))
    order.append(n)
# users <-> tenants has no cycle (tenants has no FK to users), but platform_limits/audit reference users
for n in names: visit(n)

out=['-- SellMore database schema (PostgreSQL 15+)','-- Generated from docs/database/schema_def.py. See er-diagram.html for the picture.','',
'CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()','']
for n in order:
    name,dom,cols,uqs=by[n]
    pks=[x[0] for x in cols if parse(x[2])['pk']]
    lines=[]
    for cn,ty,fl,note in cols:
        p=parse(fl); sql=f'  {cn} {ty}'
        if len(pks)==1 and p['pk'] and ty=='uuid': sql+=' PRIMARY KEY DEFAULT gen_random_uuid()'
        elif len(pks)==1 and p['pk']: sql+=' PRIMARY KEY'
        if not p['n'] and not p['pk']: sql+=' NOT NULL'
        if p['uq']: sql+=' UNIQUE'
        if p['fk']:
            t,k=p['fk'].split('.')
            cascade=' ON DELETE CASCADE' if (cn in ('tenant_id',) and not p['n']) or cn in ('meeting_id','lead_id','lesson_id','thread_id','automation_id','mock_meeting_id','plan_id','source_id') and not p['n'] else ''
            sql+=f' REFERENCES {t}({k}){cascade}'
        if note.startswith('enum:'):
            vals=', '.join("'"+v+"'" for v in note[5:].split('|'))
            sql+=f' CHECK ({cn} IN ({vals}))'
        elif cn in ('created_at','updated_at','uploaded_at','issued_at','started_at','cited_at','ran_at','detected_at') and ty=='timestamptz': sql+=' DEFAULT now()'
        lines.append(sql+(f'  -- {note}' if note and not note.startswith('enum:') else ''))
    if len(pks)>1: lines.append(f'  PRIMARY KEY ({", ".join(pks)})')
    for u in uqs: lines.append(f'  UNIQUE ({", ".join(u)})')
    # fix trailing commas: comments after commas
    body=[]
    for i,l in enumerate(lines):
        last=i==len(lines)-1
        if '  -- ' in l:
            code,cm=l.split('  -- ',1); body.append(code+('' if last else ',')+'  -- '+cm)
        else: body.append(l+('' if last else ','))
    out.append(f'-- {DOMAINS[dom]}')
    out.append(f'CREATE TABLE {name} (')
    out+=body
    out.append(');')
    out.append('')

out.append('-- Indexes on every foreign key and the common filters')
for n in order:
    for cn,ty,fl,note in by[n][2]:
        p=parse(fl)
        if p['fk'] and not p['pk']: out.append(f'CREATE INDEX idx_{n}_{cn} ON {n}({cn});')
out+=['CREATE INDEX idx_meetings_tenant_rep ON meetings(tenant_id, rep_id, uploaded_at DESC);',
'CREATE INDEX idx_leads_tenant_owner ON leads(tenant_id, owner_id);',
'CREATE UNIQUE INDEX uq_cues_default_code ON cues(code) WHERE tenant_id IS NULL;',
'CREATE UNIQUE INDEX uq_cues_one_override ON cues(tenant_id, overrides_cue_id) WHERE overrides_cue_id IS NOT NULL;','',
'''-- ---------------------------------------------------------------
-- Access by role. Enforced in the database with row level security,
-- so a bug in the app cannot leak another tenant's or rep's data.
-- The API sets, per request:  SET app.user_id, app.tenant_id, app.role
-- ---------------------------------------------------------------
-- super_admin : tenant_id IS NULL. Reads/writes platform tables only. Tenant data is reached
--               through audited, read-only support access (platform_audit_log).
-- client_admin: every row where tenant_id = app.tenant_id
-- manager     : rows in the tenant where owner/rep is the manager or one of users.manager_id = manager
-- sales_rep   : rows in the tenant where owner/rep = the rep
--
-- Example policy (repeat for leads, practice_lessons, mock_meetings, live_assist_sessions):
--
-- ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY meetings_access ON meetings USING (
--   tenant_id = current_setting('app.tenant_id')::uuid AND (
--     current_setting('app.role') = 'client_admin'
--     OR rep_id = current_setting('app.user_id')::uuid
--     OR (current_setting('app.role') = 'manager' AND rep_id IN (
--          SELECT id FROM users WHERE manager_id = current_setting('app.user_id')::uuid))
--   )
-- );
''']
open('/Users/rehan/sellmore/docs/database/schema.sql','w').write('\n'.join(out))
print('tables',len(order)); print('FKs',sum(1 for n in names for x in by[n][2] if parse(x[2])['fk']))
import json
data={'domains':DOMAINS,'tables':[{'name':n,'domain':d,'cols':[{'n':cn,'t':ty,'pk':parse(fl)['pk'],'fk':parse(fl)['fk'],'null':parse(fl)['n'],'uq':parse(fl)['uq'],'note':note} for cn,ty,fl,note in cols],'uniques':uq} for n,d,cols,uq in TABLES]}
json.dump(data,open('schema.json','w'))
