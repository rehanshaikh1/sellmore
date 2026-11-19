# Plain-language notes used by generate.py to write RELATIONS.md.
# generate.py stops with an error if a table or a foreign key has no note, so the reference cannot fall behind the schema.

PURPOSE = {
 # platform
 'plans': 'Plan catalogue: price, seat and meeting limits, monthly credits.',
 'plan_features': 'Which features each plan unlocks (crm_sync, live_assist, ...).',
 'platform_limits': 'One row: upload formats, size and duration limits, invite expiry.',
 'platform_audit_log': 'What super admins did on the platform. Append only.',
 # identity
 'tenants': 'A client company: plan, status, credit balance, recording retention.',
 'users': 'Every person. Holds role, the rep\'s one manager, Salesforce user id and phone extension.',
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
 'meetings': 'A call or meeting analysed in SellMore. Joins the CRM call, the audio file, the rep and the deal.',
 'analysis_runs': 'Each transcription, analysis or re-score job on a meeting, with model and cost.',
 'meeting_insights': 'Went well, struggled, could be better, next steps.',
 'meeting_cue_scores': 'The score, observation and evidence for each cue in a meeting.',
 'meeting_objections': 'Buyer objections in a meeting, with the rep\'s response and verdict.',
 'transcript_segments': 'The transcript: one row per speaker turn, with time and searchable text.',
 # cues & knowledge
 'cues': 'Evaluation cues: platform defaults (no company) and company overrides or custom cues.',
 'knowledge_sources': 'Knowledge base items: files, websites, videos, Q&A.',
 'company_documents': 'Uploaded company documents, optionally tied to a cue.',
 'knowledge_chunks': 'Indexed text pieces of a source or document, used by AI answers.',
 'knowledge_citations': 'Each time an AI feature used a knowledge source.',
 # practice
 'practice_catalog': 'Practice lesson templates: platform-wide or company-specific.',
 'practice_lessons': 'A lesson a user builds from the cues they fell short on.',
 'practice_lesson_cues': 'The cues a practice lesson covers.',
 'coaching_programs': 'AI-built coaching for one rep on one deal.',
 'coaching_program_meetings': 'The analysed calls a coaching programme was built from.',
 'coaching_lessons': 'The ordered lessons inside a coaching programme.',
 'practice_attempts': 'A rep\'s typed reply to a practice situation, with its score.',
 'lesson_feedback': 'A manager\'s written feedback on a rep\'s lesson.',
 'mock_meetings': 'An AI role-play session and its results.',
 'mock_meeting_focus_cues': 'The cues a mock meeting focused on.',
 'mock_meeting_points': 'Went-well and to-improve points of a mock meeting.',
 'live_assist_sessions': 'A Live Assist session a rep ran during a call.',
 # ai
 'automations': 'A workflow: trigger, condition and action.',
 'automation_runs': 'One execution of an automation.',
 'chat_threads': 'One AI chat conversation, private to its user.',
 'chat_messages': 'The messages of a chat thread.',
}

