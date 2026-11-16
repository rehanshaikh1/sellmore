-- SellMore database schema (PostgreSQL 15+)
-- Generated from docs/database/schema_def.py. See er-diagram.html for the picture.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- Platform (super admin)
CREATE TABLE plans (
  id text PRIMARY KEY,  -- free | starter | growth | enterprise
  name text NOT NULL,
  price_monthly numeric(12,2) NOT NULL,
  seat_limit int,  -- null = unlimited
  meeting_quota int,  -- null = unlimited
  monthly_credits int NOT NULL,
  active boolean NOT NULL
);

-- Platform (super admin)
CREATE TABLE plan_features (
  plan_id text REFERENCES plans(id) ON DELETE CASCADE,
  feature_key text,  -- e.g. live_assist, crm_sync, mock_meetings
  PRIMARY KEY (plan_id, feature_key)
);

-- Tenants & people
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  plan_id text NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  renewal_date date,
  credit_balance int NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tenants & people
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),  -- null only for super_admin
  manager_id uuid REFERENCES users(id),  -- reps only: their one manager
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin', 'client_admin', 'manager', 'sales_rep')),
  title text,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Platform (super admin)
CREATE TABLE platform_limits (
  id int PRIMARY KEY,  -- always 1 (single row)
  formats text NOT NULL,  -- MP4, MP3, TXT
  max_file_size_mb int NOT NULL,
  max_duration_min int NOT NULL,
  invite_expiry_hours int NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Platform (super admin)
CREATE TABLE platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid REFERENCES tenants(id),
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tenants & people
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'sales_rep')),
  manager_id uuid REFERENCES users(id),
  invited_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tenants & people
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing & credits
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  activity text NOT NULL,
  credits_consumed int NOT NULL,
  balance_after int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing & credits
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL CHECK (status IN ('paid', 'processing', 'failed')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text
);

-- Integrations
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('crm', 'drive')),
  provider text NOT NULL,  -- salesforce | google_drive
  status text NOT NULL CHECK (status IN ('connected', 'disconnected', 'error')),
  org_name text,
  folder text,
  sync_interval text NOT NULL,
  last_sync_at timestamptz,
  last_sync_result text,
  connected_by uuid REFERENCES users(id),
  UNIQUE (tenant_id, type)
);

-- Leads
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  company_name text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('Discovery', 'Technical Review', 'Commercial Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
  source text NOT NULL CHECK (source IN ('crm', 'draft')),
  crm_system text,
  crm_id text,  -- Salesforce Opportunity id
  raw_stage text,
  owner_crm_id text,
  amount numeric(12,2),
  close_date date,
  next_meeting_at timestamptz,
  last_meeting_at timestamptz,
  crm_last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, crm_id)
);

-- Leads
CREATE TABLE lead_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  company text,
  sentiment text NOT NULL CHECK (sentiment IN ('Champion', 'Neutral', 'Skeptic', 'Decision Maker')),
  last_spoke_at timestamptz
);

-- Meetings & analysis
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rep_id uuid NOT NULL REFERENCES users(id),
  lead_id uuid REFERENCES leads(id),  -- null = call without a lead
  integration_id uuid REFERENCES integrations(id),  -- where it was fetched from
  name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  duration_sec int,
  processing_status text NOT NULL CHECK (processing_status IN ('processing', 'analysed', 'failed')),
  source text NOT NULL CHECK (source IN ('upload', 'crm', 'drive')),
  source_detail text,
  crm_activity_id text,  -- blocks duplicate imports
  crm_opportunity_id text,
  file_format text CHECK (file_format IN ('MP4', 'MP3', 'TXT')),
  file_size_bytes int,
  storage_key text,
  overall_score int,  -- 0-100
  summary text,
  UNIQUE (tenant_id, crm_activity_id)
);

-- Leads
CREATE TABLE lead_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id),
  author_id uuid REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('meeting', 'email', 'stage_change', 'note')),
  title text NOT NULL,
  description text,
  occurred_at timestamptz NOT NULL
);

-- Leads
CREATE TABLE lead_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  text text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Meetings & analysis
CREATE TABLE meeting_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('went_well', 'struggled', 'could_be_better', 'next_step')),
  body text NOT NULL,
  position int NOT NULL
);

-- Cues & knowledge
CREATE TABLE cues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),  -- null = platform default
  code int,  -- 1-12 on platform defaults
  overrides_cue_id uuid REFERENCES cues(id),  -- company copy replacing a default
  name text NOT NULL,
  category text NOT NULL,
  description text,
  instructions text NOT NULL,
  enabled boolean NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Meetings & analysis
CREATE TABLE meeting_cue_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  cue_id uuid NOT NULL REFERENCES cues(id),
  score numeric(12,2),  -- 0-5
  is_assessable boolean NOT NULL,
  observation text,
  improvement text,
  evidence text,
  severity text CHECK (severity IN ('critical', 'warning', 'positive')),
  UNIQUE (meeting_id, cue_id)
);

