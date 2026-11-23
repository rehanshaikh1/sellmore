-- Behaviour tests for schema.sql. Run on a scratch database:
--   createdb sellmore_test && psql -v ON_ERROR_STOP=1 -d sellmore_test -f ../schema.sql && psql -d sellmore_test -f verify.sql
-- Prints PASS / FAIL per rule and a summary. Everything is rolled back at the end.
\set ON_ERROR_STOP off
BEGIN;
CREATE SCHEMA t;
CREATE TABLE t.results(name text, ok boolean);
CREATE FUNCTION t.ok(p_name text, p_ok boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN INSERT INTO t.results VALUES (p_name, coalesce(p_ok, false)); RAISE NOTICE '% %', CASE WHEN coalesce(p_ok,false) THEN 'PASS' ELSE 'FAIL' END, p_name; END $$;
CREATE FUNCTION t.as_user(p_role text, p_user uuid, p_client uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('app.role', coalesce(p_role,''), true);
  PERFORM set_config('app.user_id', coalesce(p_user::text,''), true);
  PERFORM set_config('app.client_id', coalesce(p_client::text,''), true);
  EXECUTE 'SET LOCAL ROLE sellmore_app';
END $$;
-- back to the table owner: no row level security and no app.* settings, like a worker or a migration
CREATE FUNCTION t.as_owner() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('app.role', '', true); PERFORM set_config('app.user_id', '', true); PERFORM set_config('app.client_id', '', true);
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
INSERT INTO clients(client_id,name,slug,plan_id,credit_balance) VALUES
 ('a0000000-0000-0000-0000-000000000001','Apex','apex','growth',100),
 ('b0000000-0000-0000-0000-000000000001','Beta','beta','free',5);
INSERT INTO platform_owner_users(platform_owner_user_id,name,email) VALUES ('99999999-0000-0000-0000-000000000001','Platform','root@x.io');
INSERT INTO client_users(client_user_id,client_id,name,email,role) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Admin A','admin@a.io','client_admin'),
 ('aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001','Manager 1','m1@a.io','manager'),
 ('aaaaaaaa-0000-0000-0000-0000000000a2','a0000000-0000-0000-0000-000000000001','Manager 2','m2@a.io','manager'),
 ('bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Admin B','admin@b.io','client_admin'),
 ('bbbbbbbb-0000-0000-0000-0000000000a1','b0000000-0000-0000-0000-000000000001','Manager B','mb@b.io','manager');
INSERT INTO client_users(client_user_id,client_id,manager_id,name,email,role) VALUES
 ('aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000a1','Rep 1','r1@a.io','sales_rep'),
 ('aaaaaaaa-0000-0000-0000-0000000000b2','a0000000-0000-0000-0000-000000000001',NULL,'Rep 2 unassigned','r2@a.io','sales_rep'),
 ('bbbbbbbb-0000-0000-0000-0000000000b1','b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-0000000000a1','Rep B','rb@b.io','sales_rep');
INSERT INTO leads(lead_id,client_user_id,name,company_name,stage,source,crm_id) VALUES
 ('11111111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','Deal 1','Co','Discovery','crm','006X1'),
 ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-0000000000b2','Deal 2','Co','Discovery','draft',NULL);
INSERT INTO integrations(integration_id,client_id,type,provider,status) VALUES ('22222222-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','crm','salesforce','connected');
INSERT INTO crm_activities(crm_activity_id,client_id,integration_id,external_id,subject,owner_user_id) VALUES
 ('33333333-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','Call','aaaaaaaa-0000-0000-0000-0000000000b1');
INSERT INTO media_files(media_file_id,client_id,uploaded_by,source,storage_key,file_format) VALUES
 ('55555555-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b2','upload','k/r2.mp3','MP3');
INSERT INTO meetings(meeting_id,client_user_id,lead_id,name,source,crm_activity_id,media_file_id,processing_status,meeting_at) VALUES
 ('44444444-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','11111111-0000-0000-0000-000000000001','R1 call','crm','33333333-0000-0000-0000-000000000001',NULL,'analysed','2026-11-01'),
 ('44444444-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-0000000000b2',NULL,'R2 call','upload',NULL,'55555555-0000-0000-0000-000000000001','queued',NULL);
INSERT INTO transcript_segments(transcript_segment_id,meeting_id,seq,speaker,speaker_role,start_ms,text) VALUES
 ('66666666-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000001',1,'Rep','rep',0,'Hello'),
 ('66666666-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000001',2,'Buyer','prospect',5000,'Too expensive');
SELECT t.ok('seed: retention date stamped on media file', (SELECT retention_until > now() + interval '300 days' FROM media_files WHERE media_file_id='55555555-0000-0000-0000-000000000001'));
SELECT t.ok('seed: manager assignment history written for rep 1', (SELECT count(*) FROM manager_assignments WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1' AND ended_at IS NULL) = 1);

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
SELECT t.ok('another company''s admin sees none of it', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from client_users') = 3 AND t.n('select count(*) from clients') = 1);
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
SELECT t.ok('super admin sees no meetings or deals', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from leads') = 0);
SELECT t.ok('super admin sees every company', t.n('select count(*) from clients') = 2);
SELECT t.ok('super admin can read the platform owners', t.n('select count(*) from platform_owner_users') = 1);
SELECT t.ok('a platform owner can record an action in the platform log', NOT t.refused($$insert into platform_audit_log(actor_id, action) values ('99999999-0000-0000-0000-000000000001','client.created')$$));
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a client admin cannot see the platform owners', t.n('select count(*) from platform_owner_users') = 0);
SELECT t.ok('a client admin cannot add a platform owner', t.refused($$insert into platform_owner_users(name,email) values ('Sneaky','s@x.io')$$));
SELECT t.as_owner();
SELECT t.ok('a client user must belong to a company', t.refused($$insert into client_users(client_id,name,email,role) values (NULL,'No company','nc@x.io','client_admin')$$));
SELECT t.ok('super_admin is not a client user role', t.refused($$insert into client_users(client_id,name,email,role) values ('a0000000-0000-0000-0000-000000000001','Root','root2@x.io','super_admin')$$));
SELECT t.ok('a client user cannot be the platform log actor', t.refused($$insert into platform_audit_log(actor_id, action) values ('aaaaaaaa-0000-0000-0000-000000000001','x')$$));
SELECT t.ok('a sign-in belongs to a client user or a platform owner', NOT t.refused($$insert into auth_identities(user_id, provider, subject, password_hash) values ('aaaaaaaa-0000-0000-0000-000000000001','password','admin@a.io','h')$$) AND NOT t.refused($$insert into auth_identities(platform_owner_user_id, provider, subject, password_hash) values ('99999999-0000-0000-0000-000000000001','password','root@x.io','h')$$));
SELECT t.ok('a sign-in cannot belong to both or to nobody', t.refused($$insert into auth_identities(provider, subject, password_hash) values ('password','nobody','h')$$) AND t.refused($$insert into auth_identities(user_id, platform_owner_user_id, provider, subject, password_hash) values ('aaaaaaaa-0000-0000-0000-0000000000a1','99999999-0000-0000-0000-000000000001','password','both','h')$$));
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
SELECT t.ok('super admin gets usage counts from the view', (SELECT seats_used FROM client_usage WHERE client_id='a0000000-0000-0000-0000-000000000001') = 5);

-- ================= reassignment: admin moves rep 1 to manager 2 =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE client_users SET manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1';
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('after reassignment manager 1 loses the rep''s records', t.n('select count(*) from meetings') = 0 AND t.n('select count(*) from leads') = 0);
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a2','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('after reassignment manager 2 gains them', t.n('select count(*) from meetings') = 1 AND t.n('select count(*) from leads') = 1);
SELECT t.as_owner();
SELECT t.ok('assignment history closes the old row and opens a new one', (SELECT count(*) FROM manager_assignments WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1') = 2
  AND (SELECT count(*) FROM manager_assignments WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1' AND ended_at IS NULL AND manager_id='aaaaaaaa-0000-0000-0000-0000000000a2') = 1);
SELECT t.ok('reassignment is written to the audit log', (SELECT count(*) FROM audit_log WHERE action='rep.reassigned') = 1);

-- ================= manager integrity =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep cannot be a manager''s manager', t.refused($$update client_users set manager_id='aaaaaaaa-0000-0000-0000-0000000000b2' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a manager from another company is refused', t.refused($$update client_users set manager_id='bbbbbbbb-0000-0000-0000-0000000000a1' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a manager cannot have a manager', t.refused($$update client_users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000a1'$$));
SELECT t.ok('a meeting cannot use another company''s call record', t.refused($$insert into meetings(client_user_id,name,source,crm_activity_id) values ('bbbbbbbb-0000-0000-0000-0000000000b1','x','crm','33333333-0000-0000-0000-000000000001')$$));
SELECT t.ok('a deal has no company column of its own', NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='client_id'));
SELECT t.ok('a meeting cannot point at another company''s deal', t.refused($$insert into meetings(client_user_id,lead_id,name,source) values ('bbbbbbbb-0000-0000-0000-0000000000b1','11111111-0000-0000-0000-000000000001','x','upload')$$));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep cannot promote themselves', t.refused($$update client_users set role='client_admin' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep cannot pick their own manager', t.refused($$update client_users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a1' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep can edit their own name', NOT t.refused($$update client_users set name='Rep One' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));
SELECT t.ok('a rep cannot see or touch the tokens and password hashes', t.refused('select * from integration_credentials') AND t.refused('select * from auth_identities'));
SELECT t.ok('a rep cannot read another rep''s record by id', t.n($$select count(*) from meetings where meeting_id='44444444-0000-0000-0000-000000000002'$$) = 0);
SELECT t.ok('a rep cannot insert a meeting for another rep', t.refused($$insert into meetings(client_user_id,name,source,crm_activity_id) values ('aaaaaaaa-0000-0000-0000-0000000000b2','x','crm','33333333-0000-0000-0000-000000000001')$$));
SELECT t.ok('a rep cannot create a deal for another company''s rep', t.refused($$insert into leads(client_user_id,name,company_name,stage,source) values ('bbbbbbbb-0000-0000-0000-0000000000b1','x','x','Discovery','draft')$$));

-- ================= manager leaves: their reps become unassigned =================
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE client_users SET status='inactive' WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000a2';
SELECT t.ok('deactivating a manager unassigns their reps', (SELECT manager_id IS NULL FROM client_users WHERE client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'));
SELECT t.ok('an inactive manager cannot be assigned reps', t.refused($$update client_users set manager_id='aaaaaaaa-0000-0000-0000-0000000000a2' where client_user_id='aaaaaaaa-0000-0000-0000-0000000000b1'$$));

-- ================= seat limit (free plan = 5 seats, company B has 3 active) =================
SELECT t.as_user('client_admin','bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001');
INSERT INTO client_users(client_id,name,email,role) VALUES ('b0000000-0000-0000-0000-000000000001','S4','s4@b.io','sales_rep'),('b0000000-0000-0000-0000-000000000001','S5','s5@b.io','sales_rep');
SELECT t.ok('seats up to the plan limit are allowed', t.n('select count(*) from client_users') = 5);
SELECT t.ok('the seat over the limit is refused', t.refused($$insert into client_users(client_id,name,email,role) values ('b0000000-0000-0000-0000-000000000001','S6','s6@b.io','sales_rep')$$));
SELECT t.ok('an email must be lower case', t.refused($$insert into client_users(client_id,name,email,role) values ('b0000000-0000-0000-0000-000000000001','S7','S7@B.io','sales_rep')$$));

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
SELECT t.as_owner();
SELECT t.ok('the owner cannot rewrite the ledger either (trigger)', t.refused('update credit_transactions set balance_after = 1'));
SELECT t.ok('the ledger matches the balance', (SELECT credit_balance FROM clients WHERE client_id='b0000000-0000-0000-0000-000000000001') = 13);

-- ================= data integrity =================
SELECT t.ok('a CRM call cannot be imported twice', t.refused($$insert into meetings(client_user_id,name,source,crm_activity_id) values ('aaaaaaaa-0000-0000-0000-0000000000b1','dup','crm','33333333-0000-0000-0000-000000000001')$$));
SELECT t.ok('a CRM meeting must point at a real CRM activity', t.refused($$insert into meetings(client_user_id,name,source,crm_activity_id) values ('aaaaaaaa-0000-0000-0000-0000000000b1','ghost','crm','33333333-0000-0000-0000-0000000000ff')$$));
SELECT t.ok('an objection must be a buyer line', t.refused($$insert into meeting_objections(meeting_id,segment_id,at_ms,objection,status) values ('44444444-0000-0000-0000-000000000001','66666666-0000-0000-0000-000000000001',0,'x','Resolved')$$));
SELECT t.ok('an objection on a buyer line is accepted', NOT t.refused($$insert into meeting_objections(meeting_id,segment_id,at_ms,objection,status) values ('44444444-0000-0000-0000-000000000001','66666666-0000-0000-0000-000000000002',5000,'Too expensive','Unresolved')$$));
SELECT t.ok('a score above 5 is refused', t.refused($$insert into meeting_cue_scores(meeting_id,cue_id,score,is_assessable) values ('44444444-0000-0000-0000-000000000001', gen_random_uuid(), 9, true)$$));
SELECT t.ok('a CRM deal must have a Salesforce id', t.refused($$insert into leads(client_user_id,name,company_name,stage,source) values ('aaaaaaaa-0000-0000-0000-0000000000b1','x','x','Discovery','crm')$$));
SELECT t.ok('the same Opportunity cannot become two deals', t.refused($$insert into leads(client_user_id,name,company_name,stage,source,crm_id) values ('aaaaaaaa-0000-0000-0000-0000000000b1','x','x','Discovery','crm','006X1')$$));
SELECT t.ok('a Drive file cannot be imported twice', (SELECT NOT t.refused($$insert into media_files(client_id,source,drive_file_id,storage_key) values ('a0000000-0000-0000-0000-000000000001','drive','F1','k1')$$))
   AND t.refused($$insert into media_files(client_id,source,drive_file_id,storage_key) values ('a0000000-0000-0000-0000-000000000001','drive','F1','k2')$$));
SELECT t.ok('lead.last_meeting_at follows its meetings (trigger)', (SELECT last_meeting_at FROM leads WHERE lead_id='11111111-0000-0000-0000-000000000001') = '2026-11-01'::timestamptz);
UPDATE leads SET stage='Negotiation', stage_changed_at = now() - interval '10 days' WHERE lead_id='11111111-0000-0000-0000-000000000001';
UPDATE leads SET stage='Closed Won' WHERE lead_id='11111111-0000-0000-0000-000000000001';
SELECT t.ok('changing the stage restarts days in stage', (SELECT days_in_stage FROM lead_stats WHERE lead_id='11111111-0000-0000-0000-000000000001') = 0);
SELECT t.ok('lead_stats counts the deal''s calls', (SELECT call_count FROM lead_stats WHERE lead_id='11111111-0000-0000-0000-000000000001') = 1);
INSERT INTO cues(client_id,code,name,category,instructions) VALUES (NULL,1,'Opening','Intro','x');
SELECT t.ok('only one default cue per code', t.refused($$insert into cues(client_id,code,name,category,instructions) values (NULL,1,'Dup','Intro','x')$$));

-- ================= tags, raw text, vectors =================
SELECT t.as_owner();
CREATE FUNCTION t.vec(i int) RETURNS halfvec LANGUAGE sql AS
  $$ SELECT (array(SELECT CASE WHEN g = i THEN 1.0 ELSE 0.0 END FROM generate_series(1,1536) g))::real[]::halfvec(1536) $$;
INSERT INTO transcript_segments(transcript_segment_id,meeting_id,seq,speaker,speaker_role,start_ms,text,raw_text,embeddings,embedding_model,embedded_at) VALUES
 ('66666666-0000-0000-0000-000000000003','44444444-0000-0000-0000-000000000002',1,'Buyer','prospect',0,'We need it by June','we need it by june uh',t.vec(1),'test-model',now());
INSERT INTO analysis_runs(meeting_id,kind,status,raw_output) VALUES ('44444444-0000-0000-0000-000000000002','analysis','success','{"cues":[]}');
UPDATE transcript_segments SET raw_text='hello', embeddings=t.vec(2), embedding_model='test-model', embedded_at=now(), tags='{greeting}' WHERE transcript_segment_id='66666666-0000-0000-0000-000000000001';

SELECT t.ok('tags must be lower case', t.refused($$update transcript_segments set tags='{Pricing}' where transcript_segment_id='66666666-0000-0000-0000-000000000001'$$));
SELECT t.ok('no more than 20 tags', t.refused($$update meetings set tags = (select array_agg('t'||g) from generate_series(1,21) g) where meeting_id='44444444-0000-0000-0000-000000000001'$$));
UPDATE transcript_segments SET tags='{pricing,security}' WHERE transcript_segment_id='66666666-0000-0000-0000-000000000002';
SELECT t.ok('tag filter finds the line', t.n($$select count(*) from transcript_segments where tags && array['pricing']$$) = 1);
SELECT t.ok('a vector of the wrong size is refused', t.refused($$update transcript_segments set embeddings='[1,2,3]'::halfvec where transcript_segment_id='66666666-0000-0000-0000-000000000001'$$));
SELECT t.ok('nearest-meaning search returns the closest turn',
  (SELECT transcript_segment_id FROM transcript_segments WHERE embeddings IS NOT NULL ORDER BY embeddings <=> t.vec(2) LIMIT 1) = '66666666-0000-0000-0000-000000000001'
  AND (SELECT transcript_segment_id FROM transcript_segments WHERE embeddings IS NOT NULL ORDER BY embeddings <=> t.vec(1) LIMIT 1) = '66666666-0000-0000-0000-000000000003');
SELECT t.ok('the vector index exists', (SELECT count(*) FROM pg_indexes WHERE indexname = 'idx_transcript_segments_embeddings' AND indexdef LIKE '%hnsw%') = 1);

SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b2','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('vector search only reaches the rep''s own calls', t.n('select count(*) from transcript_segments where embeddings is not null') = 1);
SELECT t.as_user('manager','aaaaaaaa-0000-0000-0000-0000000000a1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('vector search follows the manager rule too', t.n('select count(*) from transcript_segments where embeddings is not null') = 0);
SELECT t.as_owner();

INSERT INTO chat_threads(chat_thread_id,client_user_id,title) VALUES ('77777777-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','t');
INSERT INTO practice_lessons(practice_lesson_id,client_user_id,created_by,meeting_id,origin,method,title) VALUES ('88888888-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-0000000000b1','aaaaaaaa-0000-0000-0000-0000000000a1','44444444-0000-0000-0000-000000000001','meeting','checklist','L1');
SELECT t.ok('owner tables have no client_id, the company comes from the person', NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name IN ('leads','meetings','manager_assignments','practice_lessons','practice_programs','practice_attempts','lesson_feedback','mock_meetings','live_assist_sessions','chat_threads','notifications') AND column_name='client_id'));
SELECT t.ok('a practice lesson cannot use another company''s meeting', t.refused($$insert into practice_lessons(client_user_id,created_by,meeting_id,origin,method,title) values ('bbbbbbbb-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-0000000000a1','44444444-0000-0000-0000-000000000001','meeting','checklist','x')$$));
SELECT t.ok('a practice lesson cannot be created by another company''s manager', t.refused($$insert into practice_lessons(client_user_id,created_by,meeting_id,origin,method,title) values ('aaaaaaaa-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-0000000000a1','44444444-0000-0000-0000-000000000001','meeting','checklist','x')$$));
SELECT t.ok('a chat thread cannot point at another company''s deal', t.refused($$insert into chat_threads(client_user_id,lead_id,title) values ('bbbbbbbb-0000-0000-0000-0000000000b1','11111111-0000-0000-0000-000000000001','x')$$));
SELECT t.ok('a mock meeting cannot be built from another company''s call', t.refused($$insert into mock_meetings(client_user_id,source_meeting_id,buyer_name,roleplay_type) values ('bbbbbbbb-0000-0000-0000-0000000000b1','44444444-0000-0000-0000-000000000001','x','cold')$$));
SELECT t.ok('manager feedback must come from a manager of the same company', t.refused($$insert into lesson_feedback(client_user_id,manager_id,lesson_id,feedback) values ('aaaaaaaa-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-0000000000a1','88888888-0000-0000-0000-000000000001','x')$$));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep sees their own practice lesson', t.n('select count(*) from practice_lessons') = 1);
SELECT t.as_user('sales_rep','bbbbbbbb-0000-0000-0000-0000000000b1','b0000000-0000-0000-0000-000000000001');
SELECT t.ok('another company''s rep sees none of it', t.n('select count(*) from practice_lessons') = 0 AND t.n('select count(*) from chat_threads') = 0);
SELECT t.as_owner();
SELECT t.ok('raw text is refused on a user chat message', t.refused($$insert into chat_messages(thread_id,role,body,raw_text) values ('77777777-0000-0000-0000-000000000001','user','hi','hi there')$$));
SELECT t.ok('raw reply, tags and a vector are accepted on an assistant message', NOT t.refused($$insert into chat_messages(thread_id,role,body,raw_text,model,tags,embeddings,embedding_model,embedded_at) values ('77777777-0000-0000-0000-000000000001','assistant','Hello','**Hello**','m1','{greeting}',t.vec(5),'test-model',now())$$));

SELECT t.ok('evidence on a line of the same meeting is accepted', NOT t.refused($$insert into meeting_cue_scores(meeting_id,cue_id,score,is_assessable,evidence_segment_id) select '44444444-0000-0000-0000-000000000001', cue_id, 3, true, '66666666-0000-0000-0000-000000000001' from cues where code=1$$));
SELECT t.ok('evidence on another meeting''s line is refused', t.refused($$insert into meeting_cue_scores(meeting_id,cue_id,score,is_assessable,evidence_segment_id) select '44444444-0000-0000-0000-000000000002', cue_id, 3, true, '66666666-0000-0000-0000-000000000002' from cues where code=1$$));
INSERT INTO transcript_segment_cues(segment_id,cue_id) SELECT '66666666-0000-0000-0000-000000000002', cue_id FROM cues WHERE code=1;
SELECT t.ok('a line can be linked to the cues it mentions', (SELECT count(*) FROM transcript_segment_cues) = 1);
SELECT t.ok('an objection category outside the list is refused', t.refused($$insert into meeting_objections(meeting_id,at_ms,objection,status,category) values ('44444444-0000-0000-0000-000000000001',0,'x','Resolved','vibes')$$));
SELECT t.ok('an objection category from the list is accepted', NOT t.refused($$insert into meeting_objections(meeting_id,at_ms,objection,status,category) values ('44444444-0000-0000-0000-000000000001',0,'x','Resolved','price')$$));

INSERT INTO knowledge_sources(client_id,created_by,name,type,content_hash,raw_text,tags) VALUES ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Guide','PDF','h1','extracted text','{product}');
SELECT t.ok('the same content cannot be added twice in a company', t.refused($$insert into knowledge_sources(client_id,created_by,name,type,content_hash) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Guide copy','PDF','h1')$$));
SELECT t.ok('another company can add the same content', NOT t.refused($$insert into knowledge_sources(client_id,created_by,name,type,content_hash) values ('b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','Guide','PDF','h1')$$));
INSERT INTO company_documents(client_id,uploaded_by,name,storage_key,checksum_sha256) VALUES ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Doc','k/doc','c1');
SELECT t.ok('the same document file cannot be uploaded twice', t.refused($$insert into company_documents(client_id,uploaded_by,name,storage_key,checksum_sha256) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Doc 2','k/doc2','c1')$$));

UPDATE company_documents SET embeddings = t.vec(7), embedding_model = 'test-model', embedded_at = now() WHERE name = 'Doc';
SELECT t.ok('a company document can hold a whole-document vector and be found by meaning',
  (SELECT name FROM company_documents WHERE embeddings IS NOT NULL ORDER BY embeddings <=> t.vec(7) LIMIT 1) = 'Doc'
  AND (SELECT count(*) FROM pg_indexes WHERE indexname = 'idx_company_documents_embeddings' AND indexdef LIKE '%hnsw%') = 1);
SELECT t.ok('a document vector of the wrong size is refused', t.refused($$update company_documents set embeddings = '[1,2]'::halfvec where name = 'Doc'$$));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
SELECT t.ok('a rep can search company documents of their own company only', t.n('select count(*) from company_documents where embeddings is not null') = 1);
SELECT t.as_user('client_admin','bbbbbbbb-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001');
SELECT t.ok('another company cannot see them', t.n('select count(*) from company_documents where embeddings is not null') = 0);
SELECT t.as_owner();

-- retention: when the recording expires, raw copies and turn vectors go, the cleaned transcript stays
UPDATE media_files SET retention_until = now() - interval '1 day' WHERE media_file_id='55555555-0000-0000-0000-000000000001';
SELECT count(*) AS expired_files FROM expire_media();
SELECT t.ok('expiry clears the raw speech-to-text and the turn vector', (SELECT raw_text IS NULL AND embeddings IS NULL AND embedding_model IS NULL FROM transcript_segments WHERE transcript_segment_id='66666666-0000-0000-0000-000000000003'));
SELECT t.ok('expiry keeps the cleaned transcript', (SELECT text = 'We need it by June' FROM transcript_segments WHERE transcript_segment_id='66666666-0000-0000-0000-000000000003'));
SELECT t.ok('expiry clears the model''s raw reply', (SELECT raw_output IS NULL FROM analysis_runs WHERE meeting_id='44444444-0000-0000-0000-000000000002'));
SELECT t.ok('expiry hides the media file', (SELECT deleted_at IS NOT NULL FROM media_files WHERE media_file_id='55555555-0000-0000-0000-000000000001'));
SELECT t.ok('expiry leaves other meetings alone', (SELECT raw_text = 'hello' AND embeddings IS NOT NULL FROM transcript_segments WHERE transcript_segment_id='66666666-0000-0000-0000-000000000001'));


-- ================= standard columns: key names, created_at, who did it =================
SELECT t.as_owner();
SELECT t.ok('every table key is named after its table, no bare id', NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND column_name='id'));
SELECT t.ok('every table has created_at', NOT EXISTS (SELECT 1 FROM information_schema.tables x WHERE x.table_schema='public' AND x.table_type='BASE TABLE'
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=x.table_name AND c.column_name='created_at')));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
INSERT INTO leads(client_user_id,name,company_name,stage,source,created_by) VALUES ('aaaaaaaa-0000-0000-0000-0000000000b1','Audit deal','Co','Discovery','draft','aaaaaaaa-0000-0000-0000-000000000001');
SELECT t.ok('created_by is the signed-in user, a forged value is replaced', (SELECT created_by = 'aaaaaaaa-0000-0000-0000-0000000000b1' AND updated_by = 'aaaaaaaa-0000-0000-0000-0000000000b1' AND deleted_by IS NULL FROM leads WHERE name='Audit deal'));
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE leads SET amount = 5, created_by = 'aaaaaaaa-0000-0000-0000-000000000001' WHERE name='Audit deal';
SELECT t.ok('an edit sets updated_by and cannot change created_by', (SELECT updated_by = 'aaaaaaaa-0000-0000-0000-000000000001' AND created_by = 'aaaaaaaa-0000-0000-0000-0000000000b1' FROM leads WHERE name='Audit deal'));
UPDATE leads SET deleted_at = now() WHERE name='Audit deal';
SELECT t.ok('deleting a row records who deleted it', (SELECT deleted_by = 'aaaaaaaa-0000-0000-0000-000000000001' FROM leads WHERE name='Audit deal'));
UPDATE leads SET deleted_at = NULL WHERE name='Audit deal';
SELECT t.ok('restoring a row clears deleted_by', (SELECT deleted_by IS NULL FROM leads WHERE name='Audit deal'));
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
UPDATE cues SET description = 'edited by the platform' WHERE code = 1;
SELECT t.ok('a super admin editing a default cue leaves the client-user columns empty', (SELECT updated_by IS NULL FROM cues WHERE code = 1));
INSERT INTO platform_limits(limit_key,limit_value,description) VALUES ('stamp_test','1','test');
SELECT t.ok('a platform owner''s change is stamped with their own id', (SELECT created_by = '99999999-0000-0000-0000-000000000001' AND updated_by = '99999999-0000-0000-0000-000000000001' FROM platform_limits WHERE limit_key='stamp_test'));
SELECT t.as_owner();
INSERT INTO crm_stage_mappings(client_id,crm_stage,sellmore_stage,created_by) VALUES ('a0000000-0000-0000-0000-000000000001','Worker stage','Discovery','aaaaaaaa-0000-0000-0000-000000000001');
SELECT t.ok('a worker or migration session keeps the values it gives', (SELECT created_by = 'aaaaaaaa-0000-0000-0000-000000000001' FROM crm_stage_mappings WHERE crm_stage='Worker stage'));

-- ================= platform limits as key and value =================
SELECT t.ok('limits are key and value rows', (SELECT limit_value::int FROM platform_limits WHERE limit_key='max_file_size_mb') = 2048
  AND (SELECT limit_value @> '"MP3"' FROM platform_limits WHERE limit_key='allowed_formats'));
SELECT t.ok('a new limit is just a new row', NOT t.refused($$insert into platform_limits(limit_key,limit_value,description) values ('retention_grace_days','7','days kept after expiry')$$));
SELECT t.ok('a limit key must be snake_case', t.refused($$insert into platform_limits(limit_key,limit_value) values ('Bad Key','1')$$));
SELECT t.ok('a limit key cannot repeat', t.refused($$insert into platform_limits(limit_key,limit_value) values ('max_file_size_mb','1')$$));
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
UPDATE platform_limits SET limit_value = '1' WHERE limit_key = 'max_file_size_mb';   -- row level security hides the row, so nothing changes
SELECT t.ok('a client can read the limits but not change or add them', t.n('select count(*) from platform_limits') >= 5
  AND t.n($$select limit_value::int from platform_limits where limit_key = 'max_file_size_mb'$$) = 2048
  AND t.refused($$insert into platform_limits(limit_key,limit_value) values ('client_limit','1')$$));
SELECT t.as_owner();

-- ================= free trial =================
SELECT t.ok('plans can offer a free trial', (SELECT trial_days FROM plans WHERE plan_id='starter') = 14 AND (SELECT trial_days FROM plans WHERE plan_id='free') IS NULL);
SELECT t.ok('a trial length of zero is refused', t.refused($$update plans set trial_days = 0 where plan_id = 'starter'$$));
UPDATE clients SET trial_ends_at = now() + interval '14 days' WHERE client_id = 'a0000000-0000-0000-0000-000000000001';
SELECT t.ok('a company records when its trial ends', (SELECT trial_ends_at > now() FROM clients WHERE client_id = 'a0000000-0000-0000-0000-000000000001'));


-- ================= soft delete on more tables =================
SELECT t.ok('a deleted_by column only exists next to a deleted_at column', NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.column_name='deleted_by'
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns d WHERE d.table_schema='public' AND d.table_name=c.table_name AND d.column_name='deleted_at')));
SELECT t.as_user('client_admin','aaaaaaaa-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
INSERT INTO automations(client_id,created_by,name,trigger_event,action,category) VALUES ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Rule 1','call_analysed','send summary','Email');
SELECT t.ok('an automation name is unique while it is active', t.refused($$insert into automations(client_id,created_by,name,trigger_event,action,category) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Rule 1','x','y','Email')$$));
UPDATE automations SET deleted_at = now() WHERE name = 'Rule 1';
SELECT t.ok('deleting an automation records who did it', (SELECT deleted_by = 'aaaaaaaa-0000-0000-0000-000000000001' FROM automations WHERE name = 'Rule 1'));
SELECT t.ok('a deleted automation''s name can be used again', NOT t.refused($$insert into automations(client_id,created_by,name,trigger_event,action,category) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Rule 1','x','y','Email')$$));
SELECT t.as_user('sales_rep','aaaaaaaa-0000-0000-0000-0000000000b1','a0000000-0000-0000-0000-000000000001');
UPDATE chat_threads SET deleted_at = now() WHERE chat_thread_id = '77777777-0000-0000-0000-000000000001';
SELECT t.ok('a user deleting their chat thread is recorded', (SELECT deleted_by = 'aaaaaaaa-0000-0000-0000-0000000000b1' FROM chat_threads WHERE chat_thread_id = '77777777-0000-0000-0000-000000000001'));
SELECT t.as_user('super_admin','99999999-0000-0000-0000-000000000001',NULL);
UPDATE cues SET deleted_at = now() WHERE code = 1;
SELECT t.ok('a super admin deleting a default cue leaves deleted_by empty', (SELECT deleted_at IS NOT NULL AND deleted_by IS NULL FROM cues WHERE code = 1));
SELECT t.as_owner();
SELECT t.ok('a deleted default cue frees its code', NOT t.refused($$insert into cues(client_id,code,name,category,instructions) values (NULL,1,'Opening v2','Intro','x')$$));

-- ================= summary =================
SELECT count(*) FILTER (WHERE ok) AS passed, count(*) FILTER (WHERE NOT ok) AS failed FROM t.results;
SELECT name AS failed_check FROM t.results WHERE NOT ok;
ROLLBACK;
