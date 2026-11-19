# SellMore database: how the tables relate

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

## Tables by area

### Platform (super admin)

| Table | What it is |
|---|---|
| `plans` | Plan catalogue: price, seat and meeting limits, monthly credits. |
| `plan_features` | Which features each plan unlocks (crm_sync, live_assist, ...). |
| `platform_limits` | One row: upload formats, size and duration limits, invite expiry. |
| `platform_audit_log` | What super admins did on the platform. Append only. |

### Tenants & people

| Table | What it is |
|---|---|
| `tenants` | A client company: plan, status, credit balance, recording retention. |
| `users` | Every person. Holds role, the rep's one manager, Salesforce user id and phone extension. |
| `auth_identities` | Sign-in methods and password hashes. Locked away from the API. |
| `invitations` | Invitations to join a company, pending or used. |
| `manager_assignments` | History of which manager each rep reported to, and when. |
| `notifications` | In-app notifications for one user. |
| `audit_log` | Company-level trail: role changes, reassignments, connects. Append only. |

### Billing & credits

| Table | What it is |
|---|---|
| `credit_transactions` | Credit ledger. Every spend and grant, with the balance after. Append only. |
| `invoices` | Invoices issued to a company. |

### Integrations

| Table | What it is |
|---|---|
| `integrations` | The company's one CRM and one Drive connection, with sync settings. |
| `integration_credentials` | Encrypted OAuth tokens for a connection. Locked away from the API. |
| `integration_sync_runs` | One row per sync: what was found, imported or failed. |
| `integration_events` | Inbound webhook events, kept so a repeat is ignored. Locked away from the API. |
| `crm_stage_mappings` | Per company: Salesforce stage name to SellMore stage. |
| `crm_activities` | Calls and meetings logged in Salesforce, with the AI summary and recording link. |

### Leads

| Table | What it is |
|---|---|
| `leads` | A deal: a Salesforce Opportunity, or a draft made in SellMore. |
| `lead_stakeholders` | The contacts on a deal (Opportunity Contact Roles). |
| `lead_timeline_events` | Activity feed of a deal: meetings, emails, stage changes, notes. |
| `lead_risks` | Risks flagged on a deal, with when they were resolved. |

### Meetings & analysis

| Table | What it is |
|---|---|
| `media_files` | An audio or transcript file, uploaded by a user or fetched from the Drive folder. |
| `meetings` | A call or meeting analysed in SellMore. Joins the CRM call, the audio file, the rep and the deal. Has tags and a summary vector. |
| `analysis_runs` | Each transcription, analysis or re-score job on a meeting, with model, cost and the model's raw reply. |
| `meeting_insights` | Went well, struggled, could be better, next steps. |
| `meeting_cue_scores` | The score, observation and evidence for each cue in a meeting. |
| `meeting_objections` | Buyer objections in a meeting, with the rep's response and verdict. |
| `transcript_segments` | The transcript: one row per speaker turn, with time, cleaned and raw text, tags and a search vector. |
| `transcript_segment_cues` | Which cues a transcript line mentions. |

### Cues & knowledge

| Table | What it is |
|---|---|
| `cues` | Evaluation cues: platform defaults (no company) and company overrides or custom cues. |
| `knowledge_sources` | Knowledge base items: files, websites, videos, Q&A. Keeps the extracted text and tags. |
| `company_documents` | Uploaded company documents, optionally tied to a cue. Keeps the extracted text, tags and a whole-document vector. |
| `knowledge_chunks` | Indexed text pieces of a source or document, with the search vector AI answers use. |
| `knowledge_citations` | Each time an AI feature used a knowledge source. |

### Practice & coaching

| Table | What it is |
|---|---|
| `practice_catalog` | Practice lesson templates: platform-wide or company-specific. |
| `practice_lessons` | A lesson a user builds from the cues they fell short on. |
| `practice_lesson_cues` | The cues a practice lesson covers. |
| `coaching_programs` | AI-built coaching for one rep on one deal. |
| `coaching_program_meetings` | The analysed calls a coaching programme was built from. |
| `coaching_lessons` | The ordered lessons inside a coaching programme. |
| `practice_attempts` | A rep's typed reply to a practice situation, with its score. |
| `lesson_feedback` | A manager's written feedback on a rep's lesson. |
| `mock_meetings` | An AI role-play session and its results. |
| `mock_meeting_focus_cues` | The cues a mock meeting focused on. |
| `mock_meeting_points` | Went-well and to-improve points of a mock meeting. |
| `live_assist_sessions` | A Live Assist session a rep ran during a call. |