-- Meetings & analysis
CREATE TABLE meeting_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  at_ms int NOT NULL,
  objection text NOT NULL,
  rep_response text,
  status text NOT NULL CHECK (status IN ('Resolved', 'Partially Resolved', 'Unresolved')),
  stronger_response text
);

-- Meetings & analysis
CREATE TABLE transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  speaker_role text NOT NULL CHECK (speaker_role IN ('rep', 'prospect')),
  start_ms int NOT NULL,
  text text NOT NULL
);

-- Cues & knowledge
CREATE TABLE knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('PDF', 'DOCX', 'TXT', 'Website', 'YouTube', 'Manual QA')),
  size_or_url text,
  status text NOT NULL CHECK (status IN ('indexed', 'processing', 'failed')),
  assessment_tag text,
  available_to_ai boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cues & knowledge
CREATE TABLE company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  size_bytes int,
  storage_key text NOT NULL,
  tagged_cue_id uuid REFERENCES cues(id),  -- which cue it grounds
  considered boolean NOT NULL,  -- used in scoring
  status text NOT NULL CHECK (status IN ('ready', 'processing')),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Cues & knowledge
CREATE TABLE knowledge_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  meeting_id uuid REFERENCES meetings(id),
  used_by text NOT NULL CHECK (used_by IN ('ask_ai', 'ai_chat', 'live_assist', 'mock', 'practice')),
  cited_at timestamptz NOT NULL DEFAULT now()
);

-- Practice & coaching
CREATE TABLE practice_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id),  -- rep who practises
  created_by uuid NOT NULL REFERENCES users(id),  -- rep or manager
  meeting_id uuid REFERENCES meetings(id),
  lead_id uuid REFERENCES leads(id),
  origin text NOT NULL CHECK (origin IN ('meeting', 'lead')),
  method text NOT NULL CHECK (method IN ('checklist', 'ai')),
  title text NOT NULL,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Practice & coaching
CREATE TABLE practice_lesson_cues (
  lesson_id uuid REFERENCES practice_lessons(id) ON DELETE CASCADE,
  cue_id uuid REFERENCES cues(id),
  PRIMARY KEY (lesson_id, cue_id)
);

-- Practice & coaching
CREATE TABLE practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES practice_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  turn_no int NOT NULL,
  response text NOT NULL,
  score int NOT NULL,  -- 0-100
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Practice & coaching
CREATE TABLE lesson_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES practice_lessons(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES users(id),
  feedback text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Practice & coaching
CREATE TABLE mock_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rep_id uuid NOT NULL REFERENCES users(id),
  source_meeting_id uuid REFERENCES meetings(id),  -- must be an analysed call
  buyer_name text NOT NULL,
  buyer_role text,
  roleplay_type text NOT NULL,
  domain text,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_sec int,
  score int,  -- 0-100
  summary text,
  talk_listen_ratio text,
  fillers_per_min numeric(12,2),
  words_per_min int,
  longest_monologue text,
  rescore_status text NOT NULL CHECK (rescore_status IN ('idle', 'processing', 'rescored'))
);

-- Practice & coaching
CREATE TABLE mock_meeting_focus_cues (
  mock_meeting_id uuid REFERENCES mock_meetings(id) ON DELETE CASCADE,
  cue_id uuid REFERENCES cues(id),
  PRIMARY KEY (mock_meeting_id, cue_id)
);

-- Practice & coaching
CREATE TABLE mock_meeting_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_meeting_id uuid NOT NULL REFERENCES mock_meetings(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('went_well', 'to_improve')),
  body text NOT NULL
);

-- Practice & coaching
CREATE TABLE live_assist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  meeting_id uuid REFERENCES meetings(id),  -- analysed call it was prepared from
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  status text NOT NULL CHECK (status IN ('active', 'ended'))
);

-- Automation & AI
CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  condition text,
  action text NOT NULL,
  category text NOT NULL CHECK (category IN ('Summary', 'Prompt', 'Email', 'Diagnostic')),
  status text NOT NULL CHECK (status IN ('Active', 'Draft', 'Paused')),
  runs_count int NOT NULL,
  last_run_at timestamptz
);

-- Automation & AI
CREATE TABLE automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id),
  lead_id uuid REFERENCES leads(id),
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  output text,
  ran_at timestamptz NOT NULL DEFAULT now()
);

