# Single source of truth for the SellMore database. generate.py turns this into schema.sql,
# schema.json and the diagram data in er-diagram.html.
#
# Column:  c(name, type, flags, note, default)
#   flags: pk | n (nullable) | uq | fk:table.col  plus  cascade | setnull for the ON DELETE action
#   note:  'enum:a|b|c' adds a CHECK; 'gen:EXPR' makes a stored generated column; anything else is a comment
# Table:   (name, domain, columns, [unique column lists], options)
#   options:
#     tenant_unique : adds UNIQUE (tenant_id, id) so other tables can reference it with a same-tenant composite FK
#     tfk           : [(col, parent_table[, parent_col])]  composite FK (tenant_id, col) -> parent(tenant_id, parent_col).
#                     A row can then never point at another company's row, even through a bug.
#     checks        : extra CHECK expressions
#     indexes       : extra index statements ({t} = table name)
#     rls           : 'tenant' | ('owner', col) | ('user', col) | ('child', parent, fkcol) | 'platform' | 'locked' | 'custom'
#     read / write  : role tuples for 'tenant' mode. write=() means the API cannot write (workers do).
#     append_only   : INSERT and SELECT only, UPDATE/DELETE blocked by grants and a trigger
#     policies      : raw CREATE POLICY statements for rls='custom'
U='uuid'; T='text'; TS='timestamptz'; I='int'; BI='bigint'; N='numeric(12,2)'; B='boolean'; D='date'; J='jsonb'
BY='bytea'; TV='tsvector'; INET='inet'
# Embeddings: pgvector halfvec (2 bytes per number). The size is fixed in each column, so it is set once here.
# Change EMBED_DIM to match the embedding model you pick, then regenerate.
EMBED_DIM = 1536
VEC = f'halfvec({EMBED_DIM})'
def c(name,typ=T,flags='',note='',default=''): return (name,typ,flags,note,default)
def pk(): return c('id',U,'pk','','gen_random_uuid()')
def tenant(): return c('tenant_id',U,'fk:tenants.id,cascade')
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
 'platform':'Platform (super admin)', 'identity':'Tenants & people', 'billing':'Billing & credits',
 'integrations':'Integrations', 'leads':'Leads', 'meetings':'Meetings & analysis',
 'cues':'Cues & knowledge', 'practice':'Practice & coaching', 'ai':'Automation & AI'
}
ADMIN=('client_admin',); ADMGR=('client_admin','manager'); ALLR=('client_admin','manager','sales_rep')