# 'child.column': what the link means
REL = {
 'automation_runs.automation_id': 'The automation that ran.',
 'automation_runs.lead_id': 'The deal it ran on, if any.',
 'automation_runs.meeting_id': 'The meeting it ran on, if any.',
 'automations.created_by': 'Who created the automation.',
 'chat_messages.thread_id': 'The conversation the message belongs to.',
 'chat_threads.lead_id': 'The deal the question was asked from, if any.',
 'chat_threads.user_id': 'Who owns the conversation. Only they can read it.',
 'credit_transactions.user_id': 'Who triggered the charge.',
 'company_documents.tagged_cue_id': 'The cue this document is evidence for.',
 'company_documents.uploaded_by': 'Who uploaded it.',
 'cues.overrides_cue_id': 'The platform default cue that this company cue replaces. At most one override per cue per company.',
 'cues.updated_by': 'Who last edited the cue.',
 'knowledge_chunks.document_id': 'Set when the chunk comes from a company document. Exactly one of document_id and source_id is set.',
 'knowledge_chunks.source_id': 'Set when the chunk comes from a knowledge source. Exactly one of source_id and document_id is set.',
 'knowledge_citations.meeting_id': 'The meeting where the source was used, if any.',
 'knowledge_citations.source_id': 'The source that was cited.',
 'knowledge_citations.user_id': 'Who was using the AI feature.',
 'knowledge_sources.created_by': 'Who added it.',
 'audit_log.actor_id': 'Who did it. Empty for system actions.',
 'auth_identities.user_id': 'The person this sign-in method belongs to. A user can have several (password, Google, ...).',
 'invitations.accepted_user_id': 'The user created when the invitation was accepted.',
 'invitations.invited_by': 'Who sent the invitation.',
 'invitations.manager_id': 'The manager a new rep will report to. Reps only.',
 'manager_assignments.assigned_by': 'Who made the change. Empty for the system.',
 'manager_assignments.manager_id': 'The manager in this period. Empty means the rep was unassigned.',
 'manager_assignments.rep_id': 'The rep. One row has ended_at empty: the current assignment.',
 'notifications.user_id': 'Who the notification is for.',
 'tenants.plan_id': 'The plan the company is on.',
 'users.manager_id': 'A rep\'s one manager. Self-link on users. Must be an active manager of the same company.',
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
 'leads.owner_id': 'The rep who owns the deal. This decides who can see it.',
 'analysis_runs.meeting_id': 'The meeting that was processed.',
 'media_files.uploaded_by': 'Who uploaded the file. Empty when fetched from Drive.',
 'meeting_cue_scores.cue_id': 'The cue that was scored. The cue row in force at scoring time, so history stays true.',
 'meeting_cue_scores.meeting_id': 'The meeting that was scored. One score per cue per meeting.',
 'meeting_insights.meeting_id': 'The meeting the insight is about.',
 'meeting_objections.meeting_id': 'The meeting the objection was raised in.',
 'meeting_objections.segment_id': 'The buyer line that raised it, so the UI can highlight it. Must be a buyer line of the same meeting.',
 'meetings.crm_activity_id': 'The Salesforce call this meeting came from. Joined on crm_activities.external_id. A call can be imported only once.',
 'meetings.integration_id': 'The connection it was fetched through.',
 'meetings.lead_id': 'The deal it belongs to. Empty for a call without a deal.',
 'meetings.media_file_id': 'The audio file. Empty while the audio has not arrived. One meeting per file.',
 'meetings.rep_id': 'The rep who made the call. This decides who can see it.',
 'transcript_segments.meeting_id': 'The meeting the line was spoken in.',
 'plan_features.plan_id': 'The plan the feature belongs to.',
 'platform_audit_log.actor_id': 'The super admin who acted.',
 'platform_limits.updated_by': 'The super admin who last changed the limits.',
 'coaching_lessons.evidence_meeting_id': 'The call the lesson uses as evidence, so it can be opened.',
 'coaching_lessons.program_id': 'The programme the lesson belongs to.',
 'coaching_program_meetings.meeting_id': 'A call the programme was built from.',
 'coaching_program_meetings.program_id': 'The programme.',
 'coaching_programs.lead_id': 'The deal being coached. One programme per deal per rep.',
 'coaching_programs.rep_id': 'The rep being coached. This decides who can see it.',
 'lesson_feedback.coaching_lesson_id': 'Set when the feedback is on a coaching lesson. Exactly one of the two lesson links is set.',
 'lesson_feedback.lesson_id': 'Set when the feedback is on a practice lesson. Exactly one of the two lesson links is set.',
 'lesson_feedback.manager_id': 'Who wrote the feedback.',
 'lesson_feedback.rep_id': 'The rep who practised. This decides who can see it.',
 'live_assist_sessions.meeting_id': 'The analysed call the session was prepared from.',
 'live_assist_sessions.user_id': 'The rep who ran the session.',
 'mock_meeting_focus_cues.cue_id': 'A cue the mock meeting focused on.',
 'mock_meeting_focus_cues.mock_meeting_id': 'The mock meeting.',
 'mock_meeting_points.mock_meeting_id': 'The mock meeting the point belongs to.',
 'mock_meetings.rep_id': 'The rep who practised.',
 'mock_meetings.source_meeting_id': 'The analysed call the role-play was built from.',
 'practice_attempts.coaching_lesson_id': 'Set when the reply is to a coaching lesson. Exactly one of the two lesson links is set.',
 'practice_attempts.lesson_id': 'Set when the reply is to a practice lesson. Exactly one of the two lesson links is set.',
 'practice_attempts.user_id': 'The rep who wrote the reply.',
 'practice_lesson_cues.cue_id': 'A cue the lesson covers.',
 'practice_lesson_cues.lesson_id': 'The lesson.',
 'practice_lessons.created_by': 'Who built the lesson: the rep, or a manager on the rep\'s behalf.',
 'practice_lessons.lead_id': 'The deal, for lessons built from a whole deal.',
 'practice_lessons.meeting_id': 'The call, for lessons built from one call.',
 'practice_lessons.owner_id': 'The rep who practises it. This decides who can see it.',
}

# tenant_id links that are not the plain "belongs to a company, deleted with it" kind
TENANT = {
 'users.tenant_id': 'The user\'s company. Empty only for the super admin.',
 'cues.tenant_id': 'Empty = platform default cue. Set = that company\'s override or custom cue.',
 'practice_catalog.tenant_id': 'Empty = platform-wide template. Set = that company\'s own.',
 'platform_audit_log.tenant_id': 'The company the action was about, if any.',
}