### Automation & AI

| Table | What it is |
|---|---|
| `automations` | A workflow: trigger, condition and action. |
| `automation_runs` | One execution of an automation. |
| `chat_threads` | One AI chat conversation, private to its user. |
| `chat_messages` | The messages of a chat thread, with the model's raw reply, tags and a search vector. |

## Relations by area

Needed / optional / one-to-one / many-to-many link describes the child side. The last column says what the link means.

### Platform (super admin)

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `plan_features.plan_id` → `plans` | needed | Deleted with it |  | The plan the feature belongs to. |
| `platform_limits.updated_by` → `users` | optional | Link cleared |  | The super admin who last changed the limits. |
| `platform_audit_log.actor_id` → `users` | needed | Blocked |  | The super admin who acted. |
| `platform_audit_log.tenant_id` → `tenants` | optional | Link cleared |  | The company the action was about, if any. |

### Tenants & people

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `tenants.plan_id` → `plans` | needed | Blocked |  | The plan the company is on. |
| `users.tenant_id` → `tenants` | optional | Deleted with it |  | The user's company. Empty only for the super admin. |
| `users.manager_id` → `users` | optional | Blocked | ✔ | A rep's one manager. Self-link on users. Must be an active manager of the same company. |
| `auth_identities.user_id` → `users` | needed | Deleted with it |  | The person this sign-in method belongs to. A user can have several (password, Google, ...). |
| `invitations.manager_id` → `users` | optional | Blocked | ✔ | The manager a new rep will report to. Reps only. |
| `invitations.invited_by` → `users` | needed | Blocked | ✔ | Who sent the invitation. |
| `invitations.accepted_user_id` → `users` | optional | Link cleared |  | The user created when the invitation was accepted. |
| `manager_assignments.rep_id` → `users` | needed | Blocked | ✔ | The rep. One row has ended_at empty: the current assignment. |
| `manager_assignments.manager_id` → `users` | optional | Blocked | ✔ | The manager in this period. Empty means the rep was unassigned. |
| `manager_assignments.assigned_by` → `users` | optional | Link cleared |  | Who made the change. Empty for the system. |
| `notifications.user_id` → `users` | needed | Blocked | ✔ | Who the notification is for. |
| `audit_log.actor_id` → `users` | optional | Link cleared |  | Who did it. Empty for system actions. |

### Billing & credits

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `credit_transactions.user_id` → `users` | optional | Link cleared |  | Who triggered the charge. |

### Integrations

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `integrations.connected_by` → `users` | optional | Blocked | ✔ | The admin who connected it. |
| `integration_credentials.integration_id` → `integrations` | one-to-one | Deleted with it |  | The connection the tokens belong to. One row per connection. |
| `integration_sync_runs.integration_id` → `integrations` | needed | Blocked | ✔ | The connection that was synced. |
| `integration_events.integration_id` → `integrations` | needed | Blocked | ✔ | The connection the event arrived on. |
| `crm_activities.integration_id` → `integrations` | needed | Blocked | ✔ | The Salesforce connection it was fetched through. |
| `crm_activities.owner_user_id` → `users` | optional | Blocked | ✔ | The SellMore user who owns the call, found from the Salesforce owner or the phone extension. |

### Leads

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `leads.owner_id` → `users` | needed | Blocked | ✔ | The rep who owns the deal. This decides who can see it. |
| `lead_stakeholders.lead_id` → `leads` | needed | Deleted with it |  | The deal the contact is on. Contacts are never merged across deals. |
| `lead_timeline_events.lead_id` → `leads` | needed | Deleted with it |  | The deal the entry is on. |
| `lead_timeline_events.meeting_id` → `meetings` | optional | Link cleared |  | The meeting the entry is about, for meeting entries. |
| `lead_timeline_events.author_id` → `users` | optional | Link cleared |  | Who wrote the entry, if a person did. |
| `lead_risks.lead_id` → `leads` | needed | Deleted with it |  | The deal the risk is on. |

