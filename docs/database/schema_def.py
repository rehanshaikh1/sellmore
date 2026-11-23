# Single source of truth for the SellMore database. generate.py turns this into schema.sql,
# schema.json and the diagram data in er-diagram.html.
#
# Column:  c(name, type, flags, note, default)
#   flags: pk | n (nullable) | uq | fk:table.col  plus  cascade | setnull for the ON DELETE action
#   note:  'enum:a|b|c' adds a CHECK; 'gen:EXPR' makes a stored generated column; anything else is a comment
# Table:   (name, domain, columns, [unique column lists], options)
#   options:
#     client_unique : adds UNIQUE (client_id, id) so other tables can reference it with a same-client composite FK
#     tfk           : [(col, parent_table[, parent_col])]  composite FK (client_id, col) -> parent(client_id, parent_col).
#                     A row can then never point at another company's row, even through a bug.
#     checks        : extra CHECK expressions
#     indexes       : extra index statements ({t} = table name)
#     rls           : 'client' | ('owner', col) | ('user', col) | ('child', parent, fkcol) | 'platform' | 'locked' | 'custom'
#     read / write  : role tuples for 'client' mode. write=() means the API cannot write (workers do).
#     append_only   : INSERT and SELECT only, UPDATE/DELETE blocked by grants and a trigger
#     policies      : raw CREATE POLICY statements for rls='custom'
U='uuid'; T='text'; TS='timestamptz'; I='int'; BI='bigint'; N='numeric(12,2)'; B='boolean'; D='date'; J='jsonb'
BY='bytea'; TV='tsvector'; INET='inet'
# Embeddings: pgvector halfvec (2 bytes per number). The size is fixed in each column, so it is set once here.
# Change EMBED_DIM to match the embedding model you pick, then regenerate.
EMBED_DIM = 1536
VEC = f'halfvec({EMBED_DIM})'
def c(name,typ=T,flags='',note='',default=''): return (name,typ,flags,note,default)
def pk(name): return c(name,U,'pk','','gen_random_uuid()')
def client(): return c('client_id',U,'fk:clients.client_id,cascade')
def created(name='created_at'): return c(name,TS,'','','now()')
def updated(): return c('updated_at',TS,'','','now()')
def tags(): return c('tags','text[]','','labels for filtering: lower case, at most 20',"'{}'")
def embed_cols(name='embeddings', what='the text'):
    return [c(name,VEC,'n','meaning vector of '+what+', filled by a worker; empty until then or for very short text'),
            c('embedding_model',T,'n','model that made the vector, so it can be redone'),c('embedded_at',TS,'n')]
TAGCHK = ['tags = lower(tags::text)::text[]', 'cardinality(tags) <= 20']
HNSW = "CREATE INDEX idx_{t}_%s ON {t} USING hnsw (%s halfvec_cosine_ops) WHERE %s IS NOT NULL"
GINTAGS = "CREATE INDEX idx_{t}_tags ON {t} USING gin(tags)"
def deleted(): return c('deleted_at',TS,'n','soft delete: rows are hidden, not removed')

DOMAINS = {
 'platform':'Platform (super admin)', 'identity':'Clients & people', 'billing':'Billing & credits',
 'integrations':'Integrations', 'leads':'Leads', 'meetings':'Meetings & analysis',
 'cues':'Cues & knowledge', 'practice':'Practice', 'ai':'Automation & AI'
}
ADMIN=('client_admin',); ADMGR=('client_admin','manager'); ALLR=('client_admin','manager','sales_rep')

