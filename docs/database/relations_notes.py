# Plain-language notes used by generate.py to write RELATIONS.md.
# generate.py stops with an error if a table or a foreign key has no note, so the reference cannot fall behind the schema.

PURPOSE = {
 # platform
 'plans': 'Plan catalogue: price, free trial length, seat and meeting limits, monthly credits.',
 'plan_features': 'Which features each plan unlocks (crm_sync, live_assist, ...).',
 'platform_owner_users': 'The people who own and run the SellMore platform (the super admins). Kept apart from client users.',
 'platform_limits': 'Platform-wide limits as key and value rows (allowed formats, file size, duration, invite expiry). A new limit is a new row.',
 'platform_audit_log': 'What super admins did on the platform. Append only.',
 # identity
 'clients': 'A client company: plan, status, free trial end, credit balance, recording retention.',
 'client_users': 'Everyone who works for a client: client admins, managers and sales reps. Holds the role, the rep\'s one manager, Salesforce user id and phone extension.',
 'auth_identities': 'Sign-in methods and password hashes. Locked away from the API.',
 'invitations': 'Invitations to join a company, pending or used.',
 'manager_assignments': 'History of which manager each rep reported to, and when.',
 'notifications': 'In-app notifications for one user.',
 'audit_log': 'Company-level trail: role changes, reassignments, connects. Append only.',
 # billing
 'credit_transactions': 'Credit ledger. Every spend and grant, with the balance after. Append only.',
 'invoices': 'Invoices issued to a company.',
 # integrations
 'integrations': 'The company\'s one CRM and one Drive connection, with sync settings.',
 'integration_credentials': 'Encrypted OAuth tokens for a connection. Locked away from the API.',
 'integration_sync_runs': 'One row per sync: what was found, imported or failed.',
 'integration_events': 'Inbound webhook events, kept so a repeat is ignored. Locked away from the API.',
 'crm_stage_mappings': 'Per company: Salesforce stage name to SellMore stage.',
 'crm_activities': 'Calls and meetings logged in Salesforce, with the AI summary and recording link.',
 # leads
 'leads': 'A deal: a Salesforce Opportunity, or a draft made in SellMore.',
 'lead_stakeholders': 'The contacts on a deal (Opportunity Contact Roles).',
 'lead_timeline_events': 'Activity feed of a deal: meetings, emails, stage changes, notes.',
 'lead_risks': 'Risks flagged on a deal, with when they were resolved.',
 # meetings
 'media_files': 'An audio or transcript file, uploaded by a user or fetched from the Drive folder.',
 'meetings': 'A call or meeting analysed in SellMore. Joins the CRM call, the audio file, the rep and the deal. Has tags and a summary vector.',
 'analysis_runs': 'Each transcription, analysis or re-score job on a meeting, with model, cost and the model\'s raw reply.',
 'meeting_insights': 'Went well, struggled, could be better, next steps.',
 'meeting_cue_scores': 'The score, observation and evidence for each cue in a meeting.',
 'meeting_objections': 'Buyer objections in a meeting, with the rep\'s response and verdict.',
 'transcript_segments': 'The transcript: one row per speaker turn, with time, cleaned and raw text, tags and a search vector.',
 'transcript_segment_cues': 'Which cues a transcript line mentions.',
 # cues & knowledge
 'cues': 'Evaluation cues: platform defaults (no company) and company overrides or custom cues.',
 'knowledge_sources': 'Knowledge base items: files, websites, videos, Q&A. Keeps the extracted text and tags.',
 'company_documents': 'Uploaded company documents, optionally tied to a cue. Keeps the extracted text, tags and a whole-document vector.',
 'knowledge_chunks': 'Indexed text pieces of a source or document, with the search vector AI answers use.',
 'knowledge_citations': 'Each time an AI feature used a knowledge source.',
 # practice
 'practice_catalog': 'Practice lesson templates: platform-wide or company-specific.',
 'practice_lessons': 'A lesson a user builds from the cues they fell short on.',
 'practice_lesson_cues': 'The cues a practice lesson covers.',
 'practice_programs': 'AI-built practice for one rep on one deal.',
 'practice_program_meetings': 'The analysed calls a practice programme was built from.',
 'practice_program_lessons': 'The ordered lessons inside a practice programme.',
 'practice_attempts': 'A rep\'s typed reply to a practice situation, with its score.',
 'lesson_feedback': 'A manager\'s written feedback on a rep\'s lesson.',
 'mock_meetings': 'An AI call-prep (mock buyer) session and its results.',
 'mock_meeting_focus_cues': 'The cues a mock meeting focused on.',
 'mock_meeting_points': 'Went-well and to-improve points of a mock meeting.',
 'live_assist_sessions': 'A Live Assist session a rep ran during a call.',
 # ai
 'automations': 'A workflow: trigger, condition and action.',
 'automation_runs': 'One execution of an automation.',
 'chat_threads': 'One AI chat conversation, private to its user.',
 'chat_messages': 'The messages of a chat thread, with the model\'s raw reply, tags and a search vector.',
}

