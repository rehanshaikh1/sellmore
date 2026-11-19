-- ===== Table 13: credit_transactions: written by the credit functions, so every balance_after is right. =====
-- Order matters: each row records the balance after it. Times are set at the end, in the fix-up block.
SELECT s.act_as_owner();
-- Apex (Growth plan): monthly refills, a top-up, spends on analysis, Live Assist, role-play and practice, a refund and a goodwill adjustment
SELECT grant_credits(s.id(6,1), 500,  'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-08:apex');
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Meeting Analysis (Gearwerk call)',            15, 'analysis:' || s.id(26,12), 'meeting', s.id(26,12));
SELECT grant_credits(s.id(6,1), 500,  'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-09:apex');
SELECT grant_credits(s.id(6,1), 1000, 'Credit Top-Up (INV-2026-001)',                      'grant',  'topup:INV-2026-001');
SELECT grant_credits(s.id(6,1), 500,  'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-10:apex');
SELECT grant_credits(s.id(6,1), 500,  'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-11:apex');
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Meeting Analysis (German supplier cold call)', 15, 'analysis:' || s.id(26,4), 'meeting', s.id(26,4));
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Meeting Analysis (BioMedix call)',            15, 'analysis:' || s.id(26,2), 'meeting', s.id(26,2));
SELECT consume_credits(s.id(6,1), s.id(7,5), 'Meeting Analysis (VoltDrive call)',           15, 'analysis:' || s.id(26,3), 'meeting', s.id(26,3));
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Live Assist Real-Time Session (42 mins)',     20, 'live-assist:' || s.id(49,1), 'live_assist_session', s.id(49,1));
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Meeting Analysis (AeroDynamics call)',        15, 'analysis:' || s.id(26,1), 'meeting', s.id(26,1));
SELECT consume_credits(s.id(6,1), s.id(7,4), 'AI Mock Meeting Roleplay (14 mins)',          25, 'mock:' || s.id(46,1), 'mock_meeting', s.id(46,1));
SELECT consume_credits(s.id(6,1), s.id(7,5), 'Practice Timed Prompts Session',               5);                                 -- no key, no reference
SELECT grant_credits(s.id(6,1), 50,   'Goodwill credits (support ticket 4521)',            'adjust');                            -- no key
SELECT consume_credits(s.id(6,1), s.id(7,4), 'Meeting Analysis (Corrupted Recording)',      15, 'analysis:' || s.id(26,6), 'meeting', s.id(26,6));
SELECT grant_credits(s.id(6,1), 15,   'Refund: analysis failed (Corrupted Recording)',     'refund', 'refund:' || s.id(26,6));
-- Beta (free evaluation), Cedar (trial), Delta (Enterprise)
SELECT grant_credits(s.id(6,2), 30,   'Free evaluation credits',                           'grant',  'welcome:beta');
SELECT consume_credits(s.id(6,2), s.id(7,12), 'Meeting Analysis (Kestrel Marine call)',     15, 'analysis:' || s.id(26,14), 'meeting', s.id(26,14));
SELECT grant_credits(s.id(6,3), 100,  'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-11:cedar');
SELECT consume_credits(s.id(6,3), s.id(7,16), 'Practice Timed Prompts Session',              5);
SELECT grant_credits(s.id(6,4), 2500, 'Monthly Plan Subscription Credit Grant',            'grant',  'refill:2026-11:delta');
SELECT consume_credits(s.id(6,4), s.id(7,19), 'Meeting Analysis (Rhine Automotive call)',   15, 'analysis:' || s.id(26,15), 'meeting', s.id(26,15));