TABLES = [
 # ================= platform =================
 ('plans','platform',[c('id',T,'pk','enum:free|starter|growth|enterprise'),c('name'),c('price_monthly',N,'','','0'),c('currency',T,'','','\'USD\''),
   c('seat_limit',I,'n','null = unlimited'),c('meeting_quota',I,'n','null = unlimited'),c('monthly_credits',I,'','','0'),
   c('active',B,'','','true'),c('sort_order',I,'','','0'),created(),updated()],[],
   {'rls':'platform','checks':['price_monthly >= 0','seat_limit IS NULL OR seat_limit > 0','monthly_credits >= 0']}),
 ('plan_features','platform',[c('plan_id',T,'pk,fk:plans.id,cascade'),c('feature_key',T,'pk','e.g. live_assist, crm_sync, mock_meetings')],[],{'rls':'platform'}),
 ('platform_limits','platform',[c('id',I,'pk','always 1 (single row)'),c('formats',T,'','MP4, MP3, TXT','\'MP4, MP3, TXT\''),c('max_file_size_mb',I,'','','2048'),
   c('max_duration_min',I,'','','240'),c('invite_expiry_hours',I,'','','48'),c('updated_by',U,'fk:users.id,n,setnull'),updated()],[],
   {'rls':'platform','checks':['id = 1','max_file_size_mb > 0','max_duration_min > 0','invite_expiry_hours > 0']}),
 ('platform_audit_log','platform',[pk(),c('actor_id',U,'fk:users.id'),c('tenant_id',U,'fk:tenants.id,n,setnull'),c('action',T),c('detail',T,'n'),created()],[],
   {'rls':'platform','append_only':True}),

 # ================= tenants & people =================
 ('tenants','identity',[pk(),c('name',T,'uq'),c('slug',T,'uq','url-safe short name'),c('plan_id',T,'fk:plans.id'),
   c('status',T,'','enum:active|suspended','\'active\''),c('renewal_date',D,'n','null on the free plan'),c('credit_balance',I,'','changed only by consume_credits / grant_credits','0'),
   c('timezone',T,'','matters for scheduled imports and summaries','\'UTC\''),c('recording_retention_days',I,'','how long audio is kept','365'),
   c('billing_customer_id',T,'n','payment provider customer id'),c('notes',T,'n'),created(),updated(),deleted()],[],
   {'rls':'custom','checks':['credit_balance >= 0','recording_retention_days > 0','slug ~ \'^[a-z0-9][a-z0-9-]*$\''],
    'policies':[
     "CREATE POLICY tenants_select ON tenants FOR SELECT USING (app_role() = 'super_admin' OR id = app_tenant_id())",
     "CREATE POLICY tenants_insert ON tenants FOR INSERT WITH CHECK (app_role() = 'super_admin')",
     "CREATE POLICY tenants_update ON tenants FOR UPDATE USING (app_role() = 'super_admin' OR (id = app_tenant_id() AND app_role() = 'client_admin')) WITH CHECK (app_role() = 'super_admin' OR (id = app_tenant_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY tenants_delete ON tenants FOR DELETE USING (app_role() = 'super_admin')"]}),
 ('users','identity',[pk(),c('tenant_id',U,'fk:tenants.id,n,cascade','null only for super_admin'),c('manager_id',U,'fk:users.id,n','reps only: their one manager'),
   c('name'),c('email',T,'uq','always stored lower case'),c('role',T,'','enum:super_admin|client_admin|manager|sales_rep'),c('title',T,'n'),c('avatar_url',T,'n'),
   c('status',T,'','enum:active|inactive','\'active\''),c('crm_user_id',T,'n','Salesforce user id, matched by email on connect'),
   c('phone_extension',T,'n','phone system extension, files calls under this person'),c('last_login_at',TS,'n'),created(),updated(),deleted()],
   [['tenant_id','crm_user_id'],['tenant_id','phone_extension']],
   {'tenant_unique':True,'tfk':[('manager_id','users')],'rls':'custom',
    'checks':['email = lower(email)','(role = \'super_admin\') = (tenant_id IS NULL)','manager_id IS NULL OR role = \'sales_rep\'','manager_id IS DISTINCT FROM id'],
    'policies':[
     "CREATE POLICY users_select ON users FOR SELECT USING (app_role() = 'super_admin' OR tenant_id = app_tenant_id())",
     "CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (app_role() = 'super_admin' OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY users_update ON users FOR UPDATE USING (app_role() = 'super_admin' OR (tenant_id = app_tenant_id() AND (app_role() = 'client_admin' OR id = app_user_id()))) WITH CHECK (app_role() = 'super_admin' OR (tenant_id = app_tenant_id() AND (app_role() = 'client_admin' OR id = app_user_id())))",
     "CREATE POLICY users_delete ON users FOR DELETE USING (app_role() = 'super_admin')"]}),
 ('auth_identities','identity',[pk(),c('user_id',U,'fk:users.id,cascade'),c('provider',T,'','enum:password|google|microsoft|saml|oidc'),c('subject',T,'','provider user id, or the email for password'),
   c('password_hash',T,'n','argon2id, never plain text'),c('mfa_enabled',B,'','','false'),c('last_used_at',TS,'n'),created()],[['provider','subject']],
   {'rls':'locked','checks':["provider <> 'password' OR password_hash IS NOT NULL"]}),
 ('invitations','identity',[pk(),tenant(),c('email'),c('role',T,'','enum:manager|sales_rep'),c('manager_id',U,'fk:users.id,n','reps only'),c('invited_by',U,'fk:users.id'),
   c('token_hash',T,'uq','hash of the emailed link token'),c('status',T,'','enum:pending|accepted|expired|revoked','\'pending\''),c('expires_at',TS),c('accepted_at',TS,'n'),
   c('accepted_user_id',U,'fk:users.id,n,setnull'),created()],[],
   {'tfk':[('manager_id','users'),('invited_by','users')],'rls':'tenant','read':ADMGR,'write':ADMGR,
    'checks':['email = lower(email)','manager_id IS NULL OR role = \'sales_rep\''],
    'indexes':["CREATE UNIQUE INDEX uq_invitations_pending ON {t}(tenant_id, email) WHERE status = 'pending'"]}),
 ('manager_assignments','identity',[pk(),tenant(),c('rep_id',U,'fk:users.id'),c('manager_id',U,'fk:users.id,n','null = unassigned'),c('assigned_by',U,'fk:users.id,n,setnull','null = system'),
   created('started_at'),c('ended_at',TS,'n','null = current')],[],
   {'tfk':[('rep_id','users'),('manager_id','users')],'rls':'tenant','read':ADMGR,'write':(),
    'indexes':["CREATE UNIQUE INDEX uq_manager_assignments_current ON {t}(rep_id) WHERE ended_at IS NULL"]}),
 ('notifications','identity',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('type'),c('body'),c('link',T,'n'),c('read_at',TS,'n'),created()],[],
   {'tfk':[('user_id','users')],'rls':('user','user_id')}),
 ('audit_log','identity',[pk(),tenant(),c('actor_id',U,'fk:users.id,n,setnull'),c('action',T,'','e.g. user.role_changed, rep.reassigned, integration.connected'),
   c('entity_type',T,'n'),c('entity_id',U,'n'),c('detail',J,'n','before / after values'),c('ip',INET,'n'),created()],[],
   {'rls':'tenant','read':ADMIN,'write':ALLR,'append_only':True}),

 # ================= billing =================
 ('credit_transactions','billing',[pk(),tenant(),c('user_id',U,'fk:users.id,n,setnull'),c('activity'),c('kind',T,'','enum:consume|grant|refund|adjust','\'consume\''),
   c('credits_consumed',I,'','negative = credits added'),c('balance_after',I),c('ref_type',T,'n','e.g. meeting, mock_meeting'),c('ref_id',U,'n'),
   c('idempotency_key',T,'n','a retried request cannot charge twice'),created()],[['tenant_id','idempotency_key']],
   {'rls':'tenant','read':ADMIN,'write':(),'append_only':True,'checks':['credits_consumed <> 0','balance_after >= 0']}),
 ('invoices','billing',[pk(),tenant(),c('amount',N),c('currency',T,'','','\'USD\''),c('purpose'),c('status',T,'','enum:paid|processing|failed'),
   c('provider_invoice_id',T,'n'),created('issued_at'),c('paid_at',TS,'n'),c('pdf_url',T,'n')],[['tenant_id','provider_invoice_id']],
   {'rls':'tenant','read':ADMIN,'write':(),'checks':['amount >= 0']}),

 # ================= integrations =================
 ('integrations','integrations',[pk(),tenant(),c('type',T,'','enum:crm|drive'),c('provider',T,'','salesforce | google_drive'),
   c('status',T,'','enum:connected|disconnected|error','\'disconnected\''),c('org_name',T,'n'),c('provider_org_id',T,'n','Salesforce org id, to catch a wrong-org connect'),
   c('folder_id',T,'n','Drive folder id'),c('folder',T,'n','Drive folder name, e.g. Call recordings'),
   c('sync_interval',T,'','enum:manual|15m|30m|1h|6h|12h|24h','\'1h\''),c('last_sync_at',TS,'n'),c('last_sync_result',T,'n'),c('next_sync_at',TS,'n'),
   c('sync_cursor',T,'n','last change seen, so a sync only fetches what is new'),c('connected_by',U,'fk:users.id,n,setnull'),c('connected_at',TS,'n'),created(),updated()],[['tenant_id','type']],
   {'tenant_unique':True,'tfk':[('connected_by','users')],'rls':'tenant','read':ALLR,'write':ADMIN,
    'indexes':["CREATE INDEX idx_integrations_due ON {t}(next_sync_at) WHERE status = 'connected' AND sync_interval <> 'manual'"]}),
 ('integration_credentials','integrations',[c('integration_id',U,'pk,fk:integrations.id,cascade'),c('access_token_enc',BY,'n','encrypted with a KMS key, never plain text'),
   c('refresh_token_enc',BY,'n'),c('instance_url',T,'n'),c('scopes',T,'n'),c('expires_at',TS,'n'),c('key_version',I,'','','1'),updated()],[],{'rls':'locked'}),
 ('integration_sync_runs','integrations',[pk(),tenant(),c('integration_id',U,'fk:integrations.id,cascade'),c('trigger_kind',T,'','enum:manual|schedule|webhook'),
   c('status',T,'','enum:running|success|partial|failed','\'running\''),created('started_at'),c('finished_at',TS,'n'),c('items_found',I,'','','0'),c('items_imported',I,'','','0'),
   c('items_failed',I,'','','0'),c('error',T,'n')],[],
   {'tfk':[('integration_id','integrations')],'rls':'tenant','read':ADMGR,'write':(),
    'indexes':["CREATE INDEX idx_integration_sync_runs_recent ON {t}(integration_id, started_at DESC)"]}),
 ('integration_events','integrations',[pk(),tenant(),c('integration_id',U,'fk:integrations.id,cascade'),c('provider_event_id',T,'','Salesforce replay id, makes webhooks idempotent'),
   c('event_type'),c('payload',J),created('received_at'),c('processed_at',TS,'n'),c('error',T,'n')],[['integration_id','provider_event_id']],
   {'tfk':[('integration_id','integrations')],'rls':'locked'}),
 ('crm_stage_mappings','integrations',[pk(),tenant(),c('crm_stage','text','','stage name exactly as Salesforce reports it'),
   c('sellmore_stage',T,'','enum:Discovery|Technical Review|Commercial Proposal|Negotiation|Closed Won|Closed Lost')],[['tenant_id','crm_stage']],
   {'rls':'tenant','read':ALLR,'write':ADMIN}),
 ('crm_activities','integrations',[pk(),tenant(),c('integration_id',U,'fk:integrations.id,cascade'),c('external_id',T,'','Salesforce Task / Event id'),
   c('kind',T,'','enum:call|meeting','\'call\''),c('subject'),c('description',T,'n','holds the 5-line AI call summary'),c('direction',T,'n','enum:inbound|outbound'),
   c('outcome',T,'n','answered | missed | voicemail | no_answer'),c('phone_number',T,'n'),c('started_at',TS,'n'),c('duration_sec',I,'n'),
   c('who_type',T,'n','enum:Contact|Lead'),c('who_id',T,'n','Salesforce Contact or Lead id'),c('what_type',T,'n','enum:Opportunity|Account'),
   c('what_id',T,'n','Opportunity id (WhatId), null when the call has none'),c('account_name',T,'n'),c('owner_crm_id',T,'n'),
   c('owner_user_id',U,'fk:users.id,n,setnull','resolved from owner_crm_id or the phone extension'),c('recording_url',T,'n','link to the original recording in the phone system'),
   c('raw',J,'n','untouched Salesforce payload'),c('synced_at',TS,'','','now()'),created()],[['tenant_id','external_id']],
   {'tfk':[('integration_id','integrations'),('owner_user_id','users')],'rls':('owner','owner_user_id'),'write':(),
    'indexes':["CREATE INDEX idx_crm_activities_phone ON {t}(tenant_id, phone_number)","CREATE INDEX idx_crm_activities_what ON {t}(tenant_id, what_id)"]}),

 # ================= leads =================
 ('leads','leads',[pk(),tenant(),c('owner_id',U,'fk:users.id'),c('name'),c('company_name'),
   c('stage',T,'','enum:Discovery|Technical Review|Commercial Proposal|Negotiation|Closed Won|Closed Lost'),c('source',T,'','enum:crm|draft'),
   c('crm_system',T,'n'),c('crm_id',T,'n','Salesforce Opportunity id'),c('raw_stage',T,'n','stage name exactly as Salesforce reports it'),
   c('owner_crm_id',T,'n'),c('crm_account_id',T,'n'),c('amount',N,'n'),c('currency',T,'','','\'USD\''),c('close_date',D,'n'),c('next_meeting_at',TS,'n'),
   c('last_meeting_at',TS,'n','kept up to date by a trigger'),c('stage_changed_at',TS,'','drives "days in stage"','now()'),c('crm_last_synced_at',TS,'n'),created(),updated(),deleted()],[['tenant_id','crm_id']],
   {'tenant_unique':True,'tfk':[('owner_id','users')],'rls':('owner','owner_id'),
    'checks':["(source = 'crm') = (crm_id IS NOT NULL)",'amount IS NULL OR amount >= 0'],
    'indexes':["CREATE INDEX idx_leads_tenant_stage ON {t}(tenant_id, stage) WHERE deleted_at IS NULL"]}),
 ('lead_stakeholders','leads',[pk(),c('lead_id',U,'fk:leads.id,cascade'),c('name'),c('role',T,'n'),c('company',T,'n'),c('email',T,'n'),
   c('crm_contact_id',T,'n','Opportunity Contact Role is per opportunity, contacts are never merged across deals'),
   c('sentiment',T,'','enum:Champion|Neutral|Skeptic|Decision Maker'),c('last_spoke_at',TS,'n')],[['lead_id','crm_contact_id']],{'rls':('child','leads','lead_id')}),
 ('lead_timeline_events','leads',[pk(),c('lead_id',U,'fk:leads.id,cascade'),c('meeting_id',U,'fk:meetings.id,n,setnull'),c('author_id',U,'fk:users.id,n,setnull'),
   c('type',T,'','enum:meeting|email|stage_change|note'),c('title'),c('description',T,'n'),c('occurred_at',TS)],[],
   {'rls':('child','leads','lead_id'),'indexes':["CREATE INDEX idx_lead_timeline_events_feed ON {t}(lead_id, occurred_at DESC)"]}),
 ('lead_risks','leads',[pk(),c('lead_id',U,'fk:leads.id,cascade'),c('text'),created('detected_at'),c('resolved_at',TS,'n')],[],{'rls':('child','leads','lead_id')}),

 # ================= meetings & analysis =================
 ('media_files','meetings',[pk(),tenant(),c('uploaded_by',U,'fk:users.id,n,setnull','null for files fetched from Drive'),c('source',T,'','enum:upload|drive'),
   c('drive_file_id',T,'n'),c('drive_file_name',T,'n','file name, used to match the audio to a CRM call'),c('storage_key',T,'','object store key of our copy'),
   c('file_format',T,'n','enum:MP4|MP3|TXT'),c('mime_type',T,'n'),c('size_bytes',BI,'n'),c('duration_sec',I,'n'),c('checksum_sha256',T,'n'),
   c('retention_until',TS,'n','audio is deleted after this date'),created(),deleted()],[['tenant_id','drive_file_id']],
   {'tenant_unique':True,'tfk':[('uploaded_by','users')],'rls':'custom',
    'checks':["(source = 'drive') = (drive_file_id IS NOT NULL)",'size_bytes IS NULL OR size_bytes >= 0'],
    'indexes':["CREATE INDEX idx_media_files_retention ON {t}(retention_until) WHERE deleted_at IS NULL"],
    'policies':[
     "CREATE POLICY media_files_select ON media_files FOR SELECT USING (tenant_id = app_tenant_id() AND (app_role() = 'client_admin' OR EXISTS (SELECT 1 FROM meetings m WHERE m.media_file_id = media_files.id)))",
     "CREATE POLICY media_files_insert ON media_files FOR INSERT WITH CHECK (tenant_id = app_tenant_id() AND (app_role() = 'client_admin' OR uploaded_by = app_user_id()))",
     "CREATE POLICY media_files_update ON media_files FOR UPDATE USING (tenant_id = app_tenant_id() AND (app_role() = 'client_admin' OR uploaded_by = app_user_id()))",
     "CREATE POLICY media_files_delete ON media_files FOR DELETE USING (tenant_id = app_tenant_id() AND app_role() = 'client_admin')"]}),
 ('meetings','meetings',[pk(),tenant(),c('rep_id',U,'fk:users.id'),c('lead_id',U,'fk:leads.id,n','null = call without a lead'),
   c('integration_id',U,'fk:integrations.id,n','where it was fetched from'),c('media_file_id',U,'fk:media_files.id,n','null while the audio has not arrived yet'),
   c('crm_activity_id',T,'fk:crm_activities.external_id,n','Salesforce Task / Event id, blocks duplicate imports'),c('crm_opportunity_id',T,'n'),
   c('name'),c('source',T,'','enum:upload|crm|drive'),c('source_detail',T,'n'),c('meeting_at',TS,'n','when the call happened'),created('uploaded_at'),c('duration_sec',I,'n'),
   c('processing_status',T,'','enum:awaiting_audio|queued|transcribing|analysing|analysed|failed|unmatched','\'queued\''),c('failure_reason',T,'n'),
   c('match_status',T,'n','enum:matched|unmatched|ambiguous'),c('overall_score',I,'n','0-100'),c('summary',T,'n'),c('language',T,'n'),tags(),*embed_cols('summary_embeddings','the summary, to find similar calls'),
   c('analysed_at',TS,'n'),updated(),deleted()],
   [['tenant_id','crm_activity_id'],['tenant_id','media_file_id']],
   {'tenant_unique':True,'tfk':[('rep_id','users'),('lead_id','leads'),('integration_id','integrations'),('media_file_id','media_files'),('crm_activity_id','crm_activities','external_id')],
    'no_auto_idx':['rep_id'],'rls':('owner','rep_id'),
    'checks':['overall_score IS NULL OR overall_score BETWEEN 0 AND 100',"source <> 'upload' OR media_file_id IS NOT NULL","source <> 'crm' OR crm_activity_id IS NOT NULL","source <> 'drive' OR media_file_id IS NOT NULL"]+TAGCHK,
    'indexes':["CREATE INDEX idx_meetings_tenant_rep ON {t}(tenant_id, rep_id, uploaded_at DESC) WHERE deleted_at IS NULL",
               "CREATE INDEX idx_meetings_lead_time ON {t}(lead_id, meeting_at DESC) WHERE deleted_at IS NULL",
               "CREATE INDEX idx_meetings_pending ON {t}(tenant_id, processing_status) WHERE processing_status NOT IN ('analysed','failed')",
               GINTAGS,HNSW%('summary_embeddings','summary_embeddings','summary_embeddings')]}),
 ('analysis_runs','meetings',[pk(),c('meeting_id',U,'fk:meetings.id,cascade'),c('kind',T,'','enum:transcription|analysis|rescore'),
   c('status',T,'','enum:queued|running|success|failed','\'queued\''),c('model',T,'n'),c('prompt_version',T,'n'),c('input_tokens',I,'n'),c('output_tokens',I,'n'),
   c('credits_charged',I,'','','0'),c('raw_output',J,'n','the model\'s full reply as returned, for audit and re-parsing. Cleared when the recording expires'),
   c('started_at',TS,'n'),c('finished_at',TS,'n'),c('error',T,'n'),created()],[],{'rls':('child','meetings','meeting_id')}),
 ('meeting_insights','meetings',[pk(),c('meeting_id',U,'fk:meetings.id,cascade'),c('kind',T,'','enum:went_well|struggled|could_be_better|next_step'),c('body'),c('position',I)],[],
   {'rls':('child','meetings','meeting_id')}),
 ('meeting_cue_scores','meetings',[pk(),c('meeting_id',U,'fk:meetings.id,cascade'),c('cue_id',U,'fk:cues.id'),c('score',N,'n','0-5'),c('is_assessable',B),
   c('observation',T,'n'),c('improvement',T,'n'),c('evidence',T,'n'),c('evidence_segment_id',U,'fk:transcript_segments.id,n,setnull','the exact transcript line the evidence is from'),
   c('severity',T,'n','enum:critical|warning|positive')],[['meeting_id','cue_id']],
   {'rls':('child','meetings','meeting_id'),'checks':['score IS NULL OR score BETWEEN 0 AND 5']}),
 ('meeting_objections','meetings',[pk(),c('meeting_id',U,'fk:meetings.id,cascade'),c('segment_id',U,'fk:transcript_segments.id,n,setnull','the buyer line it points at'),
   c('at_ms',I),c('objection'),c('category',T,'n','enum:price|timing|authority|competitor|technical|risk|other'),c('rep_response',T,'n'),
   c('status',T,'','enum:Resolved|Partially Resolved|Unresolved'),c('stronger_response',T,'n')],[],
   {'rls':('child','meetings','meeting_id')}),
 ('transcript_segments','meetings',[pk(),c('meeting_id',U,'fk:meetings.id,cascade'),c('seq',I),c('speaker'),c('speaker_role',T,'','enum:rep|prospect'),
   c('start_ms',I),c('end_ms',I,'n'),c('text',T,'','cleaned text, what users read'),
   c('raw_text',T,'n','speech-to-text output exactly as returned, before cleanup. Cleared when the recording expires'),
   c('language',T,'n'),c('asr_confidence','numeric(4,3)','n','0 to 1, from the speech-to-text engine'),tags(),
   *embed_cols('embeddings','this turn'),c('tsv',TV,'n',"gen:to_tsvector('english', text)")],[['meeting_id','seq']],
   {'rls':('child','meetings','meeting_id'),'checks':TAGCHK+['asr_confidence IS NULL OR asr_confidence BETWEEN 0 AND 1'],
    'indexes':["CREATE INDEX idx_transcript_segments_tsv ON {t} USING gin(tsv)","CREATE INDEX idx_transcript_segments_time ON {t}(meeting_id, start_ms)",GINTAGS,HNSW%('embeddings','embeddings','embeddings')]}),
 ('transcript_segment_cues','meetings',[c('segment_id',U,'pk,fk:transcript_segments.id,cascade'),c('cue_id',U,'pk,fk:cues.id')],[],
   {'rls':('child','transcript_segments','segment_id')}),

 # ================= cues & knowledge =================
 ('cues','cues',[pk(),c('tenant_id',U,'fk:tenants.id,n,cascade','null = platform default'),c('code',I,'n','1-12 on platform defaults'),
   c('overrides_cue_id',U,'fk:cues.id,n','company copy replacing a default'),c('name'),c('category'),c('description',T,'n'),c('instructions'),c('enabled',B,'','','true'),
   c('updated_by',U,'fk:users.id,n,setnull'),updated()],[],
   {'rls':'custom','checks':['tenant_id IS NOT NULL OR code IS NOT NULL','overrides_cue_id IS NULL OR tenant_id IS NOT NULL','code IS NULL OR code BETWEEN 1 AND 12'],
    'indexes':["CREATE UNIQUE INDEX uq_cues_default_code ON {t}(code) WHERE tenant_id IS NULL","CREATE UNIQUE INDEX uq_cues_one_override ON {t}(tenant_id, overrides_cue_id) WHERE overrides_cue_id IS NOT NULL"],
    'policies':[
     "CREATE POLICY cues_select ON cues FOR SELECT USING (tenant_id IS NULL OR tenant_id = app_tenant_id())",
     "CREATE POLICY cues_insert ON cues FOR INSERT WITH CHECK ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY cues_update ON cues FOR UPDATE USING ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin')) WITH CHECK ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin'))",
     "CREATE POLICY cues_delete ON cues FOR DELETE USING ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin'))"]}),
 ('knowledge_sources','cues',[pk(),tenant(),c('created_by',U,'fk:users.id'),c('name'),c('type',T,'','enum:PDF|DOCX|TXT|Website|YouTube|Manual QA'),
   c('size_or_url',T,'n'),c('storage_key',T,'n'),c('status',T,'','enum:indexed|processing|failed','\'processing\''),c('assessment_tag',T,'n','the one QA area it counts for'),
   tags(),c('raw_text',T,'n','full text extracted from the file or page, before it is cut into chunks'),c('content_hash',T,'n','sha256 of the content, blocks adding the same thing twice'),
   c('available_to_ai',B,'','','true'),created(),updated(),deleted()],[],
   {'tenant_unique':True,'tfk':[('created_by','users')],'rls':'tenant','read':ALLR,'write':ADMGR,'checks':TAGCHK,
    'indexes':[GINTAGS,"CREATE UNIQUE INDEX uq_knowledge_sources_hash ON {t}(tenant_id, content_hash) WHERE content_hash IS NOT NULL AND deleted_at IS NULL"]}),
 ('company_documents','cues',[pk(),tenant(),c('uploaded_by',U,'fk:users.id'),c('name'),c('size_bytes',BI,'n'),c('mime_type',T,'n'),c('storage_key',T),c('checksum_sha256',T,'n'),
   c('tagged_cue_id',U,'fk:cues.id,n,setnull','which cue it grounds'),tags(),c('raw_text',T,'n','full text extracted from the file, before it is cut into chunks'),
   *embed_cols('embeddings','the whole document, for example the average of its chunk vectors, to find similar documents'),
   c('considered',B,'','used in scoring','true'),c('status',T,'','enum:ready|processing','\'processing\''),
   created('uploaded_at'),updated(),deleted()],[],
   {'tenant_unique':True,'tfk':[('uploaded_by','users')],'rls':'tenant','read':ALLR,'write':ADMIN,'checks':TAGCHK,
    'indexes':[GINTAGS,"CREATE UNIQUE INDEX uq_company_documents_hash ON {t}(tenant_id, checksum_sha256) WHERE checksum_sha256 IS NOT NULL AND deleted_at IS NULL",HNSW%('embeddings','embeddings','embeddings')]}),
 ('knowledge_chunks','cues',[pk(),tenant(),c('source_id',U,'fk:knowledge_sources.id,n,cascade'),c('document_id',U,'fk:company_documents.id,n,cascade'),c('seq',I),c('content'),
   c('token_count',I,'n'),*embed_cols('embeddings','this chunk'),c('tsv',TV,'n',"gen:to_tsvector('english', content)")],[],
   {'rls':'tenant','read':ALLR,'write':(),'checks':['(source_id IS NULL) <> (document_id IS NULL)'],
    'indexes':["CREATE INDEX idx_knowledge_chunks_tsv ON {t} USING gin(tsv)",HNSW%('embeddings','embeddings','embeddings')]}),
 ('knowledge_citations','cues',[pk(),c('source_id',U,'fk:knowledge_sources.id,cascade'),c('user_id',U,'fk:users.id,n,setnull'),c('meeting_id',U,'fk:meetings.id,n,setnull'),
   c('used_by',T,'','enum:ask_ai|ai_chat|live_assist|mock|practice'),created('cited_at')],[],{'rls':('child','knowledge_sources','source_id')}),

 # ================= practice & coaching =================
 ('practice_catalog','practice',[pk(),c('tenant_id',U,'fk:tenants.id,n,cascade','null = platform catalogue'),c('title'),c('category'),c('description',T,'n'),
   c('recommended_minutes',I,'n'),c('level',T,'','enum:Foundational|Advanced|Mastery'),c('default_prompts',I,'','','5'),c('default_interval_sec',I,'','','30'),
   c('sample_prompts',J,'','list of prompt strings','\'[]\''),c('active',B,'','','true'),created(),updated()],[],
   {'rls':'custom','policies':[
     "CREATE POLICY practice_catalog_select ON practice_catalog FOR SELECT USING (tenant_id IS NULL OR tenant_id = app_tenant_id())",
     "CREATE POLICY practice_catalog_write ON practice_catalog FOR ALL USING ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin')) WITH CHECK ((tenant_id IS NULL AND app_role() = 'super_admin') OR (tenant_id = app_tenant_id() AND app_role() = 'client_admin'))"]}),
 ('practice_lessons','practice',[pk(),tenant(),c('owner_id',U,'fk:users.id','rep who practises'),c('created_by',U,'fk:users.id','rep or manager'),
   c('meeting_id',U,'fk:meetings.id,n'),c('lead_id',U,'fk:leads.id,n'),c('origin',T,'','enum:meeting|lead'),c('method',T,'','enum:checklist|ai'),c('title'),c('context',T,'n'),
   created(),updated()],[],
   {'tenant_unique':True,'tfk':[('owner_id','users'),('created_by','users'),('meeting_id','meetings'),('lead_id','leads')],'rls':('owner','owner_id'),
    'checks':["(origin = 'meeting' AND meeting_id IS NOT NULL) OR (origin = 'lead' AND lead_id IS NOT NULL)"]}),
 ('practice_lesson_cues','practice',[c('lesson_id',U,'pk,fk:practice_lessons.id,cascade'),c('cue_id',U,'pk,fk:cues.id')],[],{'rls':('child','practice_lessons','lesson_id')}),
 ('coaching_programs','practice',[pk(),tenant(),c('lead_id',U,'fk:leads.id'),c('rep_id',U,'fk:users.id'),
   c('status',T,'','enum:ready_to_start|in_progress|completed','\'ready_to_start\''),c('progress_pct',I,'','','0'),created(),updated()],[['lead_id','rep_id']],
   {'tenant_unique':True,'tfk':[('lead_id','leads'),('rep_id','users')],'rls':('owner','rep_id'),'checks':['progress_pct BETWEEN 0 AND 100']}),
 ('coaching_program_meetings','practice',[c('program_id',U,'pk,fk:coaching_programs.id,cascade'),c('meeting_id',U,'pk,fk:meetings.id,cascade')],[],
   {'rls':('child','coaching_programs','program_id')}),
 ('coaching_lessons','practice',[pk(),c('program_id',U,'fk:coaching_programs.id,cascade'),c('position',I),c('title'),c('objective'),c('relevance_to_deal',T,'n'),
   c('evidence_meeting_id',U,'fk:meetings.id,n,setnull','the call the lesson comes from'),c('tailored_explanation',T,'n'),c('talk_track',J,'','list of talk-track lines','\'[]\''),
   c('practice_activity',T,'n'),c('practice_scenario',T,'n','the buyer line the rep replies to'),c('expected_outcome',T,'n'),c('completed',B,'','','false'),c('completed_at',TS,'n'),created()],
   [['program_id','position']],{'tenant_unique':False,'rls':('child','coaching_programs','program_id')}),
 ('practice_attempts','practice',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('lesson_id',U,'fk:practice_lessons.id,n,cascade'),
   c('coaching_lesson_id',U,'fk:coaching_lessons.id,n,cascade'),c('turn_no',I),c('response'),c('score',I,'','0-100'),created()],[],
   {'tfk':[('user_id','users')],'rls':('owner','user_id'),'checks':['(lesson_id IS NULL) <> (coaching_lesson_id IS NULL)','score BETWEEN 0 AND 100']}),
 ('lesson_feedback','practice',[pk(),tenant(),c('rep_id',U,'fk:users.id','the rep who practised'),c('manager_id',U,'fk:users.id','who wrote the feedback'),
   c('lesson_id',U,'fk:practice_lessons.id,n,cascade'),c('coaching_lesson_id',U,'fk:coaching_lessons.id,n,cascade'),c('feedback'),created()],[],
   {'tfk':[('rep_id','users'),('manager_id','users')],'rls':('owner','rep_id'),'checks':['(lesson_id IS NULL) <> (coaching_lesson_id IS NULL)']}),
 ('mock_meetings','practice',[pk(),tenant(),c('rep_id',U,'fk:users.id'),c('source_meeting_id',U,'fk:meetings.id,n','must be an analysed call'),c('buyer_name'),c('buyer_role',T,'n'),
   c('roleplay_type'),c('domain',T,'n'),created('started_at'),c('duration_sec',I,'n'),c('score',I,'n','0-100'),c('summary',T,'n'),c('talk_listen_ratio',T,'n'),
   c('fillers_per_min',N,'n'),c('words_per_min',I,'n'),c('longest_monologue',T,'n'),c('rescore_status',T,'','enum:idle|processing|rescored','\'idle\'')],[],
   {'tfk':[('rep_id','users'),('source_meeting_id','meetings')],'rls':('owner','rep_id'),'checks':['score IS NULL OR score BETWEEN 0 AND 100']}),
 ('mock_meeting_focus_cues','practice',[c('mock_meeting_id',U,'pk,fk:mock_meetings.id,cascade'),c('cue_id',U,'pk,fk:cues.id')],[],{'rls':('child','mock_meetings','mock_meeting_id')}),
 ('mock_meeting_points','practice',[pk(),c('mock_meeting_id',U,'fk:mock_meetings.id,cascade'),c('kind',T,'','enum:went_well|to_improve'),c('body')],[],{'rls':('child','mock_meetings','mock_meeting_id')}),
 ('live_assist_sessions','practice',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('meeting_id',U,'fk:meetings.id,n','analysed call it was prepared from'),created('started_at'),
   c('ended_at',TS,'n'),c('notes',T,'n'),c('status',T,'','enum:active|ended','\'active\'')],[],
   {'tfk':[('user_id','users'),('meeting_id','meetings')],'rls':('owner','user_id')}),

 # ================= automation & AI =================
 ('automations','ai',[pk(),tenant(),c('created_by',U,'fk:users.id'),c('name'),c('description',T,'n'),c('trigger_event'),c('condition',T,'n'),c('action'),
   c('category',T,'','enum:Summary|Prompt|Email|Diagnostic'),c('status',T,'','enum:Active|Draft|Paused','\'Draft\''),c('runs_count',I,'','','0'),c('last_run_at',TS,'n'),created(),updated()],
   [['tenant_id','name']],{'tfk':[('created_by','users')],'rls':'tenant','read':ALLR,'write':ADMGR}),
 ('automation_runs','ai',[pk(),c('automation_id',U,'fk:automations.id,cascade'),c('meeting_id',U,'fk:meetings.id,n,setnull'),c('lead_id',U,'fk:leads.id,n,setnull'),
   c('status',T,'','enum:success|failed'),c('output',T,'n'),created('ran_at')],[],{'rls':('child','automations','automation_id')}),
 ('chat_threads','ai',[pk(),tenant(),c('user_id',U,'fk:users.id'),c('lead_id',U,'fk:leads.id,n','set when asked from a lead'),c('title',T,'n'),created(),updated()],[],
   {'tenant_unique':True,'tfk':[('user_id','users'),('lead_id','leads')],'rls':('user','user_id')}),
 ('chat_messages','ai',[pk(),c('thread_id',U,'fk:chat_threads.id,cascade'),c('role',T,'','enum:user|assistant'),c('body','text','','what the user sees'),c('raw_text',T,'n','assistant messages only: the model\'s reply exactly as returned. Never set on user messages, so their text is not stored twice'),
   c('citations',J,'n','knowledge source ids'),c('model',T,'n'),tags(),*embed_cols('embeddings','the message'),
   c('input_tokens',I,'n'),c('output_tokens',I,'n'),created()],[],
   {'rls':('child','chat_threads','thread_id'),'checks':TAGCHK+["raw_text IS NULL OR role = 'assistant'"],
    'indexes':["CREATE INDEX idx_chat_messages_thread_time ON {t}(thread_id, created_at)",GINTAGS,HNSW%('embeddings','embeddings','embeddings')]}),
]