HEAD = """# SellMore database: how the tables relate

Reference for `schema.sql`. **Generated** by `generate.py` from `schema_def.py` and `relations_notes.py`: do not edit by hand.
See `README.md` for the design, access rules and operations.

## How to read this

- **Child → parent.** Every relation is one foreign key. Read `meetings.rep_id → users` as "each meeting has one rep; a rep has many meetings".
- **Needed / optional.** A *needed* link must be filled. An *optional* link may be empty (for example a call without a deal).
- **If the parent is deleted:**
  - **Deleted with it**: the child goes too.
  - **Link cleared**: the child stays, the link becomes empty.
  - **Blocked**: the parent cannot be hard-deleted while children exist. People and cues are deactivated or soft-deleted instead, so history is never lost.
- **Same-company key.** A relation marked ✔ is a composite key on `(tenant_id, id)`. The database refuses a link to another company's row.
- **Owner.** The column that decides who may see a row (`rep_id`, `owner_id`, `user_id`, `owner_user_id`). A manager sees rows whose owner is one of their reps (`users.manager_id`).

## The relations at a glance

```
plans ──< tenants ──< users >──(manager_id)── users          one manager per rep, same company
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
                ├──< coaching_programs (deal + rep) ──< coaching_lessons
                │        └── practice_attempts, lesson_feedback (on either kind of lesson)
                ├──< mock_meetings, live_assist_sessions
                ├──< knowledge_sources, company_documents ──< knowledge_chunks
                └──< credit_transactions, invoices, audit_log
```

`A ──< B` means one A has many B.
"""

TAIL = """## Relations worth knowing

**One call, three tables.** A phone call reaches SellMore from two places. `crm_activities` holds what Salesforce knows (who, when, outcome, summary). `media_files` holds the audio from Drive. `meetings` joins them: `meetings.crm_activity_id → crm_activities.external_id` and `meetings.media_file_id → media_files.id`. Either may be empty for a while (`awaiting_audio`, `unmatched`).

**Self-links.** `users.manager_id → users` (a rep's manager). `cues.overrides_cue_id → cues` (a company cue replacing a platform default).

**Either / or links.** `practice_attempts` and `lesson_feedback` point at *either* a `practice_lessons` row *or* a `coaching_lessons` row, never both and never neither (a check enforces it). `knowledge_chunks` points at *either* a source *or* a document.

**Joins that are not a foreign key.** `meetings.crm_activity_id` joins on Salesforce's own id (`external_id`), not on the SellMore uuid, so a re-import is recognised.

**Who can see a row.** Rows with an owner column (`meetings.rep_id`, `leads.owner_id`, `practice_lessons.owner_id`, `coaching_programs.rep_id`, `mock_meetings.rep_id`, `live_assist_sessions.user_id`, `crm_activities.owner_user_id`) follow the manager rule. Child tables (transcript, scores, objections, lead stakeholders, lessons...) are visible exactly when their parent is.

## Common joins

```sql
-- Meetings a manager can see (their reps' meetings)
SELECT m.* FROM meetings m JOIN users r ON r.id = m.rep_id WHERE r.manager_id = :manager_id;

-- A deal with its calls, newest first
SELECT m.* FROM leads l JOIN meetings m ON m.lead_id = l.id
WHERE l.id = :lead_id AND m.deleted_at IS NULL ORDER BY coalesce(m.meeting_at, m.uploaded_at) DESC;

-- A call end to end: CRM record, audio file, transcript
SELECT m.name, a.description AS crm_summary, f.storage_key, s.seq, s.speaker, s.text
FROM meetings m
LEFT JOIN crm_activities a ON a.tenant_id = m.tenant_id AND a.external_id = m.crm_activity_id
LEFT JOIN media_files f ON f.id = m.media_file_id
LEFT JOIN transcript_segments s ON s.meeting_id = m.id
WHERE m.id = :meeting_id ORDER BY s.seq;

-- Buyer objections with the line they point at
SELECT o.objection, o.status, s.text, s.start_ms
FROM meeting_objections o LEFT JOIN transcript_segments s ON s.id = o.segment_id WHERE o.meeting_id = :meeting_id;

-- The cues a company actually uses: its override where one exists, else the platform default
SELECT coalesce(o.id, d.id) AS cue_id, coalesce(o.name, d.name) AS name
FROM cues d LEFT JOIN cues o ON o.overrides_cue_id = d.id AND o.tenant_id = :tenant_id
WHERE d.tenant_id IS NULL AND coalesce(o.enabled, d.enabled);

-- A rep's manager history
SELECT manager_id, started_at, ended_at FROM manager_assignments WHERE rep_id = :rep_id ORDER BY started_at;
```
"""
