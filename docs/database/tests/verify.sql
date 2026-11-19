-- Behaviour tests for schema.sql. Run on a scratch database:
--   createdb sellmore_test && psql -v ON_ERROR_STOP=1 -d sellmore_test -f ../schema.sql && psql -d sellmore_test -f verify.sql
-- Prints PASS / FAIL per rule and a summary. Everything is rolled back at the end.
\set ON_ERROR_STOP off
BEGIN;
CREATE SCHEMA t;
CREATE TABLE t.results(name text, ok boolean);
CREATE FUNCTION t.ok(p_name text, p_ok boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN INSERT INTO t.results VALUES (p_name, coalesce(p_ok, false)); RAISE NOTICE '% %', CASE WHEN coalesce(p_ok,false) THEN 'PASS' ELSE 'FAIL' END, p_name; END $$;
CREATE FUNCTION t.as_user(p_role text, p_user uuid, p_tenant uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('app.role', coalesce(p_role,''), true);
  PERFORM set_config('app.user_id', coalesce(p_user::text,''), true);
  PERFORM set_config('app.tenant_id', coalesce(p_tenant::text,''), true);
  EXECUTE 'SET LOCAL ROLE sellmore_app';
END $$;
-- count rows visible to the current role
CREATE FUNCTION t.n(p_sql text) RETURNS bigint LANGUAGE plpgsql AS $$ DECLARE v bigint; BEGIN EXECUTE p_sql INTO v; RETURN v; END $$;
-- true when the statement is refused
CREATE FUNCTION t.refused(p_sql text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN BEGIN EXECUTE p_sql; RETURN false; EXCEPTION WHEN OTHERS THEN RETURN true; END; END $$;
GRANT USAGE ON SCHEMA t TO sellmore_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO sellmore_app;
GRANT ALL ON t.results TO sellmore_app;

-- ---------- seed (as the owner: no row level security)
INSERT INTO tenants(id,name,slug,plan_id,credit_balance) VALUES
 ('a0000000-0000-0000-0000-000000000001','Apex','apex','growth',100),
 ('b0000000-0000-0000-0000-000000000001','Beta','beta','free',5);
INSERT INTO users(id,tenant_id,name,email,role) VALUES
 ('99999999-0000-0000-0000-000000000001',NULL,'Platform','root@x.io','super_admin'),
 ('aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Admin A','admin@a.io','client_admin'),
 ('aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001','Manager 1','m1@a.io','manager'),
 ('aaaaaaaa-0000-0000-0000-0000000000a2','a0000000-0000-0000-0000-000000000001','Manager 2','m2@a.io','manager'),
 ('bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Admin B','admin@b.io','client_admin'),
 ('bbbbbbbb-0000-0000-0000-0000000000a1','b0000000-0000-0000-0000-000000000001','Manager B','mb@b.io','manager');
INSERT INTO users(id,tenant_id,manager_id,name,email,role) VALUES
 ('aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000a1','Rep 1','r1@a.io','sales_rep'),
 ('aaaaaaaa-0000-0000-0000-0000000000b2','a0000000-0000-0000-0000-000000000001',NULL,'Rep 2 unassigned','r2@a.io','sales_rep'),
 ('bbbbbbbb-0000-0000-0000-0000000000b1','b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-0000000000a1','Rep B','rb@b.io','sales_rep');
INSERT INTO leads(id,tenant_id,owner_id,name,company_name,stage,source,crm_id) VALUES
 ('11111111-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','Deal 1','Co','Discovery','crm','006X1'),
 ('11111111-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b2','Deal 2','Co','Discovery','draft',NULL);
INSERT INTO integrations(id,tenant_id,type,provider,status) VALUES ('22222222-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','crm','salesforce','connected');
INSERT INTO crm_activities(id,tenant_id,integration_id,external_id,subject,owner_user_id) VALUES
 ('33333333-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','00TACT1','Call','aaaaaaaa-0000-0000-0000-0000000000b1');
INSERT INTO media_files(id,tenant_id,uploaded_by,source,storage_key,file_format) VALUES
 ('55555555-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b2','upload','k/r2.mp3','MP3');
INSERT INTO meetings(id,tenant_id,rep_id,lead_id,name,source,crm_activity_id,media_file_id,processing_status,meeting_at) VALUES
 ('44444444-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','11111111-0000-0000-0000-000000000001','R1 call','crm','00TACT1',NULL,'analysed','2026-11-01'),
 ('44444444-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b2',NULL,'R2 call','upload',NULL,'55555555-0000-0000-0000-000000000001','queued',NULL);
INSERT INTO transcript_segments(id,meeting_id,seq,speaker,speaker_role,start_ms,text) VALUES
 ('66666666-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001',1,'Rep','rep',0,'Hello'),
 ('66666666-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000001',2,'Buyer','prospect',5000,'Too expensive');
SELECT t.ok('seed: retention date stamped on media file', (SELECT retention_until > now() + interval '300 days' FROM media_files WHERE id='55555555-0000-0000-0000-000000000001'));
SELECT t.ok('seed: manager assignment history written for rep 1', (SELECT count(*) FROM manager_assignments WHERE rep_id='aaaaaaaa-0000-0000-0000-0000000000b1' AND ended_at IS NULL) = 1);

-- ================= manager - rep scoping =================
\set A 'a0000000-0000-0000-0000-000000000001'
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('admin sees every meeting in the company', t.n('select count(*) from meetings') = 2);
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('manager 1 sees their rep''s meeting only', t.n('select count(*) from meetings') = 1 AND t.n($$select count(*) from meetings where name='R1 call'$$) = 1);
SELECT t.ok('manager 1 sees their rep''s deal, not the unassigned rep''s', t.n('select count(*) from leads') = 1);
SELECT t.ok('manager 1 sees the rep''s CRM call', t.n('select count(*) from crm_activities') = 1);
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a2','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('manager 2 sees nothing of rep 1', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from leads') = 0);
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('rep sees only their own meeting', t.n('select count(*) from meetings') = 1);
SELECT t.ok('child rows follow the parent (transcript)', t.n('select count(*) from transcript_segments') = 2);
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b2','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('unassigned rep sees only their own meeting', t.n('select count(*) from meetings') = 1 AND t.n('select count(*) from transcript_segments') = 0);
SELECT t.as_user('client_admin','bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001');
SELECT t.ok('another company''s admin sees none of it', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from users') = 3 AND t.n('select count(*) from tenants') = 1);
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
SELECT t.ok('super admin sees no meetings or deals', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from leads') = 0);
SELECT t.ok('super admin sees every company', t.n('select count(*) from tenants') = 2);
SELECT t.ok('super admin gets usage counts from the view', (SELECT seats_used FROM tenant_usage WHERE tenant_id='a0000000-0000-0000-0000-000000000001') = 5);

-- ================= reassignment: admin moves rep 1 to manager 2 =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE users SET manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' WHERE id='aaaaaaaa-0000-0000-0000-0000000000b1';
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('after reassignment manager 1 loses the rep''s records', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from leads') = 0);
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a2','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('after reassignment manager 2 gains them', t.n('select count(*) from meetings') = 1 AND t.n('select count(*) from leads') = 1);
RESET ROLE;
SELECT t.ok('assignment history closes the old row and opens a new one', (SELECT count(*) FROM manager_assignments WHERE rep_id='aaaaaaaa-0000-0000-0000-0000000000b1') = 2
  AND (SELECT count(*) FROM manager_assignments WHERE rep_id='aaaaaaaa-0000-0000-0000-0000000000b1' AND ended_at IS NULL AND manager_id='aaaaaaaa-0000-0000-0000-0000000000a2') = 1);
SELECT t.ok('reassignment is written to the audit log', (SELECT count(*) FROM audit_log WHERE action='rep.reassigned') = 1);

-- ================= manager integrity =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep cannot be a manager''s manager', t.refused($$update users set manager_id='aaaaaaaa-0000-0000-0000-0000000000b2' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a manager from another company is refused', t.refused($$update users set manager_id='bbbbbbbb-0000-0000-0000-0000000000a1' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a manager cannot have a manager', t.refused($$update users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' where id='aaaaaaaa-0000-0000-0000-0000000000a1'$$));
SELECT t.ok('a meeting cannot use a rep from another company', t.refused($$insert into meetings(tenant_id,rep_id,name,source,crm_activity_id) values ('a0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-0000000000b1','x','crm','00TACT1')$$));
SELECT t.ok('a deal cannot be owned by another company''s user', t.refused($$insert into leads(tenant_id,owner_id,name,company_name,stage,source) values ('a0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-0000000000b1','x','x','Discovery','draft')$$));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep cannot promote themselves', t.refused($$update users set role='client_admin' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep cannot pick their own manager', t.refused($$update users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a1' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep can edit their own name', NOT t.refused($$update users set name='Rep One' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep cannot see or touch the tokens and password hashes', t.refused('select * from integration_credentials') AND t.refused('select * from auth_identities'));
SELECT t.ok('a rep cannot read another rep''s record by id', t.n($$select count(*) from meetings where id='44444444-0000-0000-0000-000000000002'$$) = 0);
SELECT t.ok('a rep cannot insert a meeting for another rep', t.refused($$insert into meetings(tenant_id,rep_id,name,source,crm_activity_id) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b2','x','crm','00TACT1')$$));
SELECT t.ok('a rep cannot write into another company', t.refused($$insert into leads(tenant_id,owner_id,name,company_name,stage,source) values ('b0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','x','x','Discovery','draft')$$));

-- ================= manager leaves: their reps become unassigned =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE users SET status='inactive' WHERE id='aaaaaaaa-0000-0000-0000-0000000000a2';
SELECT t.ok('deactivating a manager unassigns their reps', (SELECT manager_id IS NULL FROM users WHERE id='aaaaaaaa-0000-0000-0000-0000000000b1'));
SELECT t.ok('an inactive manager cannot be assigned reps', t.refused($$update users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' where id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));

-- ================= seat limit (free plan = 5 seats, company B has 3 active) =================
SELECT t.as_user('client_admin','bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001');
INSERT INTO users(tenant_id,name,email,role) VALUES ('b0000000-0000-0000-0000-000000000001','S4','s4@b.io','sales_rep'),('b0000000-0000-0000-0000-000000000001','S5','s5@b.io','sales_rep');
SELECT t.ok('seats up to the plan limit are allowed', t.n('select count(*) from users') = 5);
SELECT t.ok('the seat over the limit is refused', t.refused($$insert into users(tenant_id,name,email,role) values ('b0000000-0000-0000-0000-000000000001','S6','s6@b.io','sales_rep')$$));
SELECT t.ok('an email must be lower case', t.refused($$insert into users(tenant_id,name,email,role) values ('b0000000-0000-0000-0000-000000000001','S7','S7@B.io','sales_rep')$$));

-- ================= credits =================
SELECT t.ok('consume_credits returns the new balance', (SELECT consume_credits('b0000000-0000-0000-0000-000000000001', NULL, 'Meeting analysis', 2, 'job-1')) = 3);
SELECT t.ok('a retried request with the same key charges once', (SELECT consume_credits('b0000000-0000-0000-0000-000000000001', NULL, 'Meeting analysis', 2, 'job-1')) = 3
  AND t.n('select count(*) from credit_transactions') = 1);
SELECT t.ok('spending more than the balance is refused', t.refused($$select consume_credits('b0000000-0000-0000-0000-000000000001', NULL, 'x', 99)$$));
SELECT t.ok('one company cannot spend another''s credits', t.refused($$select consume_credits('a0000000-0000-0000-0000-000000000001', NULL, 'x', 1)$$));
SELECT t.ok('the API cannot edit the balance ledger', t.refused($$update credit_transactions set balance_after = 999$$) AND t.refused($$delete from credit_transactions$$));
SELECT t.ok('a client admin cannot grant themselves credits', t.refused($$select grant_credits('b0000000-0000-0000-0000-000000000001', 50, 'free money')$$));
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
SELECT t.ok('the super admin can grant credits', (SELECT grant_credits('b0000000-0000-0000-0000-000000000001', 10, 'Top-up')) = 13);
RESET ROLE;
SELECT t.ok('the owner cannot rewrite the ledger either (trigger)', t.refused('update credit_transactions set balance_after = 1'));
SELECT t.ok('the ledger matches the balance', (SELECT credit_balance FROM tenants WHERE id='b0000000-0000-0000-0000-000000000001') = 13);

-- ================= data integrity =================
SELECT t.ok('a CRM call cannot be imported twice', t.refused($$insert into meetings(tenant_id,rep_id,name,source,crm_activity_id) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','dup','crm','00TACT1')$$));
SELECT t.ok('a CRM meeting must point at a real CRM activity', t.refused($$insert into meetings(tenant_id,rep_id,name,source,crm_activity_id) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','ghost','crm','00TNOPE')$$));
SELECT t.ok('an objection must be a buyer line', t.refused($$insert into meeting_objections(meeting_id,segment_id,at_ms,objection,status) values ('44444444-0000-0000-0000-000000000001','66666666-0000-0000-0000-000000000001',0,'x','Resolved')$$));
SELECT t.ok('an objection on a buyer line is accepted', NOT t.refused($$insert into meeting_objections(meeting_id,segment_id,at_ms,objection,status) values ('44444444-0000-0000-0000-000000000001','66666666-0000-0000-0000-000000000002',5000,'Too expensive','Unresolved')$$));
SELECT t.ok('a score above 5 is refused', t.refused($$insert into meeting_cue_scores(meeting_id,cue_id,score,is_assessable) values ('44444444-0000-0000-0000-000000000001', gen_random_uuid(), 9, true)$$));
SELECT t.ok('a CRM deal must have a Salesforce id', t.refused($$insert into leads(tenant_id,owner_id,name,company_name,stage,source) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','x','x','Discovery','crm')$$));
SELECT t.ok('the same Opportunity cannot become two deals', t.refused($$insert into leads(tenant_id,owner_id,name,company_name,stage,source,crm_id) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','x','x','Discovery','crm','006X1')$$));
SELECT t.ok('a Drive file cannot be imported twice', (SELECT NOT t.refused($$insert into media_files(tenant_id,source,drive_file_id,storage_key) values ('a0000000-0000-0000-0000-000000000001','drive','F1','k1')$$))
   AND t.refused($$insert into media_files(tenant_id,source,drive_file_id,storage_key) values ('a0000000-0000-0000-0000-000000000001','drive','F1','k2')$$));
SELECT t.ok('lead.last_meeting_at follows its meetings (trigger)', (SELECT last_meeting_at FROM leads WHERE id='11111111-0000-0000-0000-000000000001') = '2026-11-01'::timestamptz);
UPDATE leads SET stage='Negotiation', stage_changed_at = now() - interval '10 days' WHERE id='11111111-0000-0000-0000-000000000001';
UPDATE leads SET stage='Closed Won' WHERE id='11111111-0000-0000-0000-000000000001';
SELECT t.ok('changing the stage restarts days in stage', (SELECT days_in_stage FROM lead_stats WHERE lead_id='11111111-0000-0000-0000-000000000001') = 0);
SELECT t.ok('lead_stats counts the deal''s calls', (SELECT call_count FROM lead_stats WHERE lead_id='11111111-0000-0000-0000-000000000001') = 1);
INSERT INTO cues(tenant_id,code,name,category,instructions) VALUES (NULL,1,'Opening','Intro','x');
SELECT t.ok('only one default cue per code', t.refused($$insert into cues(tenant_id,code,name,category,instructions) values (NULL,1,'Dup','Intro','x')$$));

-- ================= summary =================
SELECT count(*) FILTER (WHERE ok) AS passed, count(*) FILTER (WHERE NOT ok) AS failed FROM t.results;
SELECT name AS failed_check FROM t.results WHERE NOT ok;
ROLLBACK;