### Meetings & analysis

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `media_files.uploaded_by` → `users` | optional | Blocked | ✔ | Who uploaded the file. Empty when fetched from Drive. |
| `meetings.rep_id` → `users` | needed | Blocked | ✔ | The rep who made the call. This decides who can see it. |
| `meetings.lead_id` → `leads` | optional | Blocked | ✔ | The deal it belongs to. Empty for a call without a deal. |
| `meetings.integration_id` → `integrations` | optional | Blocked | ✔ | The connection it was fetched through. |
| `meetings.media_file_id` → `media_files` | optional | Blocked | ✔ | The audio file. Empty while the audio has not arrived. One meeting per file. |
| `meetings.crm_activity_id` → `crm_activities.external_id` | optional | Blocked | ✔ | The Salesforce call this meeting came from. Joined on crm_activities.external_id. A call can be imported only once. |
| `analysis_runs.meeting_id` → `meetings` | needed | Deleted with it |  | The meeting that was processed. |
| `meeting_insights.meeting_id` → `meetings` | needed | Deleted with it |  | The meeting the insight is about. |
| `meeting_cue_scores.meeting_id` → `meetings` | needed | Deleted with it |  | The meeting that was scored. One score per cue per meeting. |
| `meeting_cue_scores.cue_id` → `cues` | needed | Blocked |  | The cue that was scored. The cue row in force at scoring time, so history stays true. |
| `meeting_cue_scores.evidence_segment_id` → `transcript_segments` | optional | Link cleared |  | The transcript line the evidence comes from, so clicking it lands on the exact line. Must be a line of the same meeting. |
| `meeting_objections.meeting_id` → `meetings` | needed | Deleted with it |  | The meeting the objection was raised in. |
| `meeting_objections.segment_id` → `transcript_segments` | optional | Link cleared |  | The buyer line that raised it, so the UI can highlight it. Must be a buyer line of the same meeting. |
| `transcript_segments.meeting_id` → `meetings` | needed | Deleted with it |  | The meeting the line was spoken in. |
| `transcript_segment_cues.segment_id` → `transcript_segments` | many-to-many link | Deleted with it |  | The transcript line. |
| `transcript_segment_cues.cue_id` → `cues` | many-to-many link | Blocked |  | A cue the line mentions. |

### Cues & knowledge

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `cues.tenant_id` → `tenants` | optional | Deleted with it |  | Empty = platform default cue. Set = that company's override or custom cue. |
| `cues.overrides_cue_id` → `cues` | optional | Blocked |  | The platform default cue that this company cue replaces. At most one override per cue per company. |
| `cues.updated_by` → `users` | optional | Link cleared |  | Who last edited the cue. |
| `knowledge_sources.created_by` → `users` | needed | Blocked | ✔ | Who added it. |
| `company_documents.uploaded_by` → `users` | needed | Blocked | ✔ | Who uploaded it. |
| `company_documents.tagged_cue_id` → `cues` | optional | Link cleared |  | The cue this document is evidence for. |
| `knowledge_chunks.source_id` → `knowledge_sources` | optional | Deleted with it |  | Set when the chunk comes from a knowledge source. Exactly one of source_id and document_id is set. |
| `knowledge_chunks.document_id` → `company_documents` | optional | Deleted with it |  | Set when the chunk comes from a company document. Exactly one of document_id and source_id is set. |
| `knowledge_citations.source_id` → `knowledge_sources` | needed | Deleted with it |  | The source that was cited. |
| `knowledge_citations.user_id` → `users` | optional | Link cleared |  | Who was using the AI feature. |
| `knowledge_citations.meeting_id` → `meetings` | optional | Link cleared |  | The meeting where the source was used, if any. |

