-- ===== Table 6: clients (customer companies). Five companies so that every plan and status shows up. =====
INSERT INTO clients(client_id, name, slug, plan_id, status, renewal_date, trial_ends_at, credit_balance, timezone, recording_retention_days, billing_customer_id, notes, deleted_at) VALUES
 (s.id(6,1), 'Apex Precision Engineering Ltd', 'apex-precision',   'growth',     'active',    '2026-12-01', NULL,                  0, 'Europe/London',    365, 'cus_Qx7Apex001',  'Aerospace and medical CNC machining. First pilot customer.', NULL),
 (s.id(6,2), 'Beta Sheet Metal Works',         'beta-sheet-metal', 'free',       'active',    NULL,         NULL,                  0, 'America/Chicago',   90, NULL,              NULL, NULL),
 (s.id(6,3), 'Cedar Composites Ltd',           'cedar-composites', 'starter',    'active',    '2026-12-04', '2026-12-04 09:00+00', 0, 'Asia/Kolkata',     180, 'cus_Qx7Cedar003', 'On a 14-day free trial of the Starter plan.', NULL),
 (s.id(6,4), 'Delta Foundry Group',            'delta-foundry',    'enterprise', 'suspended', '2027-01-31', NULL,                  0, 'Europe/Berlin',    730, 'cus_Qx7Delta004', 'Suspended 2026-11-15: the November invoice failed.', NULL),
 (s.id(6,5), 'Echo Fabrication Inc',           'echo-fabrication', 'starter',    'suspended', NULL,         NULL,                  0, 'America/Denver',   180, 'cus_Qx7Echo005',  'Offboarded at the customer''s request. Data purge scheduled.', '2026-10-30 12:00+00');

-- ===== Table 5: platform_audit_log (what SellMore staff did) =====
INSERT INTO platform_audit_log(platform_audit_log_id, actor_id, client_id, action, detail, created_at) VALUES
 (s.id(5,1), s.id(1,1), s.id(6,1), 'client.created',       'Created Apex Precision Engineering Ltd on the Growth plan',        '2026-09-01 09:30+00'),
 (s.id(5,2), s.id(1,1), s.id(6,1), 'credits.granted',      'Granted 50 goodwill credits (support ticket 4521)',                '2026-11-14 11:05+00'),
 (s.id(5,3), s.id(1,2), s.id(6,3), 'client.trial_started', 'Started a 14-day Starter trial for Cedar Composites Ltd',          '2026-11-20 09:00+00'),
 (s.id(5,4), s.id(1,1), s.id(6,4), 'client.suspended',     'Suspended Delta Foundry Group: invoice failed twice',              '2026-11-15 08:10+00'),
 (s.id(5,5), s.id(1,1), s.id(6,5), 'client.offboarded',    'Offboarded Echo Fabrication Inc at the customer''s request',       '2026-10-30 12:00+00'),
 (s.id(5,6), s.id(1,1), NULL,      'limit.updated',        'max_file_size_mb changed from 1024 to 2048 (applies to every client)', '2026-10-01 14:20+00'),
 (s.id(5,7), s.id(1,2), s.id(6,1), 'client.data_exported', NULL,                                                                 '2026-11-12 10:00+00');

