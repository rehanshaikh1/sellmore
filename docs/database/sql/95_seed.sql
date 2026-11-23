-- ================================================================
-- Reference data. Mirrors DEFAULT_PLATFORM_PLANS and DEFAULT_PLATFORM_LIMITS in src/store/useStore.ts.
-- The 12 default cues come from createDefaultPlatformCues(); export them with the seed script, not by hand.
-- ================================================================
-- trial_days: placeholder lengths, set the real ones in the admin screen. NULL = no free trial on that plan.
INSERT INTO plans(plan_id, name, price_monthly, trial_days, seat_limit, meeting_quota, monthly_credits, active, sort_order) VALUES
  ('free',       'Free Evaluation',  0,   NULL, 5,    10,   0,    true, 1),
  ('starter',    'Starter Plan',     99,  14,   10,   35,   100,  true, 2),
  ('growth',     'Growth Plan',      249, 14,   25,   NULL, 500,  true, 3),
  ('enterprise', 'Enterprise Plan',  799, NULL, NULL, NULL, 2500, true, 4);

INSERT INTO plan_features(plan_id, feature_key) VALUES
  ('free','manual_upload'), ('free','cue_scoring'),
  ('starter','manual_upload'), ('starter','cue_scoring'), ('starter','drive_sync'), ('starter','practice'), ('starter','document_tagging'),
  ('growth','manual_upload'), ('growth','cue_scoring'), ('growth','drive_sync'), ('growth','practice'), ('growth','document_tagging'),
  ('growth','crm_sync'), ('growth','live_assist'), ('growth','mock_meetings'), ('growth','deal_practice'),
  ('enterprise','manual_upload'), ('enterprise','cue_scoring'), ('enterprise','drive_sync'), ('enterprise','practice'), ('enterprise','document_tagging'),
  ('enterprise','crm_sync'), ('enterprise','live_assist'), ('enterprise','mock_meetings'), ('enterprise','deal_practice'),
  ('enterprise','crm_writeback'), ('enterprise','custom_speech');

-- One row per limit. To add a limit, insert a row: no schema change. Values are JSON.
INSERT INTO platform_limits(limit_key, limit_value, description) VALUES
  ('allowed_formats',     '["MP4", "MP3", "TXT"]', 'Meeting file types that can be uploaded'),
  ('max_file_size_mb',    '2048',                  'Largest meeting file, in megabytes'),
  ('max_duration_min',    '240',                   'Longest meeting file, in minutes'),
  ('invite_expiry_hours', '48',                    'How long an invitation link stays valid');