### Practice & coaching

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `practice_catalog.tenant_id` → `tenants` | optional | Deleted with it |  | Empty = platform-wide template. Set = that company's own. |
| `practice_lessons.owner_id` → `users` | needed | Blocked | ✔ | The rep who practises it. This decides who can see it. |
| `practice_lessons.created_by` → `users` | needed | Blocked | ✔ | Who built the lesson: the rep, or a manager on the rep's behalf. |
| `practice_lessons.meeting_id` → `meetings` | optional | Blocked | ✔ | The call, for lessons built from one call. |
| `practice_lessons.lead_id` → `leads` | optional | Blocked | ✔ | The deal, for lessons built from a whole deal. |
| `practice_lesson_cues.lesson_id` → `practice_lessons` | many-to-many link | Deleted with it |  | The lesson. |
| `practice_lesson_cues.cue_id` → `cues` | many-to-many link | Blocked |  | A cue the lesson covers. |
| `coaching_programs.lead_id` → `leads` | needed | Blocked | ✔ | The deal being coached. One programme per deal per rep. |
| `coaching_programs.rep_id` → `users` | needed | Blocked | ✔ | The rep being coached. This decides who can see it. |
| `coaching_program_meetings.program_id` → `coaching_programs` | many-to-many link | Deleted with it |  | The programme. |
| `coaching_program_meetings.meeting_id` → `meetings` | many-to-many link | Deleted with it |  | A call the programme was built from. |
| `coaching_lessons.program_id` → `coaching_programs` | needed | Deleted with it |  | The programme the lesson belongs to. |
| `coaching_lessons.evidence_meeting_id` → `meetings` | optional | Link cleared |  | The call the lesson uses as evidence, so it can be opened. |
| `practice_attempts.user_id` → `users` | needed | Blocked | ✔ | The rep who wrote the reply. |
| `practice_attempts.lesson_id` → `practice_lessons` | optional | Deleted with it |  | Set when the reply is to a practice lesson. Exactly one of the two lesson links is set. |
| `practice_attempts.coaching_lesson_id` → `coaching_lessons` | optional | Deleted with it |  | Set when the reply is to a coaching lesson. Exactly one of the two lesson links is set. |
| `lesson_feedback.rep_id` → `users` | needed | Blocked | ✔ | The rep who practised. This decides who can see it. |
| `lesson_feedback.manager_id` → `users` | needed | Blocked | ✔ | Who wrote the feedback. |
| `lesson_feedback.lesson_id` → `practice_lessons` | optional | Deleted with it |  | Set when the feedback is on a practice lesson. Exactly one of the two lesson links is set. |
| `lesson_feedback.coaching_lesson_id` → `coaching_lessons` | optional | Deleted with it |  | Set when the feedback is on a coaching lesson. Exactly one of the two lesson links is set. |
| `mock_meetings.rep_id` → `users` | needed | Blocked | ✔ | The rep who practised. |
| `mock_meetings.source_meeting_id` → `meetings` | optional | Blocked | ✔ | The analysed call the role-play was built from. |
| `mock_meeting_focus_cues.mock_meeting_id` → `mock_meetings` | many-to-many link | Deleted with it |  | The mock meeting. |
| `mock_meeting_focus_cues.cue_id` → `cues` | many-to-many link | Blocked |  | A cue the mock meeting focused on. |
| `mock_meeting_points.mock_meeting_id` → `mock_meetings` | needed | Deleted with it |  | The mock meeting the point belongs to. |
| `live_assist_sessions.user_id` → `users` | needed | Blocked | ✔ | The rep who ran the session. |
| `live_assist_sessions.meeting_id` → `meetings` | optional | Blocked | ✔ | The analysed call the session was prepared from. |

### Automation & AI

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `automations.created_by` → `users` | needed | Blocked | ✔ | Who created the automation. |
| `automation_runs.automation_id` → `automations` | needed | Deleted with it |  | The automation that ran. |
| `automation_runs.meeting_id` → `meetings` | optional | Link cleared |  | The meeting it ran on, if any. |
| `automation_runs.lead_id` → `leads` | optional | Link cleared |  | The deal it ran on, if any. |
| `chat_threads.user_id` → `users` | needed | Blocked | ✔ | Who owns the conversation. Only they can read it. |
| `chat_threads.lead_id` → `leads` | optional | Blocked | ✔ | The deal the question was asked from, if any. |
| `chat_messages.thread_id` → `chat_threads` | needed | Deleted with it |  | The conversation the message belongs to. |