_TABLES = [
 # ================= platform =================
 ('platform_owner_users','platform',[pk('platform_owner_user_id'),c('name'),c('email',T,'uq','always stored lower case'),c('status',T,'','enum:active|inactive','\'active\''),
   c('last_login_at',TS,'n'),created(),updated()],[],
   {'rls':'custom','checks':['email = lower(email)'],
    'policies':[
     "CREATE POLICY platform_owner_users_select ON platform_owner_users FOR SELECT USING (app_role() = 'super_admin')",
     "CREATE POLICY platform_owner_users_insert ON platform_owner_users FOR INSERT WITH CHECK (app_role() = 'super_admin')",
     "CREATE POLICY platform_owner_users_update ON platform_owner_users FOR UPDATE USING (app_role() = 'super_admin') WITH CHECK (app_role() = 'super_admin')"]}),
 ('plans','platform',[c('plan_id',T,'pk','enum:free|starter|growth|enterprise'),c('name'),c('price_monthly',N,'','','0'),c('currency',T,'','','\'USD\''),
   c('trial_days',I,'n','length of the free trial in days; empty = this plan has no trial'),c('seat_limit',I,'n','null = unlimited'),c('meeting_quota',I,'n','null = unlimited'),c('monthly_credits',I,'','','0'),
   c('active',B,'','','true'),c('sort_order',I,'','','0'),created(),updated()],[],
   {'rls':'platform','checks':['price_monthly >= 0','trial_days IS NULL OR trial_days > 0','seat_limit IS NULL OR seat_limit > 0','monthly_credits >= 0']}),
 ('plan_features','platform',[c('plan_id',T,'pk,fk:plans.plan_id,cascade'),c('feature_key',T,'pk','e.g. live_assist, crm_sync, mock_meetings')],[],{'rls':'platform'}),
 ('platform_limits','platform',[pk('platform_limit_id'),c('limit_key',T,'uq','snake_case name of the limit, e.g. max_file_size_mb. Add a row to add a limit, no schema change'),
   c('limit_value',J,'','the value: a number, text, a list or true/false, as JSON'),c('description',T,'n','what the limit does')],[],
   {'rls':'platform','checks':["limit_key ~ '^[a-z][a-z0-9_]*$'"]}),
 ('platform_audit_log','platform',[pk('platform_audit_log_id'),c('actor_id',U,'fk:platform_owner_users.platform_owner_user_id'),c('client_id',U,'fk:clients.client_id,n,setnull'),c('action',T),c('detail',T,'n'),created()],[],
   {'rls':'platform','append_only':True}),

 # ================= clients & people =================
 ('clients','identity',[pk('client_id'),c('name',T,'uq'),c('slug',T,'uq','url-safe short name'),c('plan_id',T,'fk:plans.plan_id'),
   c('status',T,'','enum:active|suspended','\'active\''),c('renewal_date',D,'n','null on the free plan'),c('trial_ends_at',TS,'n','when the free trial ends; empty when the client is not on a trial'),c('credit_balance',I,'','changed only by consume_credits / grant_credits','0'),
   c('timezone',T,'','matters for scheduled imports and summaries','\'UTC\''),c('recording_retention_days',I,'','how long audio is kept','365'),
   c('billing_customer_id',T,'n','payment provider customer id'),c('notes',T,'n'),created(),updated(),deleted()],[],
   {'rls':'custom','checks':['credit_balance >= 0','recording_retention_days > 0','slug ~ \'^[a-z0-9][a-z0-9-]*$\''],
    'policies':[
     "CREATE POLICY clients_select ON clients FOR SELECT USING (app_role() = 'super_admin' OR client_id = app_client_id())",
     "CREATE POLICY clients_insert ON clients FOR INSERT WITH CHECK (app_role() = 'super_admin')",
     "CREATE POLICY clients_update ON clients FOR UPDATE USING (app_role() = 'super_admin' OR (client_id = app_client_id() AND app_role() = 'client_admin')) WITH CHECK (app_role() = 'super_admin' OR (client_id = app_client_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY clients_delete ON clients FOR DELETE USING (app_role() = 'super_admin')"]}),
 ('client_users','identity',[pk('client_user_id'),c('client_id',U,'fk:clients.client_id,cascade'),c('manager_id',U,'fk:client_users.client_user_id,n','reps only: their one manager'),
   c('name'),c('email',T,'uq','always stored lower case'),c('role',T,'','enum:client_admin|manager|sales_rep'),c('title',T,'n'),c('avatar_url',T,'n'),
   c('status',T,'','enum:active|inactive','\'active\''),c('crm_user_id',T,'n','Salesforce user id, matched by email on connect'),
   c('phone_extension',T,'n','phone system extension, files calls under this person'),c('last_login_at',TS,'n'),created(),updated(),deleted()],
   [['client_id','crm_user_id'],['client_id','phone_extension']],
   {'client_unique':True,'tfk':[('manager_id','client_users')],'rls':'custom',
    'checks':['email = lower(email)','manager_id IS NULL OR role = \'sales_rep\'','manager_id IS DISTINCT FROM client_user_id'],
    'policies':[
     "CREATE POLICY client_users_select ON client_users FOR SELECT USING (app_role() = 'super_admin' OR client_id = app_client_id())",
     "CREATE POLICY client_users_insert ON client_users FOR INSERT WITH CHECK (app_role() = 'super_admin' OR (client_id = app_client_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY client_users_update ON client_users FOR UPDATE USING (app_role() = 'super_admin' OR (client_id = app_client_id() AND (app_role() = 'client_admin' OR client_user_id = app_user_id()))) WITH CHECK (app_role() = 'super_admin' OR (client_id = app_client_id() AND (app_role() = 'client_admin' OR client_user_id = app_user_id())))",
     "CREATE POLICY client_users_delete ON client_users FOR DELETE USING (app_role() = 'super_admin')"]}),
 ('auth_identities','identity',[pk('auth_identity_id'),c('user_id',U,'fk:client_users.client_user_id,n,cascade','set for a client user'),c('platform_owner_user_id',U,'fk:platform_owner_users.platform_owner_user_id,n,cascade','set for a platform owner'),c('provider',T,'','enum:password|google|microsoft|saml|oidc'),c('subject',T,'','provider user id, or the email for password'),
   c('password_hash',T,'n','argon2id, never plain text'),c('mfa_enabled',B,'','','false'),c('last_used_at',TS,'n'),created()],[['provider','subject']],
   {'rls':'locked','checks':["provider <> 'password' OR password_hash IS NOT NULL",'(user_id IS NULL) <> (platform_owner_user_id IS NULL)']}),
 ('invitations','identity',[pk('invitation_id'),client(),c('email'),c('role',T,'','enum:manager|sales_rep'),c('manager_id',U,'fk:client_users.client_user_id,n','reps only'),c('invited_by',U,'fk:client_users.client_user_id'),
   c('token_hash',T,'uq','hash of the emailed link token'),c('status',T,'','enum:pending|accepted|expired|revoked','\'pending\''),c('expires_at',TS),c('accepted_at',TS,'n'),
   c('accepted_user_id',U,'fk:client_users.client_user_id,n,setnull'),created()],[],
   {'tfk':[('manager_id','client_users'),('invited_by','client_users')],'rls':'client','read':ADMGR,'write':ADMGR,
    'checks':['email = lower(email)','manager_id IS NULL OR role = \'sales_rep\''],
    'indexes':["CREATE UNIQUE INDEX uq_invitations_pending ON {t}(client_id, email) WHERE status = 'pending'"]}),
 ('manager_assignments','identity',[pk('manager_assignment_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','the rep'),c('manager_id',U,'fk:client_users.client_user_id,n','null = unassigned'),c('assigned_by',U,'fk:client_users.client_user_id,n,setnull','null = system'),
   created('started_at'),c('ended_at',TS,'n','null = current')],[],
   {'rls':'custom',
    'indexes':["CREATE UNIQUE INDEX uq_manager_assignments_current ON {t}(client_user_id) WHERE ended_at IS NULL"],
    'policies':["CREATE POLICY manager_assignments_select ON manager_assignments FOR SELECT USING (app_in_my_client(client_user_id) AND app_role() IN ('client_admin', 'manager'))"]}),
 ('notifications','identity',[pk('notification_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade'),c('type'),c('body'),c('link',T,'n'),c('read_at',TS,'n'),created()],[],
   {'rls':('user','client_user_id')}),
 ('audit_log','identity',[pk('audit_log_id'),client(),c('actor_id',U,'fk:client_users.client_user_id,n,setnull'),c('action',T,'','e.g. user.role_changed, rep.reassigned, integration.connected'),
   c('entity_type',T,'n'),c('entity_id',U,'n'),c('detail',J,'n','before / after values'),c('ip',INET,'n'),created()],[],
   {'rls':'client','read':ADMIN,'write':ALLR,'append_only':True}),

 # ================= billing =================
 ('credit_transactions','billing',[pk('credit_transaction_id'),client(),c('user_id',U,'fk:client_users.client_user_id,n,setnull'),c('activity'),c('kind',T,'','enum:consume|grant|refund|adjust','\'consume\''),
   c('credits_consumed',I,'','negative = credits added'),c('balance_after',I),c('ref_type',T,'n','e.g. meeting, mock_meeting'),c('ref_id',U,'n'),
   c('idempotency_key',T,'n','a retried request cannot charge twice'),created()],[['client_id','idempotency_key']],
   {'rls':'client','read':ADMIN,'write':(),'append_only':True,'checks':['credits_consumed <> 0','balance_after >= 0']}),
 ('invoices','billing',[pk('invoice_id'),client(),c('amount',N),c('currency',T,'','','\'USD\''),c('purpose'),c('status',T,'','enum:paid|processing|failed'),
   c('provider_invoice_id',T,'n'),created('issued_at'),c('paid_at',TS,'n'),c('pdf_url',T,'n')],[['client_id','provider_invoice_id']],
   {'rls':'client','read':ADMIN,'write':(),'checks':['amount >= 0']}),

 # ================= integrations =================
 ('integrations','integrations',[pk('integration_id'),client(),c('type',T,'','enum:crm|drive'),c('provider',T,'','salesforce | google_drive'),
   c('status',T,'','enum:connected|disconnected|error','\'disconnected\''),c('org_name',T,'n'),c('provider_org_id',T,'n','Salesforce org id, to catch a wrong-org connect'),
   c('folder_id',T,'n','Drive folder id'),c('folder',T,'n','Drive folder name, e.g. Call recordings'),
   c('sync_interval',T,'','enum:manual|15m|30m|1h|6h|12h|24h','\'1h\''),c('last_sync_at',TS,'n'),c('last_sync_result',T,'n'),c('next_sync_at',TS,'n'),
   c('sync_cursor',T,'n','last change seen, so a sync only fetches what is new'),c('connected_by',U,'fk:client_users.client_user_id,n,setnull'),c('connected_at',TS,'n'),created(),updated()],[['client_id','type']],
   {'client_unique':True,'tfk':[('connected_by','client_users')],'rls':'client','read':ALLR,'write':ADMIN,
    'indexes':["CREATE INDEX idx_integrations_due ON {t}(next_sync_at) WHERE status = 'connected' AND sync_interval <> 'manual'"]}),
 ('integration_credentials','integrations',[c('integration_id',U,'pk,fk:integrations.integration_id,cascade'),c('access_token_enc',BY,'n','encrypted with a KMS key, never plain text'),
   c('refresh_token_enc',BY,'n'),c('instance_url',T,'n'),c('scopes',T,'n'),c('expires_at',TS,'n'),c('key_version',I,'','','1'),updated()],[],{'rls':'locked'}),
 ('integration_sync_runs','integrations',[pk('integration_sync_run_id'),client(),c('integration_id',U,'fk:integrations.integration_id,cascade'),c('trigger_kind',T,'','enum:manual|schedule|webhook'),
   c('status',T,'','enum:running|success|partial|failed','\'running\''),created('started_at'),c('finished_at',TS,'n'),c('items_found',I,'','','0'),c('items_imported',I,'','','0'),
   c('items_failed',I,'','','0'),c('error',T,'n')],[],
   {'tfk':[('integration_id','integrations')],'rls':'client','read':ADMGR,'write':(),
    'indexes':["CREATE INDEX idx_integration_sync_runs_recent ON {t}(integration_id, started_at DESC)"]}),
 ('integration_events','integrations',[pk('integration_event_id'),client(),c('integration_id',U,'fk:integrations.integration_id,cascade'),c('provider_event_id',T,'','Salesforce replay id, makes webhooks idempotent'),
   c('event_type'),c('payload',J),created('received_at'),c('processed_at',TS,'n'),c('error',T,'n')],[['integration_id','provider_event_id']],
   {'tfk':[('integration_id','integrations')],'rls':'locked'}),
 ('crm_stage_mappings','integrations',[pk('crm_stage_mapping_id'),client(),c('crm_stage','text','','stage name exactly as Salesforce reports it'),
   c('sellmore_stage',T,'','enum:Discovery|Technical Review|Commercial Proposal|Negotiation|Closed Won|Closed Lost')],[['client_id','crm_stage']],
   {'rls':'client','read':ALLR,'write':ADMIN}),
 ('crm_activities','integrations',[pk('crm_activity_id'),client(),c('integration_id',U,'fk:integrations.integration_id,cascade'),c('external_id',T,'','Salesforce Task / Event id'),
   c('kind',T,'','enum:call|meeting','\'call\''),c('subject'),c('description',T,'n','holds the 5-line AI call summary'),c('direction',T,'n','enum:inbound|outbound'),
   c('outcome',T,'n','answered | missed | voicemail | no_answer'),c('phone_number',T,'n'),c('started_at',TS,'n'),c('duration_sec',I,'n'),
   c('who_type',T,'n','enum:Contact|Lead'),c('who_id',T,'n','Salesforce Contact or Lead id'),c('what_type',T,'n','enum:Opportunity|Account'),
   c('what_id',T,'n','Opportunity id (WhatId), null when the call has none'),c('account_name',T,'n'),c('owner_crm_id',T,'n'),
   c('owner_user_id',U,'fk:client_users.client_user_id,n,setnull','resolved from owner_crm_id or the phone extension'),c('recording_url',T,'n','link to the original recording in the phone system'),
   c('raw',J,'n','untouched Salesforce payload'),c('synced_at',TS,'','','now()'),created()],[['client_id','external_id']],
   {'tfk':[('integration_id','integrations'),('owner_user_id','client_users')],'rls':('owner','owner_user_id'),'write':(),
    'indexes':["CREATE INDEX idx_crm_activities_phone ON {t}(client_id, phone_number)","CREATE INDEX idx_crm_activities_what ON {t}(client_id, what_id)"]}),

 # ================= leads =================
 ('leads','leads',[pk('lead_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','the rep who owns the deal; the company is client_users.client_id'),c('name'),c('company_name'),
   c('stage',T,'','enum:Discovery|Technical Review|Commercial Proposal|Negotiation|Closed Won|Closed Lost'),c('source',T,'','enum:crm|draft'),
   c('crm_system',T,'n'),c('crm_id',T,'n','Salesforce Opportunity id'),c('raw_stage',T,'n','stage name exactly as Salesforce reports it'),
   c('owner_crm_id',T,'n'),c('crm_account_id',T,'n'),c('amount',N,'n'),c('currency',T,'','','\'USD\''),c('close_date',D,'n'),c('next_meeting_at',TS,'n'),
   c('last_meeting_at',TS,'n','kept up to date by a trigger'),c('stage_changed_at',TS,'','drives "days in stage"','now()'),c('crm_last_synced_at',TS,'n'),created(),updated(),deleted()],[],
   {'rls':'custom',
    'checks':["(source = 'crm') = (crm_id IS NOT NULL)",'amount IS NULL OR amount >= 0'],
    'indexes':["CREATE UNIQUE INDEX uq_leads_crm_id ON {t}(crm_id) WHERE crm_id IS NOT NULL","CREATE INDEX idx_leads_owner_stage ON {t}(client_user_id, stage) WHERE deleted_at IS NULL"],
    'policies':[
     "CREATE POLICY leads_select ON leads FOR SELECT USING (app_in_my_client(client_user_id) AND app_can_access_owner(client_user_id))",
     "CREATE POLICY leads_insert ON leads FOR INSERT WITH CHECK (app_in_my_client(client_user_id) AND app_can_access_owner(client_user_id))",
     "CREATE POLICY leads_update ON leads FOR UPDATE USING (app_in_my_client(client_user_id) AND app_can_access_owner(client_user_id)) WITH CHECK (app_in_my_client(client_user_id) AND app_can_access_owner(client_user_id))",
     "CREATE POLICY leads_delete ON leads FOR DELETE USING (app_in_my_client(client_user_id) AND app_can_access_owner(client_user_id))"]}),
 ('lead_stakeholders','leads',[pk('lead_stakeholder_id'),c('lead_id',U,'fk:leads.lead_id,cascade'),c('name'),c('role',T,'n'),c('company',T,'n'),c('email',T,'n'),
   c('crm_contact_id',T,'n','Opportunity Contact Role is per opportunity, contacts are never merged across deals'),
   c('sentiment',T,'','enum:Champion|Neutral|Skeptic|Decision Maker'),c('last_spoke_at',TS,'n')],[['lead_id','crm_contact_id']],{'rls':('child','leads','lead_id')}),
 ('lead_timeline_events','leads',[pk('lead_timeline_event_id'),c('lead_id',U,'fk:leads.lead_id,cascade'),c('meeting_id',U,'fk:meetings.meeting_id,n,setnull'),c('author_id',U,'fk:client_users.client_user_id,n,setnull'),
   c('type',T,'','enum:meeting|email|stage_change|note'),c('title'),c('description',T,'n'),c('occurred_at',TS)],[],
   {'rls':('child','leads','lead_id'),'indexes':["CREATE INDEX idx_lead_timeline_events_feed ON {t}(lead_id, occurred_at DESC)"]}),
 ('lead_risks','leads',[pk('lead_risk_id'),c('lead_id',U,'fk:leads.lead_id,cascade'),c('text'),created('detected_at'),c('resolved_at',TS,'n')],[],{'rls':('child','leads','lead_id')}),

 # ================= meetings & analysis =================
 ('media_files','meetings',[pk('media_file_id'),client(),c('uploaded_by',U,'fk:client_users.client_user_id,n,setnull','null for files fetched from Drive'),c('source',T,'','enum:upload|drive'),
   c('drive_file_id',T,'n'),c('drive_file_name',T,'n','file name, used to match the audio to a CRM call'),c('storage_key',T,'','object store key of our copy'),
   c('file_format',T,'n','enum:MP4|MP3|TXT'),c('mime_type',T,'n'),c('size_bytes',BI,'n'),c('duration_sec',I,'n'),c('checksum_sha256',T,'n'),
   c('retention_until',TS,'n','audio is deleted after this date'),created(),deleted()],[['client_id','drive_file_id']],
   {'client_unique':True,'tfk':[('uploaded_by','client_users')],'rls':'custom',
    'checks':["(source = 'drive') = (drive_file_id IS NOT NULL)",'size_bytes IS NULL OR size_bytes >= 0'],
    'indexes':["CREATE INDEX idx_media_files_retention ON {t}(retention_until) WHERE deleted_at IS NULL"],
    'policies':[
     "CREATE POLICY media_files_select ON media_files FOR SELECT USING (client_id = app_client_id() AND (app_role() = 'client_admin' OR EXISTS (SELECT 1 FROM meetings m WHERE m.media_file_id = media_files.media_file_id)))",
     "CREATE POLICY media_files_insert ON media_files FOR INSERT WITH CHECK (client_id = app_client_id() AND (app_role() = 'client_admin' OR uploaded_by = app_user_id()))",
     "CREATE POLICY media_files_update ON media_files FOR UPDATE USING (client_id = app_client_id() AND (app_role() = 'client_admin' OR uploaded_by = app_user_id()))",
     "CREATE POLICY media_files_delete ON media_files FOR DELETE USING (client_id = app_client_id() AND app_role() = 'client_admin')"]}),
 ('meetings','meetings',[pk('meeting_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','the rep the call belongs to; the company is client_users.client_id'),c('lead_id',U,'fk:leads.lead_id,n','null = call without a lead'),
   c('integration_id',U,'fk:integrations.integration_id,n','where it was fetched from'),c('media_file_id',U,'fk:media_files.media_file_id,n','null while the audio has not arrived yet'),
   c('crm_activity_id',U,'fk:crm_activities.crm_activity_id,n','the Salesforce call record it came from, blocks duplicate imports'),c('crm_opportunity_id',T,'n'),
   c('name'),c('source',T,'','enum:upload|crm|drive'),c('source_detail',T,'n'),c('meeting_at',TS,'n','when the call happened'),created('uploaded_at'),c('duration_sec',I,'n'),
   c('processing_status',T,'','enum:awaiting_audio|queued|transcribing|analysing|analysed|failed|unmatched','\'queued\''),c('failure_reason',T,'n'),
   c('match_status',T,'n','enum:matched|unmatched|ambiguous'),c('overall_score',I,'n','0-100'),c('summary',T,'n'),c('language',T,'n'),tags(),*embed_cols('summary_embeddings','the summary, to find similar calls'),
   c('analysed_at',TS,'n'),updated(),deleted()],
   [['crm_activity_id'],['media_file_id']],
   {'no_auto_idx':['client_user_id'],'rls':('owner','client_user_id'),
    'checks':['overall_score IS NULL OR overall_score BETWEEN 0 AND 100',"source <> 'upload' OR media_file_id IS NOT NULL","source <> 'crm' OR crm_activity_id IS NOT NULL","source <> 'drive' OR media_file_id IS NOT NULL"]+TAGCHK,
    'indexes':["CREATE INDEX idx_meetings_user_time ON {t}(client_user_id, uploaded_at DESC) WHERE deleted_at IS NULL",
               "CREATE INDEX idx_meetings_lead_time ON {t}(lead_id, meeting_at DESC) WHERE deleted_at IS NULL",
               "CREATE INDEX idx_meetings_pending ON {t}(processing_status) WHERE processing_status NOT IN ('analysed','failed')",
               GINTAGS,HNSW%('summary_embeddings','summary_embeddings','summary_embeddings')]}),
 ('analysis_runs','meetings',[pk('analysis_run_id'),c('meeting_id',U,'fk:meetings.meeting_id,cascade'),c('kind',T,'','enum:transcription|analysis|rescore'),
   c('status',T,'','enum:queued|running|success|failed','\'queued\''),c('model',T,'n'),c('prompt_version',T,'n'),c('input_tokens',I,'n'),c('output_tokens',I,'n'),
   c('credits_charged',I,'','','0'),c('raw_output',J,'n','the model\'s full reply as returned, for audit and re-parsing. Cleared when the recording expires'),
   c('started_at',TS,'n'),c('finished_at',TS,'n'),c('error',T,'n'),created()],[],{'rls':('child','meetings','meeting_id')}),
 ('meeting_insights','meetings',[pk('meeting_insight_id'),c('meeting_id',U,'fk:meetings.meeting_id,cascade'),c('kind',T,'','enum:went_well|struggled|could_be_better|next_step'),c('body'),c('position',I)],[],
   {'rls':('child','meetings','meeting_id')}),
 ('meeting_cue_scores','meetings',[pk('meeting_cue_score_id'),c('meeting_id',U,'fk:meetings.meeting_id,cascade'),c('cue_id',U,'fk:cues.cue_id'),c('score',N,'n','0-5'),c('is_assessable',B),
   c('observation',T,'n'),c('improvement',T,'n'),c('evidence',T,'n'),c('evidence_segment_id',U,'fk:transcript_segments.transcript_segment_id,n,setnull','the exact transcript line the evidence is from'),
   c('severity',T,'n','enum:critical|warning|positive')],[['meeting_id','cue_id']],
   {'rls':('child','meetings','meeting_id'),'checks':['score IS NULL OR score BETWEEN 0 AND 5']}),
 ('meeting_objections','meetings',[pk('meeting_objection_id'),c('meeting_id',U,'fk:meetings.meeting_id,cascade'),c('segment_id',U,'fk:transcript_segments.transcript_segment_id,n,setnull','the buyer line it points at'),
   c('at_ms',I),c('objection'),c('category',T,'n','enum:price|timing|authority|competitor|technical|risk|other'),c('rep_response',T,'n'),
   c('status',T,'','enum:Resolved|Partially Resolved|Unresolved'),c('stronger_response',T,'n')],[],
   {'rls':('child','meetings','meeting_id')}),
 ('transcript_segments','meetings',[pk('transcript_segment_id'),c('meeting_id',U,'fk:meetings.meeting_id,cascade'),c('seq',I),c('speaker'),c('speaker_role',T,'','enum:rep|prospect'),
   c('start_ms',I),c('end_ms',I,'n'),c('text',T,'','cleaned text, what users read'),
   c('raw_text',T,'n','speech-to-text output exactly as returned, before cleanup. Cleared when the recording expires'),
   c('language',T,'n'),c('asr_confidence','numeric(4,3)','n','0 to 1, from the speech-to-text engine'),tags(),
   *embed_cols('embeddings','this turn'),c('tsv',TV,'n',"gen:to_tsvector('english', text)")],[['meeting_id','seq']],
   {'rls':('child','meetings','meeting_id'),'checks':TAGCHK+['asr_confidence IS NULL OR asr_confidence BETWEEN 0 AND 1'],
    'indexes':["CREATE INDEX idx_transcript_segments_tsv ON {t} USING gin(tsv)","CREATE INDEX idx_transcript_segments_time ON {t}(meeting_id, start_ms)",GINTAGS,HNSW%('embeddings','embeddings','embeddings')]}),
 ('transcript_segment_cues','meetings',[c('segment_id',U,'pk,fk:transcript_segments.transcript_segment_id,cascade'),c('cue_id',U,'pk,fk:cues.cue_id')],[],
   {'rls':('child','transcript_segments','segment_id')}),

 # ================= cues & knowledge =================
 ('cues','cues',[pk('cue_id'),c('client_id',U,'fk:clients.client_id,n,cascade','null = platform default'),c('code',I,'n','1-12 on platform defaults'),
   c('overrides_cue_id',U,'fk:cues.cue_id,n','company copy replacing a default'),c('name'),c('category'),c('description',T,'n'),c('instructions'),c('enabled',B,'','','true'),
   c('updated_by',U,'fk:client_users.client_user_id,n,setnull','the client user who last edited it'),c('updated_by_owner_id',U,'fk:platform_owner_users.platform_owner_user_id,n,setnull','the platform owner who last edited a platform default'),updated()],[],
   {'rls':'custom','checks':['updated_by IS NULL OR updated_by_owner_id IS NULL','client_id IS NOT NULL OR code IS NOT NULL','overrides_cue_id IS NULL OR client_id IS NOT NULL','code IS NULL OR code BETWEEN 1 AND 12'],
    'indexes':["CREATE UNIQUE INDEX uq_cues_default_code ON {t}(code) WHERE client_id IS NULL AND deleted_at IS NULL","CREATE UNIQUE INDEX uq_cues_one_override ON {t}(client_id, overrides_cue_id) WHERE overrides_cue_id IS NOT NULL AND deleted_at IS NULL"],
    'policies':[
     "CREATE POLICY cues_select ON cues FOR SELECT USING (client_id IS NULL OR client_id = app_client_id())",
     "CREATE POLICY cues_insert ON cues FOR INSERT WITH CHECK ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY cues_update ON cues FOR UPDATE USING ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin')) WITH CHECK ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY cues_delete ON cues FOR DELETE USING ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin'))"]}),
 ('knowledge_sources','cues',[pk('knowledge_source_id'),client(),c('created_by',U,'fk:client_users.client_user_id'),c('name'),c('type',T,'','enum:PDF|DOCX|TXT|Website|YouTube|Manual QA'),
   c('size_or_url',T,'n'),c('storage_key',T,'n'),c('status',T,'','enum:indexed|processing|failed','\'processing\''),c('assessment_tag',T,'n','the one QA area it counts for'),
   tags(),c('raw_text',T,'n','full text extracted from the file or page, before it is cut into chunks'),c('content_hash',T,'n','sha256 of the content, blocks adding the same thing twice'),
   c('available_to_ai',B,'','','true'),created(),updated(),deleted()],[],
   {'client_unique':True,'tfk':[('created_by','client_users')],'rls':'client','read':ALLR,'write':ADMGR,'checks':TAGCHK,
    'indexes':[GINTAGS,"CREATE UNIQUE INDEX uq_knowledge_sources_hash ON {t}(client_id, content_hash) WHERE content_hash IS NOT NULL AND deleted_at IS NULL"]}),
 ('company_documents','cues',[pk('company_document_id'),client(),c('uploaded_by',U,'fk:client_users.client_user_id'),c('name'),c('size_bytes',BI,'n'),c('mime_type',T,'n'),c('storage_key',T),c('checksum_sha256',T,'n'),
   c('tagged_cue_id',U,'fk:cues.cue_id,n,setnull','which cue it grounds'),tags(),c('raw_text',T,'n','full text extracted from the file, before it is cut into chunks'),
   *embed_cols('embeddings','the whole document, for example the average of its chunk vectors, to find similar documents'),
   c('considered',B,'','used in scoring','true'),c('status',T,'','enum:ready|processing','\'processing\''),
   created('uploaded_at'),updated(),deleted()],[],
   {'client_unique':True,'tfk':[('uploaded_by','client_users')],'rls':'client','read':ALLR,'write':ADMIN,'checks':TAGCHK,
    'indexes':[GINTAGS,"CREATE UNIQUE INDEX uq_company_documents_hash ON {t}(client_id, checksum_sha256) WHERE checksum_sha256 IS NOT NULL AND deleted_at IS NULL",HNSW%('embeddings','embeddings','embeddings')]}),
 ('knowledge_chunks','cues',[pk('knowledge_chunk_id'),client(),c('source_id',U,'fk:knowledge_sources.knowledge_source_id,n,cascade'),c('document_id',U,'fk:company_documents.company_document_id,n,cascade'),c('seq',I),c('content'),
   c('token_count',I,'n'),*embed_cols('embeddings','this chunk'),c('tsv',TV,'n',"gen:to_tsvector('english', content)")],[],
   {'rls':'client','read':ALLR,'write':(),'checks':['(source_id IS NULL) <> (document_id IS NULL)'],
    'indexes':["CREATE INDEX idx_knowledge_chunks_tsv ON {t} USING gin(tsv)",HNSW%('embeddings','embeddings','embeddings')]}),
 ('knowledge_citations','cues',[pk('knowledge_citation_id'),c('source_id',U,'fk:knowledge_sources.knowledge_source_id,cascade'),c('user_id',U,'fk:client_users.client_user_id,n,setnull'),c('meeting_id',U,'fk:meetings.meeting_id,n,setnull'),
   c('used_by',T,'','enum:ask_ai|ai_chat|live_assist|mock|practice'),created('cited_at')],[],{'rls':('child','knowledge_sources','source_id')}),

 # ================= practice =================
 ('practice_catalog','practice',[pk('practice_catalog_id'),c('client_id',U,'fk:clients.client_id,n,cascade','null = platform catalogue'),c('title'),c('category'),c('description',T,'n'),
   c('recommended_minutes',I,'n'),c('level',T,'','enum:Foundational|Advanced|Mastery'),c('default_prompts',I,'','','5'),c('default_interval_sec',I,'','','30'),
   c('sample_prompts',J,'','list of prompt strings','\'[]\''),c('active',B,'','','true'),created(),updated()],[],
   {'rls':'custom','policies':[
     "CREATE POLICY practice_catalog_select ON practice_catalog FOR SELECT USING (client_id IS NULL OR client_id = app_client_id())",
     "CREATE POLICY practice_catalog_write ON practice_catalog FOR ALL USING ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin')) WITH CHECK ((client_id IS NULL AND app_role() = 'super_admin') OR (client_id = app_client_id() AND app_role() = 'client_admin'))"]}),
 ('practice_lessons','practice',[pk('practice_lesson_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','rep who practises'),c('created_by',U,'fk:client_users.client_user_id','rep or manager'),
   c('meeting_id',U,'fk:meetings.meeting_id,n'),c('lead_id',U,'fk:leads.lead_id,n'),c('origin',T,'','enum:meeting|lead'),c('method',T,'','enum:checklist|ai'),c('title'),c('context',T,'n'),
   created(),updated()],[],
   {'rls':('owner','client_user_id'),
    'checks':["(origin = 'meeting' AND meeting_id IS NOT NULL) OR (origin = 'lead' AND lead_id IS NOT NULL)"]}),
 ('practice_lesson_cues','practice',[c('lesson_id',U,'pk,fk:practice_lessons.practice_lesson_id,cascade'),c('cue_id',U,'pk,fk:cues.cue_id')],[],{'rls':('child','practice_lessons','lesson_id')}),
 ('practice_programs','practice',[pk('practice_program_id'),c('lead_id',U,'fk:leads.lead_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','the rep being practised'),
   c('status',T,'','enum:ready_to_start|in_progress|completed','\'ready_to_start\''),c('progress_pct',I,'','','0'),created(),updated()],[['lead_id','client_user_id']],
   {'rls':('owner','client_user_id'),'checks':['progress_pct BETWEEN 0 AND 100']}),
 ('practice_program_meetings','practice',[c('program_id',U,'pk,fk:practice_programs.practice_program_id,cascade'),c('meeting_id',U,'pk,fk:meetings.meeting_id,cascade')],[],
   {'rls':('child','practice_programs','program_id')}),
 ('practice_program_lessons','practice',[pk('practice_program_lesson_id'),c('program_id',U,'fk:practice_programs.practice_program_id,cascade'),c('position',I),c('title'),c('objective'),c('relevance_to_deal',T,'n'),
   c('evidence_meeting_id',U,'fk:meetings.meeting_id,n,setnull','the call the lesson comes from'),c('tailored_explanation',T,'n'),c('talk_track',J,'','list of talk-track lines','\'[]\''),
   c('practice_activity',T,'n'),c('practice_scenario',T,'n','the buyer line the rep replies to'),c('expected_outcome',T,'n'),c('completed',B,'','','false'),c('completed_at',TS,'n'),created()],
   [['program_id','position']],{'client_unique':False,'rls':('child','practice_programs','program_id')}),
 ('practice_attempts','practice',[pk('practice_attempt_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade'),c('lesson_id',U,'fk:practice_lessons.practice_lesson_id,n,cascade'),
   c('program_lesson_id',U,'fk:practice_program_lessons.practice_program_lesson_id,n,cascade'),c('turn_no',I),c('response'),c('score',I,'','0-100'),created()],[],
   {'rls':('owner','client_user_id'),'checks':['(lesson_id IS NULL) <> (program_lesson_id IS NULL)','score BETWEEN 0 AND 100']}),
 ('lesson_feedback','practice',[pk('lesson_feedback_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade','the rep who practised'),c('manager_id',U,'fk:client_users.client_user_id','who wrote the feedback'),
   c('lesson_id',U,'fk:practice_lessons.practice_lesson_id,n,cascade'),c('program_lesson_id',U,'fk:practice_program_lessons.practice_program_lesson_id,n,cascade'),c('feedback'),created()],[],
   {'rls':('owner','client_user_id'),'checks':['(lesson_id IS NULL) <> (program_lesson_id IS NULL)']}),
 ('mock_meetings','practice',[pk('mock_meeting_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade'),c('source_meeting_id',U,'fk:meetings.meeting_id,n','must be an analysed call'),c('buyer_name'),c('buyer_role',T,'n'),
   c('roleplay_type'),c('domain',T,'n'),created('started_at'),c('duration_sec',I,'n'),c('score',I,'n','0-100'),c('summary',T,'n'),c('talk_listen_ratio',T,'n'),
   c('fillers_per_min',N,'n'),c('words_per_min',I,'n'),c('longest_monologue',T,'n'),c('rescore_status',T,'','enum:idle|processing|rescored','\'idle\'')],[],
   {'rls':('owner','client_user_id'),'checks':['score IS NULL OR score BETWEEN 0 AND 100']}),
 ('mock_meeting_focus_cues','practice',[c('mock_meeting_id',U,'pk,fk:mock_meetings.mock_meeting_id,cascade'),c('cue_id',U,'pk,fk:cues.cue_id')],[],{'rls':('child','mock_meetings','mock_meeting_id')}),
 ('mock_meeting_points','practice',[pk('mock_meeting_point_id'),c('mock_meeting_id',U,'fk:mock_meetings.mock_meeting_id,cascade'),c('kind',T,'','enum:went_well|to_improve'),c('body')],[],{'rls':('child','mock_meetings','mock_meeting_id')}),
 ('live_assist_sessions','practice',[pk('live_assist_session_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade'),c('meeting_id',U,'fk:meetings.meeting_id,n','analysed call it was prepared from'),created('started_at'),
   c('ended_at',TS,'n'),c('notes',T,'n'),c('status',T,'','enum:active|ended','\'active\'')],[],
   {'rls':('owner','client_user_id')}),

 # ================= automation & AI =================
 ('automations','ai',[pk('automation_id'),client(),c('created_by',U,'fk:client_users.client_user_id'),c('name'),c('description',T,'n'),c('trigger_event'),c('condition',T,'n'),c('action'),
   c('category',T,'','enum:Summary|Prompt|Email|Diagnostic'),c('status',T,'','enum:Active|Draft|Paused','\'Draft\''),c('runs_count',I,'','','0'),c('last_run_at',TS,'n'),created(),updated()],
   [],{'tfk':[('created_by','client_users')],'rls':'client','read':ALLR,'write':ADMGR,
    'indexes':["CREATE UNIQUE INDEX uq_automations_name ON {t}(client_id, name) WHERE deleted_at IS NULL"]}),
 ('automation_runs','ai',[pk('automation_run_id'),c('automation_id',U,'fk:automations.automation_id,cascade'),c('meeting_id',U,'fk:meetings.meeting_id,n,setnull'),c('lead_id',U,'fk:leads.lead_id,n,setnull'),
   c('status',T,'','enum:success|failed'),c('output',T,'n'),created('ran_at')],[],{'rls':('child','automations','automation_id')}),
 ('chat_threads','ai',[pk('chat_thread_id'),c('client_user_id',U,'fk:client_users.client_user_id,cascade'),c('lead_id',U,'fk:leads.lead_id,n','set when asked from a lead'),c('title',T,'n'),created(),updated()],[],
   {'rls':('user','client_user_id')}),
 ('chat_messages','ai',[pk('chat_message_id'),c('thread_id',U,'fk:chat_threads.chat_thread_id,cascade'),c('role',T,'','enum:user|assistant'),c('body','text','','what the user sees'),c('raw_text',T,'n','assistant messages only: the model\'s reply exactly as returned. Never set on user messages, so their text is not stored twice'),
   c('citations',J,'n','knowledge source ids'),c('model',T,'n'),tags(),*embed_cols('embeddings','the message'),
   c('input_tokens',I,'n'),c('output_tokens',I,'n'),created()],[],
   {'rls':('child','chat_threads','thread_id'),'checks':TAGCHK+["raw_text IS NULL OR role = 'assistant'"],
    'indexes':["CREATE INDEX idx_chat_messages_thread_time ON {t}(thread_id, created_at)",GINTAGS,HNSW%('embeddings','embeddings','embeddings')]}),
]