-- Automation & AI
CREATE TABLE chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  lead_id uuid REFERENCES leads(id),  -- set when asked from a lead
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Automation & AI
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  body text NOT NULL,
  citations jsonb,  -- knowledge source ids
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes on every foreign key and the common filters
CREATE INDEX idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_platform_limits_updated_by ON platform_limits(updated_by);
CREATE INDEX idx_platform_audit_log_actor_id ON platform_audit_log(actor_id);
CREATE INDEX idx_platform_audit_log_tenant_id ON platform_audit_log(tenant_id);
CREATE INDEX idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX idx_invitations_manager_id ON invitations(manager_id);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_credit_transactions_tenant_id ON credit_transactions(tenant_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX idx_integrations_connected_by ON integrations(connected_by);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_lead_stakeholders_lead_id ON lead_stakeholders(lead_id);
CREATE INDEX idx_meetings_tenant_id ON meetings(tenant_id);
CREATE INDEX idx_meetings_rep_id ON meetings(rep_id);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_integration_id ON meetings(integration_id);
CREATE INDEX idx_lead_timeline_events_lead_id ON lead_timeline_events(lead_id);
CREATE INDEX idx_lead_timeline_events_meeting_id ON lead_timeline_events(meeting_id);
CREATE INDEX idx_lead_timeline_events_author_id ON lead_timeline_events(author_id);
CREATE INDEX idx_lead_risks_lead_id ON lead_risks(lead_id);
CREATE INDEX idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX idx_cues_tenant_id ON cues(tenant_id);
CREATE INDEX idx_cues_overrides_cue_id ON cues(overrides_cue_id);
CREATE INDEX idx_cues_updated_by ON cues(updated_by);
CREATE INDEX idx_meeting_cue_scores_meeting_id ON meeting_cue_scores(meeting_id);
CREATE INDEX idx_meeting_cue_scores_cue_id ON meeting_cue_scores(cue_id);
CREATE INDEX idx_meeting_objections_meeting_id ON meeting_objections(meeting_id);
CREATE INDEX idx_transcript_segments_meeting_id ON transcript_segments(meeting_id);
CREATE INDEX idx_knowledge_sources_tenant_id ON knowledge_sources(tenant_id);
CREATE INDEX idx_knowledge_sources_created_by ON knowledge_sources(created_by);
CREATE INDEX idx_company_documents_tenant_id ON company_documents(tenant_id);
CREATE INDEX idx_company_documents_uploaded_by ON company_documents(uploaded_by);
CREATE INDEX idx_company_documents_tagged_cue_id ON company_documents(tagged_cue_id);
CREATE INDEX idx_knowledge_citations_source_id ON knowledge_citations(source_id);
CREATE INDEX idx_knowledge_citations_user_id ON knowledge_citations(user_id);
CREATE INDEX idx_knowledge_citations_meeting_id ON knowledge_citations(meeting_id);
CREATE INDEX idx_practice_lessons_tenant_id ON practice_lessons(tenant_id);
CREATE INDEX idx_practice_lessons_owner_id ON practice_lessons(owner_id);
CREATE INDEX idx_practice_lessons_created_by ON practice_lessons(created_by);
CREATE INDEX idx_practice_lessons_meeting_id ON practice_lessons(meeting_id);
CREATE INDEX idx_practice_lessons_lead_id ON practice_lessons(lead_id);
CREATE INDEX idx_practice_attempts_lesson_id ON practice_attempts(lesson_id);
CREATE INDEX idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX idx_lesson_feedback_lesson_id ON lesson_feedback(lesson_id);
CREATE INDEX idx_lesson_feedback_manager_id ON lesson_feedback(manager_id);
CREATE INDEX idx_mock_meetings_tenant_id ON mock_meetings(tenant_id);
CREATE INDEX idx_mock_meetings_rep_id ON mock_meetings(rep_id);
CREATE INDEX idx_mock_meetings_source_meeting_id ON mock_meetings(source_meeting_id);
CREATE INDEX idx_mock_meeting_points_mock_meeting_id ON mock_meeting_points(mock_meeting_id);
CREATE INDEX idx_live_assist_sessions_tenant_id ON live_assist_sessions(tenant_id);
CREATE INDEX idx_live_assist_sessions_user_id ON live_assist_sessions(user_id);
CREATE INDEX idx_live_assist_sessions_meeting_id ON live_assist_sessions(meeting_id);
CREATE INDEX idx_automations_tenant_id ON automations(tenant_id);
CREATE INDEX idx_automations_created_by ON automations(created_by);
CREATE INDEX idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_meeting_id ON automation_runs(meeting_id);
CREATE INDEX idx_automation_runs_lead_id ON automation_runs(lead_id);
CREATE INDEX idx_chat_threads_tenant_id ON chat_threads(tenant_id);
CREATE INDEX idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX idx_chat_threads_lead_id ON chat_threads(lead_id);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_meetings_tenant_rep ON meetings(tenant_id, rep_id, uploaded_at DESC);
CREATE INDEX idx_leads_tenant_owner ON leads(tenant_id, owner_id);
CREATE UNIQUE INDEX uq_cues_default_code ON cues(code) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_cues_one_override ON cues(tenant_id, overrides_cue_id) WHERE overrides_cue_id IS NOT NULL;

-- ---------------------------------------------------------------
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