## Company-owned tables

Each table below has a needed `tenant_id → tenants`. The rows are **deleted with the company**, and each table has an index that starts with `tenant_id`. Tables with another kind of company link (`users`, `cues`, `practice_catalog`, `platform_audit_log`) are in the tables above.

- **Tenants & people:** `invitations`, `manager_assignments`, `notifications`, `audit_log`
- **Billing & credits:** `credit_transactions`, `invoices`
- **Integrations:** `integrations`, `integration_sync_runs`, `integration_events`, `crm_stage_mappings`, `crm_activities`
- **Leads:** `leads`
- **Meetings & analysis:** `media_files`, `meetings`
- **Cues & knowledge:** `knowledge_sources`, `company_documents`, `knowledge_chunks`
- **Practice & coaching:** `practice_lessons`, `coaching_programs`, `practice_attempts`, `lesson_feedback`, `mock_meetings`, `live_assist_sessions`
- **Automation & AI:** `automations`, `chat_threads`

## Same-company keys (36)

These links are composite keys on `(tenant_id, id)`, so a row can never point at another company's row:

`users.manager_id` → `users`, `invitations.manager_id` → `users`, `invitations.invited_by` → `users`, `manager_assignments.rep_id` → `users`, `manager_assignments.manager_id` → `users`, `notifications.user_id` → `users`, `integrations.connected_by` → `users`, `integration_sync_runs.integration_id` → `integrations`, `integration_events.integration_id` → `integrations`, `crm_activities.integration_id` → `integrations`, `crm_activities.owner_user_id` → `users`, `leads.owner_id` → `users`, `media_files.uploaded_by` → `users`, `meetings.rep_id` → `users`, `meetings.lead_id` → `leads`, `meetings.integration_id` → `integrations`, `meetings.media_file_id` → `media_files`, `meetings.crm_activity_id` → `crm_activities`, `knowledge_sources.created_by` → `users`, `company_documents.uploaded_by` → `users`, `practice_lessons.owner_id` → `users`, `practice_lessons.created_by` → `users`, `practice_lessons.meeting_id` → `meetings`, `practice_lessons.lead_id` → `leads`, `coaching_programs.lead_id` → `leads`, `coaching_programs.rep_id` → `users`, `practice_attempts.user_id` → `users`, `lesson_feedback.rep_id` → `users`, `lesson_feedback.manager_id` → `users`, `mock_meetings.rep_id` → `users`, `mock_meetings.source_meeting_id` → `meetings`, `live_assist_sessions.user_id` → `users`, `live_assist_sessions.meeting_id` → `meetings`, `automations.created_by` → `users`, `chat_threads.user_id` → `users`, `chat_threads.lead_id` → `leads`

## Relations worth knowing

**One call, three tables.** A phone call reaches SellMore from two places. `crm_activities` holds what Salesforce knows (who, when, outcome, summary). `media_files` holds the audio from Drive. `meetings` joins them: `meetings.crm_activity_id → crm_activities.external_id` and `meetings.media_file_id → media_files.id`. Either may be empty for a while (`awaiting_audio`, `unmatched`).

**Self-links.** `users.manager_id → users` (a rep's manager). `cues.overrides_cue_id → cues` (a company cue replacing a platform default).

**Either / or links.** `practice_attempts` and `lesson_feedback` point at *either* a `practice_lessons` row *or* a `coaching_lessons` row, never both and never neither (a check enforces it). `knowledge_chunks` points at *either* a source *or* a document.

**Joins that are not a foreign key.** `meetings.crm_activity_id` joins on Salesforce's own id (`external_id`), not on the SellMore uuid, so a re-import is recognised.

**Text, tags and vectors.** Search-by-meaning vectors (`embeddings`, `meetings.summary_embeddings`) live next to the text they describe on `transcript_segments`, `chat_messages`, `knowledge_chunks`, `company_documents` and `meetings`, with the `embedding_model` that made them. Raw copies (`raw_text`, `raw_output`) sit beside the cleaned text. Both follow their row's access rule, and the raw copies and turn vectors of a call are cleared when its recording expires.

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