-- ===== Table 7: client_users. Every role, active and inactive, with and without a manager, one soft-deleted. =====
-- The first admin of each company is created by the platform, so created_by stays empty.
SELECT s.act_as_owner();
INSERT INTO client_users(client_user_id, client_id, name, email, role, title, avatar_url, status, crm_user_id, phone_extension, last_login_at) VALUES
 (s.id(7,1),  s.id(6,1), 'Sarah Lin',   'sarah.lin@apexengineering.example',    'client_admin', 'VP of Commercial Operations', 'https://cdn.sellmore.example/avatars/sarah-lin.png', 'active',   '005Hs000001AD01', NULL, '2026-11-20 08:41+00'),
 (s.id(7,10), s.id(6,2), 'Dana Ortiz',  'dana.ortiz@betasheetmetal.example',    'client_admin', 'Owner',                       NULL,                                                  'active',   NULL,              NULL, '2026-11-19 14:12+00'),
 (s.id(7,15), s.id(6,3), 'Kavya Iyer',  'kavya.iyer@cedarcomposites.example',   'client_admin', 'Head of Sales',               NULL,                                                  'active',   '005Ce000001AD01', NULL, '2026-11-20 05:30+00'),
 (s.id(7,17), s.id(6,4), 'Hannah Voss', 'hannah.voss@deltafoundry.example',     'client_admin', 'Commercial Director',         NULL,                                                  'active',   '005De000001AD01', NULL, '2026-11-14 09:00+00'),
 (s.id(7,20), s.id(6,5), 'Gus Palmer',  'gus.palmer@echofab.example',           'client_admin', 'President',                   NULL,                                                  'inactive', NULL,              NULL, '2026-10-29 17:45+00');

-- Apex: the admin adds two managers and five reps. Acting as the admin makes created_by and manager_assignments.assigned_by the admin.
SELECT s.act_as('client_admin', s.id(7,1), s.id(6,1));
INSERT INTO client_users(client_user_id, client_id, name, email, role, title, status, crm_user_id, phone_extension, last_login_at) VALUES
 (s.id(7,2), s.id(6,1), 'David Miller', 'david.miller@apexengineering.example', 'manager', 'Regional Sales Director',    'active', '005Hs000001MG01', '8100', '2026-11-19 17:05+00'),
 (s.id(7,3), s.id(6,1), 'Priya Nair',   'priya.nair@apexengineering.example',   'manager', 'Enterprise Accounts Manager', 'active', '005Hs000001MG02', '8200', '2026-11-18 09:30+00');
INSERT INTO client_users(client_user_id, client_id, manager_id, name, email, role, title, status, crm_user_id, phone_extension, last_login_at) VALUES
 (s.id(7,4), s.id(6,1), s.id(7,2), 'Marcus Vance',  'marcus.vance@apexengineering.example',  'sales_rep', 'Senior Technical Account Executive', 'active',   '005Hs000001MV01', '8007', '2026-11-20 08:12+00'),
 (s.id(7,6), s.id(6,1), s.id(7,2), 'Julian Hayes',  'julian.hayes@apexengineering.example',  'sales_rep', 'Technical Account Executive',        'inactive', '005Hs000001JH01', '8012', '2026-10-02 10:00+00'),   -- left the company
 (s.id(7,7), s.id(6,1), s.id(7,2), 'Tom Becker',    'tom.becker@apexengineering.example',    'sales_rep', 'Account Executive',                  'active',   '005Hs000001TB01', '8013', '2026-11-20 07:50+00'),
 (s.id(7,8), s.id(6,1), NULL,      'Lucy Grant',    'lucy.grant@apexengineering.example',    'sales_rep', NULL,                                 'active',   NULL,              '8014', NULL),                       -- no manager yet, not matched in Salesforce
 (s.id(7,9), s.id(6,1), s.id(7,3), 'Nina Park',     'nina.park@apexengineering.example',     'sales_rep', 'Account Executive',                  'active',   '005Hs000001NP01', NULL,   '2026-09-30 15:00+00');
-- A manager adds a rep: created_by and assigned_by are the manager.
SELECT s.act_as('manager', s.id(7,2), s.id(6,1));
INSERT INTO client_users(client_user_id, client_id, manager_id, name, email, role, title, status, crm_user_id, phone_extension, last_login_at) VALUES
 (s.id(7,5), s.id(6,1), s.id(7,2), 'Elena Rostova', 'elena.rostova@apexengineering.example', 'sales_rep', 'Technical Account Executive', 'active', '005Hs000001ER01', '8011', '2026-11-20 08:20+00');