# 'child.column': what the link means
REL = {
 'automation_runs.automation_id': 'The automation that ran.',
 'automation_runs.lead_id': 'The deal it ran on, if any.',
 'automation_runs.meeting_id': 'The meeting it ran on, if any.',
 'automations.created_by': 'Who created the automation.',
 'chat_messages.thread_id': 'The conversation the message belongs to.',
 'chat_threads.lead_id': 'The deal the question was asked from, if any.',
 'chat_threads.client_user_id': 'Who owns the conversation. Only they can read it. The company comes from this user.',
 'credit_transactions.user_id': 'Who triggered the charge.',
 'company_documents.tagged_cue_id': 'The cue this document is evidence for.',
 'company_documents.uploaded_by': 'Who uploaded it.',
 'cues.overrides_cue_id': 'The platform default cue that this company cue replaces. At most one override per cue per company.',
 'cues.updated_by': 'The client user who last edited the cue.',
 'cues.updated_by_owner_id': 'The platform owner who last edited a platform default cue. At most one of the two editor links is set.',
 'knowledge_chunks.document_id': 'Set when the chunk comes from a company document. Exactly one of document_id and source_id is set.',
 'knowledge_chunks.source_id': 'Set when the chunk comes from a knowledge source. Exactly one of source_id and document_id is set.',
 'knowledge_citations.meeting_id': 'The meeting where the source was used, if any.',
 'knowledge_citations.source_id': 'The source that was cited.',
 'knowledge_citations.user_id': 'Who was using the AI feature.',
 'knowledge_sources.created_by': 'Who added it.',
 'audit_log.actor_id': 'Who did it. Empty for system actions.',
 'auth_identities.user_id': 'The client user this sign-in method belongs to. A user can have several (password, Google, ...). Exactly one of user_id and platform_owner_user_id is set.',
 'auth_identities.platform_owner_user_id': 'The platform owner this sign-in method belongs to, when it is not a client user.',
 'invitations.accepted_user_id': 'The user created when the invitation was accepted.',
 'invitations.invited_by': 'Who sent the invitation.',
 'invitations.manager_id': 'The manager a new rep will report to. Reps only.',
 'manager_assignments.assigned_by': 'Who made the change. Empty for the system.',
 'manager_assignments.manager_id': 'The manager in this period. Empty means the rep was unassigned.',
 'manager_assignments.client_user_id': 'The rep. One row has ended_at empty: the current assignment.',
 'notifications.client_user_id': 'Who the notification is for. The company comes from this user.',
 'clients.plan_id': 'The plan the company is on.',
 'client_users.manager_id': 'A rep\'s one manager. Self-link on client_users. Must be an active manager of the same company.',
 'crm_activities.integration_id': 'The Salesforce connection it was fetched through.',
 'crm_activities.owner_user_id': 'The SellMore user who owns the call, found from the Salesforce owner or the phone extension.',
 'integration_credentials.integration_id': 'The connection the tokens belong to. One row per connection.',
 'integration_events.integration_id': 'The connection the event arrived on.',
 'integration_sync_runs.integration_id': 'The connection that was synced.',
 'integrations.connected_by': 'The admin who connected it.',
 'lead_risks.lead_id': 'The deal the risk is on.',
 'lead_stakeholders.lead_id': 'The deal the contact is on. Contacts are never merged across deals.',
 'lead_timeline_events.author_id': 'Who wrote the entry, if a person did.',
 'lead_timeline_events.lead_id': 'The deal the entry is on.',
 'lead_timeline_events.meeting_id': 'The meeting the entry is about, for meeting entries.',
 'leads.client_user_id': 'The rep who owns the deal. This decides who can see it, and the company comes from this rep (client_users.client_id), so a deal has no company column of its own.',
 'analysis_runs.meeting_id': 'The meeting that was processed.',
 'media_files.uploaded_by': 'Who uploaded the file. Empty when fetched from Drive.',
 'meeting_cue_scores.cue_id': 'The cue that was scored. The cue row in force at scoring time, so history stays true.',
 'meeting_cue_scores.evidence_segment_id': 'The transcript line the evidence comes from, so clicking it lands on the exact line. Must be a line of the same meeting.',
 'transcript_segment_cues.segment_id': 'The transcript line.',
 'transcript_segment_cues.cue_id': 'A cue the line mentions.',
 'meeting_cue_scores.meeting_id': 'The meeting that was scored. One score per cue per meeting.',
 'meeting_insights.meeting_id': 'The meeting the insight is about.',
 'meeting_objections.meeting_id': 'The meeting the objection was raised in.',
 'meeting_objections.segment_id': 'The buyer line that raised it, so the UI can highlight it. Must be a buyer line of the same meeting.',
 'meetings.crm_activity_id': 'The Salesforce call record this meeting came from. A call record can become only one meeting.',
 'meetings.integration_id': 'The connection it was fetched through.',
 'meetings.lead_id': 'The deal it belongs to. Empty for a call without a deal.',
 'meetings.media_file_id': 'The audio file. Empty while the audio has not arrived. One meeting per file.',
 'meetings.client_user_id': 'The rep who made the call. This decides who can see it, and the company comes from this rep.',
 'transcript_segments.meeting_id': 'The meeting the line was spoken in.',
 'plan_features.plan_id': 'The plan the feature belongs to.',
 'platform_audit_log.actor_id': 'The platform owner who acted.',
 'platform_limits.updated_by': 'The platform owner who last changed the limits.',
 'practice_program_lessons.evidence_meeting_id': 'The call the lesson uses as evidence, so it can be opened.',
 'practice_program_lessons.program_id': 'The programme the lesson belongs to.',
 'practice_program_meetings.meeting_id': 'A call the programme was built from.',
 'practice_program_meetings.program_id': 'The programme.',
 'practice_programs.lead_id': 'The deal being practised. One programme per deal per rep.',
 'practice_programs.client_user_id': 'The rep practising. This decides who can see it.',
 'lesson_feedback.program_lesson_id': 'Set when the feedback is on a programme lesson. Exactly one of the two lesson links is set.',
 'lesson_feedback.lesson_id': 'Set when the feedback is on a practice lesson. Exactly one of the two lesson links is set.',
 'lesson_feedback.manager_id': 'Who wrote the feedback.',
 'lesson_feedback.client_user_id': 'The rep who practised. This decides who can see it.',
 'live_assist_sessions.meeting_id': 'The analysed call the session was prepared from.',
 'live_assist_sessions.client_user_id': 'The rep who ran the session.',
 'mock_meeting_focus_cues.cue_id': 'A cue the mock meeting focused on.',
 'mock_meeting_focus_cues.mock_meeting_id': 'The mock meeting.',
 'mock_meeting_points.mock_meeting_id': 'The mock meeting the point belongs to.',
 'mock_meetings.client_user_id': 'The rep who practised.',
 'mock_meetings.source_meeting_id': 'The analysed call the call prep was built from.',
 'practice_attempts.program_lesson_id': 'Set when the reply is to a programme lesson. Exactly one of the two lesson links is set.',
 'practice_attempts.lesson_id': 'Set when the reply is to a practice lesson. Exactly one of the two lesson links is set.',
 'practice_attempts.client_user_id': 'The rep who wrote the reply.',
 'practice_lesson_cues.cue_id': 'A cue the lesson covers.',
 'practice_lesson_cues.lesson_id': 'The lesson.',
 'practice_lessons.created_by': 'Who built the lesson: the rep, or a manager on the rep\'s behalf.',
 'practice_lessons.lead_id': 'The deal, for lessons built from a whole deal.',
 'practice_lessons.meeting_id': 'The call, for lessons built from one call.',
 'practice_lessons.client_user_id': 'The rep who practises it. This decides who can see it.',
}