-- ===== Table 14: invoices: paid, processing and failed; three currencies of the amounts; one legacy invoice with no provider id =====
INSERT INTO invoices(invoice_id, client_id, amount, currency, purpose, status, provider_invoice_id, issued_at, paid_at, pdf_url) VALUES
 (s.id(14,1), s.id(6,1), 99.00,  'USD', 'Credit Top-Up (1,000 AI Credits)',                         'paid',       'in_1QxApex001',  '2026-09-01 00:00+00', '2026-09-01 00:02+00', 'https://billing.sellmore.example/invoices/INV-2026-001.pdf'),
 (s.id(14,2), s.id(6,1), 249.00, 'USD', 'Growth Plan, monthly (25 seats + 500 AI credits)',         'paid',       'in_1QxApex002',  '2026-10-01 00:00+00', '2026-10-01 00:03+00', 'https://billing.sellmore.example/invoices/INV-2026-002.pdf'),
 (s.id(14,3), s.id(6,1), 249.00, 'USD', 'Growth Plan, monthly (25 seats + 500 AI credits)',         'paid',       'in_1QxApex003',  '2026-11-01 00:00+00', '2026-11-01 00:03+00', 'https://billing.sellmore.example/invoices/INV-2026-003.pdf'),
 (s.id(14,4), s.id(6,3), 99.00,  'USD', 'Starter Plan, first month (after the free trial)',         'processing', 'in_1QxCedar001', '2026-11-20 10:00+00', NULL,                  NULL),
 (s.id(14,5), s.id(6,4), 799.00, 'EUR', 'Enterprise Plan, monthly',                                 'failed',     'in_1QxDelta011', '2026-11-01 00:00+00', NULL,                  'https://billing.sellmore.example/invoices/INV-2026-D11.pdf'),
 (s.id(14,6), s.id(6,4), 799.00, 'EUR', 'Enterprise Plan, monthly',                                 'paid',       'in_1QxDelta010', '2026-10-01 00:00+00', '2026-10-01 00:04+00', 'https://billing.sellmore.example/invoices/INV-2026-D10.pdf'),
 (s.id(14,7), s.id(6,5), 99.00,  'USD', 'Starter Plan, monthly',                                    'paid',       NULL,             '2026-09-30 00:00+00', '2026-09-30 00:05+00', 'https://billing.sellmore.example/invoices/INV-2026-E01.pdf');

-- ===== Table 11: notifications: read and unread, many types =====
INSERT INTO notifications(notification_id, client_user_id, type, body, link, read_at) VALUES
 (s.id(11,1),  s.id(7,4),  'meeting_analysed',       'Your call "AeroDynamics UK: Titanium Bracket Technical Feasibility & Drawing Review" has been analysed (score 78).', '/meetings/' || s.id(26,1), '2026-11-08 19:30+00'),
 (s.id(11,2),  s.id(7,4),  'meeting_failed',         'The recording "Corrupted recording" could not be processed. Your credits were refunded.',                          '/meetings/' || s.id(26,6), NULL),
 (s.id(11,3),  s.id(7,5),  'meeting_analysed',       'Your call "VoltDrive EV: Inverter Heat Sink Billet Extrusion & CNC Milling" has been analysed (score 66).',        '/meetings/' || s.id(26,3), '2026-11-07 19:20+00'),
 (s.id(11,4),  s.id(7,2),  'feedback_requested',     'Marcus Vance asked for feedback on "Defend the tooling surcharge".',                                               '/practice/' || s.id(39,1), NULL),
 (s.id(11,5),  s.id(7,1),  'integration_sync_failed','Google Drive sync failed: the API quota was exceeded. It will retry tonight.',                                      '/settings/integrations',   '2026-11-19 09:00+00'),
 (s.id(11,6),  s.id(7,15), 'integration_error',      'Salesforce sync failed: the connection needs to be authorised again.',                                             '/settings/integrations',   NULL),
 (s.id(11,7),  s.id(7,15), 'trial_started',          'Your 14-day Starter trial has started. It ends on 4 December.',                                                    '/billing',                 '2026-11-20 05:35+00'),
 (s.id(11,8),  s.id(7,7),  'meeting_unmatched',      'A recording from 17 November could not be matched to a Salesforce call.',                                          '/meetings/' || s.id(26,9), NULL),
 (s.id(11,9),  s.id(7,17), 'invoice_failed',         'The November invoice failed. The account stays suspended until it is paid.',                                       '/billing',                 '2026-11-15 08:30+00'),
 (s.id(11,11), s.id(7,8),  'welcome',               'Welcome to SellMore. Your admin has set up your account.',                                                         NULL,                       '2026-11-01 09:00+00'),
 (s.id(11,10), s.id(7,4),  'coaching_ready',         'Your coaching programme for AeroDynamics is ready.',                                                               '/practice/programs/' || s.id(41,1), '2026-11-10 08:00+00');

