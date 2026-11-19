-- ===== Table 1: platform_owner_users (SellMore staff) =====
INSERT INTO platform_owner_users(platform_owner_user_id, name, email, status, last_login_at) VALUES
 (s.id(1,1), 'Alexander Chen', 'operator@sellmore.io',      'active',   '2026-11-20 07:58+00'),
 (s.id(1,2), 'Maya Thompson',  'maya.thompson@sellmore.io', 'active',   NULL),                       -- never signed in yet
 (s.id(1,3), 'Ravi Desai',     'ravi.desai@sellmore.io',    'inactive', '2026-06-30 16:20+00');      -- left the company

-- ===== Tables 2, 3, 4: plans, plan_features and the 4 limits are loaded by schema.sql (sql/95_seed.sql). Here we stamp who made them
-- and add two more limits to show that a limit is just a new row. Seed ids are random, so give them readable ones.
SET session_replication_role = replica;      -- fix up seed rows without the audit triggers undoing it
UPDATE plans SET created_by = s.id(1,1) WHERE plan_id <> 'free';                  -- the free plan came with the first release, no one created it
UPDATE plans SET updated_by = s.id(1,2) WHERE plan_id = 'growth';
UPDATE platform_limits SET platform_limit_id = s.id(4, CASE limit_key WHEN 'allowed_formats' THEN 1 WHEN 'max_file_size_mb' THEN 2
                                                          WHEN 'max_duration_min' THEN 3 WHEN 'invite_expiry_hours' THEN 4 END),
                           created_by = CASE WHEN limit_key = 'invite_expiry_hours' THEN NULL ELSE s.id(1,1) END;
UPDATE platform_limits SET updated_by = s.id(1,1) WHERE limit_key = 'max_file_size_mb';
SET session_replication_role = origin;

INSERT INTO platform_limits(platform_limit_id, limit_key, limit_value, description, created_by, updated_by) VALUES
 (s.id(4,5), 'default_timezone',  '"UTC"', 'Timezone given to a new client until its admin changes it',            s.id(1,1), NULL),
 (s.id(4,6), 'maintenance_mode',  'false', 'Set to true to show the maintenance banner and pause imports',         s.id(1,1), s.id(1,2)),
 (s.id(4,7), 'feature_flags',     '{"beta_ui": true, "new_report": false}', NULL,                                          s.id(1,2), NULL);    -- a JSON object value, and no description