# ---- Standard columns -----------------------------------------------------------------------------------------
# Added to the tables below by with_standard_columns(), so every table does not repeat them. Edit STANDARD, then regenerate.
#   created_at   every table
#   updated_at   every table whose rows can change (not ledgers, logs and link tables). A trigger sets it.
#   created_by / updated_by / deleted_by   who did it, a client user, or a platform owner on platform tables. Filled in by a
#                trigger from the session, never by the API. Empty when a sync, an import or an AI job did it, and when a super
#                admin acted inside a company (that goes to platform_audit_log).
#   deleted_at / deleted_by   only on tables whose rows are hidden instead of removed
# STANDARD letters: c = created_by, u = updated_by, d = deleted_by (the table already has deleted_at),
#                   D = soft delete: adds deleted_at and deleted_by
STANDARD = {
 'plans':'cu', 'platform_limits':'cu',
 'clients':'u', 'client_users':'cud', 'invitations':'u', 'integrations':'cu', 'crm_stage_mappings':'cu',
 'leads':'cud', 'lead_stakeholders':'cu', 'lead_risks':'cu', 'lead_timeline_events':'u',
 'media_files':'ud', 'meetings':'cud', 'cues':'cD',
 'knowledge_sources':'ud', 'company_documents':'ud',
 'practice_catalog':'cu', 'practice_lessons':'uD', 'practice_programs':'cu', 'lesson_feedback':'u', 'mock_meetings':'D',
 'automations':'uD', 'chat_threads':'D',
}
PLATFORM_ACTOR = {'plans', 'platform_limits'}          # their *_by columns point at platform_owner_users
NO_UPDATED_AT = {                                     # rows are never changed after they are written
 'platform_audit_log', 'audit_log', 'credit_transactions',                      # append-only ledgers and logs
 'plan_features', 'transcript_segment_cues', 'practice_lesson_cues', 'practice_program_meetings', 'mock_meeting_focus_cues',  # link tables
 'knowledge_citations', 'practice_attempts', 'automation_runs',                 # one row per event
}
def _by(name, platform):
    ref = 'platform_owner_users.platform_owner_user_id' if platform else 'client_users.client_user_id'
    who = 'platform owner' if platform else 'client user'
    what = {'created_by': 'created the row', 'updated_by': 'last changed the row', 'deleted_by': 'deleted the row'}[name]
    return c(name, U, f'fk:{ref},n,setnull,noidx', f'the {who} who {what}; empty when the system did it')
def with_standard_columns(tables):
    out = []
    for t in tables:
        name, dom, cols, uqs, *rest = t
        opts = dict(rest[0]) if rest else {}
        have = {x[0] for x in cols}
        flags, plat = STANDARD.get(name, ''), name in PLATFORM_ACTOR
        extra = []
        if 'created_at' not in have: extra.append(created())
        if 'c' in flags and 'created_by' not in have: extra.append(_by('created_by', plat))
        if name not in NO_UPDATED_AT and 'updated_at' not in have: extra.append(updated())
        if 'u' in flags and 'updated_by' not in have: extra.append(_by('updated_by', plat))
        if 'D' in flags and 'deleted_at' not in have: extra.append(deleted())
        if ('deleted_at' in have or 'D' in flags) and ('d' in flags or 'D' in flags) and 'deleted_by' not in have:
            extra.append(_by('deleted_by', plat))
            opts['checks'] = list(opts.get('checks', [])) + ['deleted_by IS NULL OR deleted_at IS NOT NULL']
        out.append((name, dom, list(cols) + extra, uqs, opts))
    return out
TABLES = with_standard_columns(_TABLES)