-- ===== Table 12: audit_log. The two "rep.reassigned" rows were written by the manager-change trigger; these are the rest. =====
INSERT INTO audit_log(audit_log_id, client_id, actor_id, action, entity_type, entity_id, detail, ip, created_at) VALUES
 (s.id(12,101), s.id(6,1), s.id(7,1),  'integration.connected',   'integration',      s.id(15,1), '{"provider":"salesforce","org":"00DHs000000ApexAAA"}',                       '203.0.113.24', '2026-09-02 10:15+00'),
 (s.id(12,102), s.id(6,1), s.id(7,1),  'integration.connected',   'integration',      s.id(15,2), '{"provider":"google_drive","folder":"Call recordings"}',                       '203.0.113.24', '2026-09-02 10:40+00'),
 (s.id(12,103), s.id(6,1), s.id(7,1),  'user.role_changed',       'user',             s.id(7,3),  '{"from":"sales_rep","to":"manager"}',                                           '203.0.113.24', '2026-02-20 11:30+00'),
 (s.id(12,104), s.id(6,1), s.id(7,1),  'user.deactivated',        'user',             s.id(7,6),  '{"reason":"left the company"}',                                                 '203.0.113.24', '2026-10-02 10:30+00'),
 (s.id(12,105), s.id(6,1), s.id(7,1),  'user.invited',            'invitation',       s.id(9,1),  '{"email":"chloe.bennett@apexengineering.example","role":"sales_rep"}',          '2001:db8::a1', '2026-11-20 08:00+00'),
 (s.id(12,106), s.id(6,1), s.id(7,2),  'document.uploaded',       'company_document', s.id(35,4), '{"name":"New_Quality_Procedure_Draft.docx"}',                                   NULL,           '2026-11-19 16:10+00'),
 (s.id(12,107), s.id(6,1), NULL,       'sync.completed',          'integration',      s.id(15,1), '{"found":42,"imported":3}',                                                     NULL,           '2026-11-20 08:01+00'),
 (s.id(12,108), s.id(6,2), s.id(7,10), 'client.settings_updated', 'client',           s.id(6,2),  '{"recording_retention_days":{"from":180,"to":90}}',                             '198.51.100.77','2026-10-12 09:20+00'),
 (s.id(12,109), s.id(6,4), NULL,       'billing.payment_failed',  'invoice',          s.id(14,5), '{"attempts":2}',                                                                NULL,           '2026-11-15 08:05+00'),
 (s.id(12,110), s.id(6,3), NULL,       'trial.started',           'client',           s.id(6,3),  '{"plan":"starter","trial_days":14}',                                            NULL,           '2026-11-20 09:00+00'),
 (s.id(12,111), s.id(6,1), s.id(7,1),  'user.signed_in',          NULL,               NULL,       NULL,                                                                                        '203.0.113.24', '2026-11-20 08:41+00');

-- ===== Retention: expire_media() hides the expired recording and clears the raw copies of that call =====
SELECT media_file_id FROM expire_media();

-- ===== Fix-ups: give trigger-written rows readable ids and realistic times. =====
-- (Row level triggers are switched off for these updates only, because the ledgers refuse edits.)
SET session_replication_role = replica;

-- Lucy Grant has had no manager since she joined: an open row with an empty manager (the trigger only writes rows for real managers)
INSERT INTO manager_assignments(manager_assignment_id, client_user_id, manager_id, assigned_by, started_at, ended_at)
VALUES (s.id(10,201), s.id(7,8), NULL, s.id(7,1), '2026-08-15 09:00+00', NULL);
UPDATE manager_assignments SET assigned_by = NULL WHERE client_user_id = s.id(7,6);        -- Julian was assigned by an import, not a person
UPDATE manager_assignments m SET started_at = v.s_at, ended_at = v.e_at
  FROM (VALUES (s.id(7,4),  s.id(7,2),  '2026-02-01 09:00+00'::timestamptz, NULL::timestamptz),
               (s.id(7,5),  s.id(7,2),  '2026-03-10 09:42+00', NULL),
               (s.id(7,6),  s.id(7,2),  '2026-04-05 10:00+00', NULL),
               (s.id(7,7),  s.id(7,2),  '2026-05-12 09:00+00', '2026-10-15 09:20+00'),
               (s.id(7,7),  s.id(7,3),  '2026-10-15 09:20+00', NULL),
               (s.id(7,9),  s.id(7,3),  '2026-05-20 09:00+00', '2026-11-05 10:00+00'),
               (s.id(7,12), s.id(7,11), '2026-08-10 10:00+00', NULL),
               (s.id(7,13), s.id(7,11), '2026-08-11 10:00+00', NULL),
               (s.id(7,19), s.id(7,18), '2026-06-01 09:00+00', NULL)) v(rep, mgr, s_at, e_at)
 WHERE m.client_user_id = v.rep AND m.manager_id = v.mgr;
