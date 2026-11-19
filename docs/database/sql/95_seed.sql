-- ================================================================
-- Reference data. Mirrors DEFAULT_PLATFORM_PLANS and DEFAULT_PLATFORM_LIMITS in src/store/useStore.ts.
-- The 12 default cues come from createDefaultPlatformCues(); export them with the seed script, not by hand.
-- ================================================================
INSERT INTO plans(id, name, price_monthly, seat_limit, meeting_quota, monthly_credits, active, sort_order) VALUES
  ('free',       'Free Evaluation',  0,   5,    10,   0,    true, 1),
  ('starter',    'Starter Plan',     99,  10,   35,   100,  true, 2),
  ('growth',     'Growth Plan',      249, 25,   NULL, 500,  true, 3),
  ('enterprise', 'Enterprise Plan',  799, NULL, NULL, 2500, true, 4);

INSERT INTO plan_features(plan_id, feature_key) VALUES
  ('free','manual_upload'), ('free','cue_scoring'),
  ('starter','manual_upload'), ('starter','cue_scoring'), ('starter','drive_sync'), ('starter','practice'), ('starter','document_tagging'),
  ('growth','manual_upload'), ('growth','cue_scoring'), ('growth','drive_sync'), ('growth','practice'), ('growth','document_tagging'),
  ('growth','crm_sync'), ('growth','live_assist'), ('growth','mock_meetings'), ('growth','lead_coaching'),
  ('enterprise','manual_upload'), ('enterprise','cue_scoring'), ('enterprise','drive_sync'), ('enterprise','practice'), ('enterprise','document_tagging'),
  ('enterprise','crm_sync'), ('enterprise','live_assist'), ('enterprise','mock_meetings'), ('enterprise','lead_coaching'),
  ('enterprise','crm_writeback'), ('enterprise','custom_speech');

INSERT INTO platform_limits(id, formats, max_file_size_mb, max_duration_min, invite_expiry_hours) VALUES (1, 'MP4, MP3, TXT', 2048, 240, 48);