-- Beta (free plan, 5 seats: all five are used), Cedar and Delta
SELECT s.act_as('client_admin', s.id(7,10), s.id(6,2));
INSERT INTO client_users(client_user_id, client_id, name, email, role, title, status, last_login_at) VALUES
 (s.id(7,11), s.id(6,2), 'Ravi Menon', 'ravi.menon@betasheetmetal.example', 'manager', 'Sales Manager', 'active', '2026-11-18 10:00+00');
INSERT INTO client_users(client_user_id, client_id, manager_id, name, email, role, title, status, last_login_at) VALUES
 (s.id(7,12), s.id(6,2), s.id(7,11), 'Chris Lee',   'chris.lee@betasheetmetal.example',   'sales_rep', 'Sales Representative', 'active', '2026-11-12 12:30+00'),
 (s.id(7,13), s.id(6,2), s.id(7,11), 'Mia Torres',  'mia.torres@betasheetmetal.example',  'sales_rep', 'Sales Representative', 'active', '2026-11-17 08:15+00'),
 (s.id(7,14), s.id(6,2), NULL,       'Sam Wu',      'sam.wu@betasheetmetal.example',      'sales_rep', NULL,                   'active', NULL);
SELECT s.act_as('client_admin', s.id(7,15), s.id(6,3));
INSERT INTO client_users(client_user_id, client_id, name, email, role, title, status, crm_user_id, last_login_at) VALUES
 (s.id(7,16), s.id(6,3), 'Jonas Berg', 'jonas.berg@cedarcomposites.example', 'sales_rep', 'Sales Executive', 'active', '005Ce000001JB01', '2026-11-19 11:40+00');
SELECT s.act_as('client_admin', s.id(7,17), s.id(6,4));
INSERT INTO client_users(client_user_id, client_id, name, email, role, title, status, crm_user_id, last_login_at) VALUES
 (s.id(7,18), s.id(6,4), 'Leo Fischer', 'leo.fischer@deltafoundry.example', 'manager', 'Head of Key Accounts', 'active', '005De000001LF01', '2026-11-13 08:00+00');
INSERT INTO client_users(client_user_id, client_id, manager_id, name, email, role, title, status, crm_user_id, phone_extension, last_login_at) VALUES
 (s.id(7,19), s.id(6,4), s.id(7,18), 'Mara Klein', 'mara.klein@deltafoundry.example', 'sales_rep', 'Key Account Manager', 'active', '005De000001MK01', '8300', '2026-11-13 09:20+00');

-- Changes over time, made by the admin. The triggers keep the manager history and the audit log, and stamp updated_by / deleted_by.
SELECT s.act_as('client_admin', s.id(7,1), s.id(6,1));
UPDATE client_users SET manager_id = s.id(7,3) WHERE client_user_id = s.id(7,7);                         -- Tom moves from David to Priya
UPDATE client_users SET manager_id = NULL, status = 'inactive', deleted_at = '2026-11-05 10:00+00'
 WHERE client_user_id = s.id(7,9);                                                                        -- Nina leaves: unassigned, deactivated, soft-deleted
SELECT s.act_as_owner();
UPDATE clients SET updated_by = s.id(7,1)  WHERE client_id = s.id(6,1);
UPDATE clients SET updated_by = s.id(7,10) WHERE client_id = s.id(6,2);