WITH n AS (SELECT manager_assignment_id AS old, row_number() OVER (ORDER BY started_at, client_user_id) AS rn FROM manager_assignments)
UPDATE manager_assignments m SET manager_assignment_id = s.id(10, n.rn::int) FROM n WHERE m.manager_assignment_id = n.old;

UPDATE audit_log SET created_at = CASE WHEN entity_id = s.id(7,7) THEN '2026-10-15 09:20+00'::timestamptz ELSE '2026-11-05 10:00+00'::timestamptz END
 WHERE action = 'rep.reassigned';
WITH n AS (SELECT audit_log_id AS old, row_number() OVER (ORDER BY created_at, action, entity_id) AS rn FROM audit_log)
UPDATE audit_log a SET audit_log_id = s.id(12, n.rn::int) FROM n WHERE a.audit_log_id = n.old;

UPDATE credit_transactions c SET created_at = v.ts
  FROM (VALUES (s.id(6,1), 'refill:2026-08:apex',  '2026-08-01 00:05+00'::timestamptz),
               (s.id(6,1), 'analysis:' || s.id(26,12), '2026-08-27 19:00+00'),
               (s.id(6,1), 'refill:2026-09:apex',  '2026-09-01 00:05+00'),
               (s.id(6,1), 'topup:INV-2026-001',   '2026-09-01 00:10+00'),
               (s.id(6,1), 'refill:2026-10:apex',  '2026-10-01 00:05+00'),
               (s.id(6,1), 'refill:2026-11:apex',  '2026-11-01 00:05+00'),
               (s.id(6,1), 'analysis:' || s.id(26,4),  '2026-11-03 19:00+00'),
               (s.id(6,1), 'analysis:' || s.id(26,2),  '2026-11-06 18:59+00'),
               (s.id(6,1), 'analysis:' || s.id(26,3),  '2026-11-07 18:59+00'),
               (s.id(6,1), 'analysis:' || s.id(26,1),  '2026-11-08 19:01+00'),
               (s.id(6,1), 'live-assist:' || s.id(49,1), '2026-11-08 15:10+00'),
               (s.id(6,1), 'mock:' || s.id(46,1),      '2026-11-09 15:45+00'),
               (s.id(6,1), 'analysis:' || s.id(26,6),  '2026-11-14 16:31+00'),
               (s.id(6,1), 'refund:' || s.id(26,6),    '2026-11-14 16:35+00'),
               (s.id(6,2), 'welcome:beta',             '2026-10-12 09:05+00'),
               (s.id(6,2), 'analysis:' || s.id(26,14), '2026-11-12 13:39+00'),
               (s.id(6,3), 'refill:2026-11:cedar',     '2026-11-20 08:30+00'),
               (s.id(6,4), 'refill:2026-11:delta',     '2026-11-01 00:05+00'),
               (s.id(6,4), 'analysis:' || s.id(26,15), '2026-11-05 19:00+00')) v(client, idem, ts)
 WHERE c.client_id = v.client AND c.idempotency_key = v.idem;
-- the three rows with no key
UPDATE credit_transactions SET created_at = '2026-11-09 16:10+00' WHERE activity = 'Practice Timed Prompts Session' AND client_id = s.id(6,1);
UPDATE credit_transactions SET created_at = '2026-11-14 11:05+00' WHERE activity = 'Goodwill credits (support ticket 4521)';
UPDATE credit_transactions SET created_at = '2026-11-20 09:10+00' WHERE activity = 'Practice Timed Prompts Session' AND client_id = s.id(6,3);
WITH n AS (SELECT credit_transaction_id AS old, row_number() OVER (ORDER BY created_at, client_id, balance_after) AS rn FROM credit_transactions)
UPDATE credit_transactions c SET credit_transaction_id = s.id(13, n.rn::int) FROM n WHERE c.credit_transaction_id = n.old;

WITH n AS (SELECT crm_stage_mapping_id AS old, row_number() OVER (ORDER BY client_id, created_by NULLS FIRST, crm_stage) AS rn FROM crm_stage_mappings)
UPDATE crm_stage_mappings c SET crm_stage_mapping_id = s.id(19, n.rn::int) FROM n WHERE c.crm_stage_mapping_id = n.old;

SET session_replication_role = origin;
SELECT s.act_as_owner();
DROP SCHEMA s CASCADE;