# client_id links that are not the plain "belongs to a company, deleted with it" kind
CLIENT = {
 'cues.client_id': 'Empty = platform default cue. Set = that company\'s override or custom cue.',
 'practice_catalog.client_id': 'Empty = platform-wide template. Set = that company\'s own.',
 'platform_audit_log.client_id': 'The company the action was about, if any.',
}

HEAD = """# SellMore database: how the tables relate

Reference for `schema.sql`. **Generated** by `generate.py` from `schema_def.py` and `relations_notes.py`: do not edit by hand.
See `README.md` for the design, access rules and operations.

## How to read this

- **Child → parent.** Every relation is one foreign key. Read `meetings.client_user_id → client_users` as "each meeting has one rep; a rep has many meetings".
- **Needed / optional.** A *needed* link must be filled. An *optional* link may be empty (for example a call without a deal).
- **If the parent is deleted:**
  - **Deleted with it**: the child goes too.
  - **Link cleared**: the child stays, the link becomes empty.
  - **Blocked**: the parent cannot be hard-deleted while children exist. People and cues are deactivated or soft-deleted instead, so history is never lost.
- **Same-company key.** A relation marked ✔ is a composite key on `(client_id, <the table's own id>)`, for example `(client_id, client_user_id)`. The database refuses a link to another company's row.
- **Owner.** The column that decides who may see a row (`client_user_id`, `owner_user_id`). A manager sees rows whose owner is one of their reps (`client_users.manager_id`).

## The relations at a glance

```
plans ──< clients ──< client_users >──(manager_id)── client_users          one manager per rep, same company
                │
                ├──< integrations ──< crm_activities ──┐      Salesforce call
                │         └──< integration_credentials │
                ├──< leads (deal) ──< lead_stakeholders  │
                │        │      └──< lead_timeline_events│
                ├──< media_files (audio) ───────┐        │
                │                               ▼        ▼
                ├──< meetings ◄─────────────────┴────────┘    meeting = rep + deal + audio + CRM call
                │        ├──< transcript_segments ◄── meeting_objections
                │        ├──< meeting_cue_scores >── cues
                │        └──< meeting_insights, analysis_runs
                ├──< practice_lessons >──< cues
                ├──< practice_programs (deal + rep) ──< practice_program_lessons
                │        └── practice_attempts, lesson_feedback (on either kind of lesson)
                ├──< mock_meetings, live_assist_sessions
                ├──< knowledge_sources, company_documents ──< knowledge_chunks
                └──< credit_transactions, invoices, audit_log
```

`A ──< B` means one A has many B.
"""

