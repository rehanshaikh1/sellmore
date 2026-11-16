# Single source of truth for the SellMore database. Generates schema.sql and the diagram data.
# Column: (name, type, flags, note). flags: pk, fk:table.col, uq, n (nullable). note: enum:a|b|c or free text.
U='uuid'; T='text'; TS='timestamptz'; I='int'; N='numeric(12,2)'; B='boolean'; D='date'; J='jsonb'
def c(name,typ=T,flags='',note=''): return (name,typ,flags,note)
def pk(): return c('id',U,'pk')
def tenant(): return c('tenant_id',U,'fk:tenants.id')
DOMAINS = {
 'platform':'Platform (super admin)', 'identity':'Tenants & people', 'billing':'Billing & credits',
 'integrations':'Integrations', 'leads':'Leads', 'meetings':'Meetings & analysis',
 'cues':'Cues & knowledge', 'practice':'Practice & coaching', 'ai':'Automation & AI'
}
TABLES = [
 # ---- platform
 ('plans','platform',[c('id',T,'pk','free | starter | growth | enterprise'),c('name'),c('price_monthly',N),c('seat_limit',I,'n','null = unlimited'),c('meeting_quota',I,'n','null = unlimited'),c('monthly_credits',I),c('active',B)],[]),
 ('plan_features','platform',[c('plan_id',T,'pk,fk:plans.id'),c('feature_key',T,'pk','e.g. live_assist, crm_sync, mock_meetings')],[]),
 ('platform_limits','platform',[c('id',I,'pk','always 1 (single row)'),c('formats',T,'','MP4, MP3, TXT'),c('max_file_size_mb',I),c('max_duration_min',I),c('invite_expiry_hours',I),c('updated_by',U,'fk:users.id,n'),c('updated_at',TS)],[]),
 ('platform_audit_log','platform',[pk(),c('actor_id',U,'fk:users.id'),c('tenant_id',U,'fk:tenants.id,n'),c('action',T),c('detail',T,'n'),c('created_at',TS)],[]),
 # ---- identity
 ('tenants','identity',[pk(),c('name',T,'uq'),c('plan_id',T,'fk:plans.id'),c('status',T,'','enum:active|suspended'),c('renewal_date',D,'n'),c('credit_balance',I),c('notes',T,'n'),c('created_at',TS)],[]),
 ('users','identity',[pk(),c('tenant_id',U,'fk:tenants.id,n','null only for super_admin'),c('manager_id',U,'fk:users.id,n','reps only: their one manager'),c('name'),c('email',T,'uq'),c('role',T,'','enum:super_admin|client_admin|manager|sales_rep'),c('title',T,'n'),c('status',T,'','enum:active|inactive'),c('last_login_at',TS,'n'),c('created_at',TS)],[]),
 ('invitations','identity',[pk(),tenant(),c('email'),c('role',T,'','enum:manager|sales_rep'),c('manager_id',U,'fk:users.id,n'),c('invited_by',U,'fk:users.id'),c('status',T,'','enum:pending|accepted|expired'),c('expires_at',TS),c('created_at',TS)],[]),
 ('notifications','identity',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('type'),c('body'),c('link',T,'n'),c('read_at',TS,'n'),c('created_at',TS)],[]),
 # ---- billing
 ('credit_transactions','billing',[pk(),tenant(),c('user_id',U,'fk:users.id,n'),c('activity'),c('credits_consumed',I),c('balance_after',I),c('created_at',TS)],[]),
 ('invoices','billing',[pk(),tenant(),c('amount',N),c('purpose'),c('status',T,'','enum:paid|processing|failed'),c('issued_at',TS),c('pdf_url',T,'n')],[]),
 # ---- integrations
 ('integrations','integrations',[pk(),tenant(),c('type',T,'','enum:crm|drive'),c('provider',T,'','salesforce | google_drive'),c('status',T,'','enum:connected|disconnected|error'),c('org_name',T,'n'),c('folder',T,'n'),c('sync_interval',T),c('last_sync_at',TS,'n'),c('last_sync_result',T,'n'),c('connected_by',U,'fk:users.id,n')],[['tenant_id','type']]),
 # ---- leads
 ('leads','leads',[pk(),tenant(),c('owner_id',U,'fk:users.id'),c('name'),c('company_name'),c('stage',T,'','enum:Discovery|Technical Review|Commercial Proposal|Negotiation|Closed Won|Closed Lost'),c('source',T,'','enum:crm|draft'),c('crm_system',T,'n'),c('crm_id',T,'n','Salesforce Opportunity id'),c('raw_stage',T,'n'),c('owner_crm_id',T,'n'),c('amount',N,'n'),c('close_date',D,'n'),c('next_meeting_at',TS,'n'),c('last_meeting_at',TS,'n'),c('crm_last_synced_at',TS,'n'),c('created_at',TS)],[['tenant_id','crm_id']]),
 ('lead_stakeholders','leads',[pk(),c('lead_id',U,'fk:leads.id'),c('name'),c('role',T,'n'),c('company',T,'n'),c('sentiment',T,'','enum:Champion|Neutral|Skeptic|Decision Maker'),c('last_spoke_at',TS,'n')],[]),
 ('lead_timeline_events','leads',[pk(),c('lead_id',U,'fk:leads.id'),c('meeting_id',U,'fk:meetings.id,n'),c('author_id',U,'fk:users.id,n'),c('type',T,'','enum:meeting|email|stage_change|note'),c('title'),c('description',T,'n'),c('occurred_at',TS)],[]),
 ('lead_risks','leads',[pk(),c('lead_id',U,'fk:leads.id'),c('text'),c('detected_at',TS),c('resolved_at',TS,'n')],[]),
 # ---- meetings
 ('meetings','meetings',[pk(),tenant(),c('rep_id',U,'fk:users.id'),c('lead_id',U,'fk:leads.id,n','null = call without a lead'),c('integration_id',U,'fk:integrations.id,n','where it was fetched from'),c('name'),c('uploaded_at',TS),c('duration_sec',I,'n'),c('processing_status',T,'','enum:processing|analysed|failed'),c('source',T,'','enum:upload|crm|drive'),c('source_detail',T,'n'),c('crm_activity_id',T,'n','blocks duplicate imports'),c('crm_opportunity_id',T,'n'),c('file_format',T,'n','enum:MP4|MP3|TXT'),c('file_size_bytes',I,'n'),c('storage_key',T,'n'),c('overall_score',I,'n','0-100'),c('summary',T,'n')],[['tenant_id','crm_activity_id']]),
 ('meeting_insights','meetings',[pk(),c('meeting_id',U,'fk:meetings.id'),c('kind',T,'','enum:went_well|struggled|could_be_better|next_step'),c('body'),c('position',I)],[]),
 ('meeting_cue_scores','meetings',[pk(),c('meeting_id',U,'fk:meetings.id'),c('cue_id',U,'fk:cues.id'),c('score',N,'n','0-5'),c('is_assessable',B),c('observation',T,'n'),c('improvement',T,'n'),c('evidence',T,'n'),c('severity',T,'n','enum:critical|warning|positive')],[['meeting_id','cue_id']]),
 ('meeting_objections','meetings',[pk(),c('meeting_id',U,'fk:meetings.id'),c('at_ms',I),c('objection'),c('rep_response',T,'n'),c('status',T,'','enum:Resolved|Partially Resolved|Unresolved'),c('stronger_response',T,'n')],[]),
 ('transcript_segments','meetings',[pk(),c('meeting_id',U,'fk:meetings.id'),c('speaker'),c('speaker_role',T,'','enum:rep|prospect'),c('start_ms',I),c('text')],[]),
 # ---- cues & knowledge
 ('cues','cues',[pk(),c('tenant_id',U,'fk:tenants.id,n','null = platform default'),c('code',I,'n','1-12 on platform defaults'),c('overrides_cue_id',U,'fk:cues.id,n','company copy replacing a default'),c('name'),c('category'),c('description',T,'n'),c('instructions'),c('enabled',B),c('updated_by',U,'fk:users.id,n'),c('updated_at',TS)],[]),
 ('knowledge_sources','cues',[pk(),tenant(),c('created_by',U,'fk:users.id'),c('name'),c('type',T,'','enum:PDF|DOCX|TXT|Website|YouTube|Manual QA'),c('size_or_url',T,'n'),c('status',T,'','enum:indexed|processing|failed'),c('assessment_tag',T,'n'),c('available_to_ai',B),c('created_at',TS)],[]),
 ('company_documents','cues',[pk(),tenant(),c('uploaded_by',U,'fk:users.id'),c('name'),c('size_bytes',I,'n'),c('storage_key',T),c('tagged_cue_id',U,'fk:cues.id,n','which cue it grounds'),c('considered',B,'','used in scoring'),c('status',T,'','enum:ready|processing'),c('uploaded_at',TS)],[]),
 ('knowledge_citations','cues',[pk(),c('source_id',U,'fk:knowledge_sources.id'),c('user_id',U,'fk:users.id,n'),c('meeting_id',U,'fk:meetings.id,n'),c('used_by',T,'','enum:ask_ai|ai_chat|live_assist|mock|practice'),c('cited_at',TS)],[]),
 # ---- practice
 ('practice_lessons','practice',[pk(),tenant(),c('owner_id',U,'fk:users.id','rep who practises'),c('created_by',U,'fk:users.id','rep or manager'),c('meeting_id',U,'fk:meetings.id,n'),c('lead_id',U,'fk:leads.id,n'),c('origin',T,'','enum:meeting|lead'),c('method',T,'','enum:checklist|ai'),c('title'),c('context',T,'n'),c('created_at',TS)],[]),
 ('practice_lesson_cues','practice',[c('lesson_id',U,'pk,fk:practice_lessons.id'),c('cue_id',U,'pk,fk:cues.id')],[]),
 ('practice_attempts','practice',[pk(),c('lesson_id',U,'fk:practice_lessons.id'),c('user_id',U,'fk:users.id'),c('turn_no',I),c('response'),c('score',I,'','0-100'),c('created_at',TS)],[]),
 ('lesson_feedback','practice',[pk(),c('lesson_id',U,'fk:practice_lessons.id'),c('manager_id',U,'fk:users.id'),c('feedback'),c('created_at',TS)],[]),
 ('mock_meetings','practice',[pk(),tenant(),c('rep_id',U,'fk:users.id'),c('source_meeting_id',U,'fk:meetings.id,n','must be an analysed call'),c('buyer_name'),c('buyer_role',T,'n'),c('roleplay_type'),c('domain',T,'n'),c('started_at',TS),c('duration_sec',I,'n'),c('score',I,'n','0-100'),c('summary',T,'n'),c('talk_listen_ratio',T,'n'),c('fillers_per_min',N,'n'),c('words_per_min',I,'n'),c('longest_monologue',T,'n'),c('rescore_status',T,'','enum:idle|processing|rescored')],[]),
 ('mock_meeting_focus_cues','practice',[c('mock_meeting_id',U,'pk,fk:mock_meetings.id'),c('cue_id',U,'pk,fk:cues.id')],[]),
 ('mock_meeting_points','practice',[pk(),c('mock_meeting_id',U,'fk:mock_meetings.id'),c('kind',T,'','enum:went_well|to_improve'),c('body')],[]),
 ('live_assist_sessions','practice',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('meeting_id',U,'fk:meetings.id,n','analysed call it was prepared from'),c('started_at',TS),c('ended_at',TS,'n'),c('notes',T,'n'),c('status',T,'','enum:active|ended')],[]),
 # ---- automation & AI
 ('automations','ai',[pk(),tenant(),c('created_by',U,'fk:users.id'),c('name'),c('description',T,'n'),c('trigger_event'),c('condition',T,'n'),c('action'),c('category',T,'','enum:Summary|Prompt|Email|Diagnostic'),c('status',T,'','enum:Active|Draft|Paused'),c('runs_count',I),c('last_run_at',TS,'n')],[]),
 ('automation_runs','ai',[pk(),c('automation_id',U,'fk:automations.id'),c('meeting_id',U,'fk:meetings.id,n'),c('lead_id',U,'fk:leads.id,n'),c('status',T,'','enum:success|failed'),c('output',T,'n'),c('ran_at',TS)],[]),
 ('chat_threads','ai',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('lead_id',U,'fk:leads.id,n','set when asked from a lead'),c('title',T,'n'),c('created_at',TS)],[]),
 ('chat_messages','ai',[pk(),c('thread_id',U,'fk:chat_threads.id'),c('role',T,'','enum:user|assistant'),c('body'),c('citations',J,'n','knowledge source ids'),c('created_at',TS)],[]),
]