-- ===== Table 8: auth_identities (how people sign in). Each provider once; two are platform owners. =====
INSERT INTO auth_identities(auth_identity_id, user_id, platform_owner_user_id, provider, subject, password_hash, mfa_enabled, last_used_at) VALUES
 (s.id(8,1), s.id(7,1),  NULL, 'password',  'sarah.lin@apexengineering.example',   '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$Zm9vYmFyYmF6cXV4cXV1eA', true,  '2026-11-20 08:41+00'),
 (s.id(8,2), s.id(7,2),  NULL, 'google',    '110248355190322874511',               NULL,                                                                  false, '2026-11-19 17:05+00'),
 (s.id(8,3), s.id(7,3),  NULL, 'microsoft', '3f0a7c52-8b1e-4d6a-9d27-5c1e8a4b7e90', NULL,                                                                 false, '2026-11-18 09:30+00'),
 (s.id(8,4), s.id(7,4),  NULL, 'saml',      'marcus.vance@apexengineering.example', NULL,                                                                 false, '2026-11-20 08:12+00'),
 (s.id(8,5), s.id(7,5),  NULL, 'oidc',      'auth0|65f1c2a9d4b7e8a1c3d5f601',      NULL,                                                                  false, '2026-11-20 08:20+00'),
 (s.id(8,6), s.id(7,7),  NULL, 'password',  'tom.becker@apexengineering.example',  '$argon2id$v=19$m=65536,t=3,p=4$dG9tc2FsdHNhbHQ$cXV4Zm9vYmFyYmF6enp6enp6', false, NULL),         -- has never signed in
 (s.id(8,7), s.id(7,10), NULL, 'password',  'dana.ortiz@betasheetmetal.example',   '$argon2id$v=19$m=65536,t=3,p=4$ZGFuYXNhbHRzYWx0$YmF6cXV4Zm9vYmFyenp6enp6', false, '2026-11-19 14:12+00'),
 (s.id(8,8), NULL, s.id(1,1), 'password',   'operator@sellmore.io',                '$argon2id$v=19$m=65536,t=3,p=4$b3Bhc2FsdHNhbHRz$enp6enp6Zm9vYmFyYmF6cXV4', true,  '2026-11-20 07:58+00'),
 (s.id(8,9), NULL, s.id(1,2), 'google',     '104877391205566301982',               NULL,                                                                  false, NULL);

-- ===== Table 9: invitations. Every status and both invitable roles. =====
INSERT INTO invitations(invitation_id, client_id, email, role, manager_id, invited_by, token_hash, status, expires_at, accepted_at, accepted_user_id, updated_by) VALUES
 (s.id(9,1), s.id(6,1), 'chloe.bennett@apexengineering.example',  'sales_rep', s.id(7,2), s.id(7,1), s.sha('invite-1'), 'pending',  '2026-11-22 08:00+00', NULL,                  NULL,       NULL),
 (s.id(9,2), s.id(6,1), 'elena.rostova@apexengineering.example',  'sales_rep', s.id(7,2), s.id(7,2), s.sha('invite-2'), 'accepted', '2026-03-12 10:00+00', '2026-03-10 09:42+00', s.id(7,5), NULL),
 (s.id(9,3), s.id(6,1), 'priya.nair@apexengineering.example',     'manager',   NULL,      s.id(7,1), s.sha('invite-3'), 'accepted', '2026-02-22 10:00+00', '2026-02-20 11:15+00', s.id(7,3), NULL),
 (s.id(9,4), s.id(6,1), 'intern.sales@apexengineering.example',   'sales_rep', s.id(7,3), s.id(7,1), s.sha('invite-4'), 'expired',  '2026-10-01 10:00+00', NULL,                  NULL,       NULL),
 (s.id(9,5), s.id(6,1), 'wrong.address@apexengineering.example',  'manager',   NULL,      s.id(7,1), s.sha('invite-5'), 'revoked',  '2026-11-12 10:00+00', NULL,                  NULL,       s.id(7,1)),
 (s.id(9,6), s.id(6,2), 'ops.lead@betasheetmetal.example',        'manager',   NULL,      s.id(7,10), s.sha('invite-6'), 'pending', '2026-11-22 12:00+00', NULL,                  NULL,       NULL),
 (s.id(9,7), s.id(6,3), 'sales.new@cedarcomposites.example',      'sales_rep', NULL,      s.id(7,15), s.sha('invite-7'), 'pending', '2026-11-22 09:30+00', NULL,                  NULL,       NULL);