TAIL = """## Relations worth knowing

**One call, three tables.** A phone call reaches SellMore from two places. `crm_activities` holds what Salesforce knows (who, when, outcome, summary). `media_files` holds the audio from Drive. `meetings` joins them: `meetings.crm_activity_id → crm_activities.crm_activity_id` and `meetings.media_file_id → media_files.media_file_id`. Either may be empty for a while (`awaiting_audio`, `unmatched`).

**Self-links.** `client_users.manager_id → client_users` (a rep's manager). `cues.overrides_cue_id → cues` (a company cue replacing a platform default).

**Either / or links.** `practice_attempts` and `lesson_feedback` point at *either* a `practice_lessons` row *or* a `practice_program_lessons` row, never both and never neither (a check enforces it). `knowledge_chunks` points at *either* a source *or* a document.

**Company by person, checked by trigger.** Tables that belong to one person have no `client_id`: they name the person (`client_user_id`) and the company is that person's. A trigger (`same_company_links`) refuses a row that points at anything from another company, such as a meeting pointing at another company's deal, audio file or call record.

**Text, tags and vectors.** Search-by-meaning vectors (`embeddings`, `meetings.summary_embeddings`) live next to the text they describe on `transcript_segments`, `chat_messages`, `knowledge_chunks`, `company_documents` and `meetings`, with the `embedding_model` that made them. Raw copies (`raw_text`, `raw_output`) sit beside the cleaned text. Both follow their row's access rule, and the raw copies and turn vectors of a call are cleared when its recording expires.\n\n**Standard columns.** Every table key is named after its table (`client_users.client_user_id`, `meetings.meeting_id`), so a join reads the same on both sides. Every table has `created_at`, and tables whose rows change have `updated_at`. Tables that people create or edit also record `created_by`, `updated_by` and, where rows are hidden instead of removed, `deleted_by`. The database fills these in from the signed-in user, so the API cannot forget or forge them. They stay empty when a sync, an import or an AI job did the work, and when a super admin acted inside a company (that goes to `platform_audit_log`).

**Platform limits and free trials.** `platform_limits` holds one row per limit (`limit_key`, `limit_value` as JSON), so a new limit is a new row and no schema change. A plan can offer a free trial (`plans.trial_days`), and a company records when its trial ends (`clients.trial_ends_at`).

**Who can see a row.** Rows with an owner column (`meetings.client_user_id`, `leads.client_user_id`, `practice_lessons.client_user_id`, `practice_programs.client_user_id`, `mock_meetings.client_user_id`, `live_assist_sessions.client_user_id`, `crm_activities.owner_user_id`) follow the manager rule. Child tables (transcript, scores, objections, lead stakeholders, lessons...) are visible exactly when their parent is.

## Common joins

```sql
-- Meetings a manager can see (their reps' meetings)
SELECT m.* FROM meetings m JOIN client_users r ON r.client_user_id = m.client_user_id WHERE r.manager_id = :manager_id;

-- A deal with its calls, newest first
SELECT m.* FROM leads l JOIN meetings m ON m.lead_id = l.lead_id
WHERE l.lead_id = :lead_id AND m.deleted_at IS NULL ORDER BY coalesce(m.meeting_at, m.uploaded_at) DESC;

-- A call end to end: CRM record, audio file, transcript
SELECT m.name, a.description AS crm_summary, f.storage_key, s.seq, s.speaker, s.text
FROM meetings m
LEFT JOIN crm_activities a ON a.crm_activity_id = m.crm_activity_id
LEFT JOIN media_files f ON f.media_file_id = m.media_file_id
LEFT JOIN transcript_segments s ON s.meeting_id = m.meeting_id
WHERE m.meeting_id = :meeting_id ORDER BY s.seq;

-- Buyer objections with the line they point at
SELECT o.objection, o.status, s.text, s.start_ms
FROM meeting_objections o LEFT JOIN transcript_segments s ON s.transcript_segment_id = o.segment_id WHERE o.meeting_id = :meeting_id;

-- The cues a company actually uses: its override where one exists, else the platform default
SELECT coalesce(o.cue_id, d.cue_id) AS cue_id, coalesce(o.name, d.name) AS name
FROM cues d LEFT JOIN cues o ON o.overrides_cue_id = d.cue_id AND o.client_id = :client_id
WHERE d.client_id IS NULL AND coalesce(o.enabled, d.enabled);

-- A rep's manager history
SELECT manager_id, started_at, ended_at FROM manager_assignments WHERE client_user_id = :rep_id ORDER BY started_at;
```
"""
