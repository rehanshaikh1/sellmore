# SellMore database: how the tables relate

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

## Tables by area

### Platform (super admin)

| Table | What it is |
|---|---|
| `platform_owner_users` | The people who own and run the SellMore platform (the super admins). Kept apart from client users. |
| `plans` | Plan catalogue: price, free trial length, seat and meeting limits, monthly credits. |
| `plan_features` | Which features each plan unlocks (crm_sync, live_assist, ...). |
| `platform_limits` | Platform-wide limits as key and value rows (allowed formats, file size, duration, invite expiry). A new limit is a new row. |
| `platform_audit_log` | What super admins did on the platform. Append only. |

### Clients & people

| Table | What it is |
|---|---|
| `clients` | A client company: plan, status, free trial end, credit balance, recording retention. |
| `client_users` | Everyone who works for a client: client admins, managers and sales reps. Holds the role, the rep's one manager, Salesforce user id and phone extension. |
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

### Practice

| Table | What it is |
|---|---|
| `practice_catalog` | Practice lesson templates: platform-wide or company-specific. |
| `practice_lessons` | A lesson a user builds from the cues they fell short on. |
| `practice_lesson_cues` | The cues a practice lesson covers. |
| `practice_programs` | AI-built practice for one rep on one deal. |
| `practice_program_meetings` | The analysed calls a practice programme was built from. |
| `practice_program_lessons` | The ordered lessons inside a practice programme. |
| `practice_attempts` | A rep's typed reply to a practice situation, with its score. |
| `lesson_feedback` | A manager's written feedback on a rep's lesson. |
| `mock_meetings` | An AI call-prep (mock buyer) session and its results. |
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
| `plans.created_by` → `platform_owner_users` | optional | Link cleared |  | The platform owner who created the row. Empty when a sync, an import or an AI job did. |
| `plans.updated_by` → `platform_owner_users` | optional | Link cleared |  | The platform owner who last changed the row. Empty when the system did. |
| `plan_features.plan_id` → `plans` | needed | Deleted with it |  | The plan the feature belongs to. |
| `platform_limits.created_by` → `platform_owner_users` | optional | Link cleared |  | The platform owner who created the row. Empty when a sync, an import or an AI job did. |
| `platform_limits.updated_by` → `platform_owner_users` | optional | Link cleared |  | The platform owner who last changed the limits. |
| `platform_audit_log.actor_id` → `platform_owner_users` | needed | Blocked |  | The platform owner who acted. |
| `platform_audit_log.client_id` → `clients` | optional | Link cleared |  | The company the action was about, if any. |

### Clients & people

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `clients.plan_id` → `plans` | needed | Blocked |  | The plan the company is on. |
| `clients.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `client_users.manager_id` → `client_users` | optional | Blocked | ✔ | A rep's one manager. Self-link on client_users. Must be an active manager of the same company. |
| `client_users.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `client_users.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `client_users.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `auth_identities.user_id` → `client_users` | optional | Deleted with it |  | The client user this sign-in method belongs to. A user can have several (password, Google, ...). Exactly one of user_id and platform_owner_user_id is set. |
| `auth_identities.platform_owner_user_id` → `platform_owner_users` | optional | Deleted with it |  | The platform owner this sign-in method belongs to, when it is not a client user. |
| `invitations.manager_id` → `client_users` | optional | Blocked | ✔ | The manager a new rep will report to. Reps only. |
| `invitations.invited_by` → `client_users` | needed | Blocked | ✔ | Who sent the invitation. |
| `invitations.accepted_user_id` → `client_users` | optional | Link cleared |  | The user created when the invitation was accepted. |
| `invitations.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `manager_assignments.client_user_id` → `client_users` | needed | Deleted with it |  | The rep. One row has ended_at empty: the current assignment. |
| `manager_assignments.manager_id` → `client_users` | optional | Blocked |  | The manager in this period. Empty means the rep was unassigned. |
| `manager_assignments.assigned_by` → `client_users` | optional | Link cleared |  | Who made the change. Empty for the system. |
| `notifications.client_user_id` → `client_users` | needed | Deleted with it |  | Who the notification is for. The company comes from this user. |
| `audit_log.actor_id` → `client_users` | optional | Link cleared |  | Who did it. Empty for system actions. |

### Billing & credits

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `credit_transactions.user_id` → `client_users` | optional | Link cleared |  | Who triggered the charge. |

### Integrations

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `integrations.connected_by` → `client_users` | optional | Blocked | ✔ | The admin who connected it. |
| `integrations.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `integrations.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `integration_credentials.integration_id` → `integrations` | one-to-one | Deleted with it |  | The connection the tokens belong to. One row per connection. |
| `integration_sync_runs.integration_id` → `integrations` | needed | Blocked | ✔ | The connection that was synced. |
| `integration_events.integration_id` → `integrations` | needed | Blocked | ✔ | The connection the event arrived on. |
| `crm_stage_mappings.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `crm_stage_mappings.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `crm_activities.integration_id` → `integrations` | needed | Blocked | ✔ | The Salesforce connection it was fetched through. |
| `crm_activities.owner_user_id` → `client_users` | optional | Blocked | ✔ | The SellMore user who owns the call, found from the Salesforce owner or the phone extension. |

### Leads

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `leads.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who owns the deal. This decides who can see it, and the company comes from this rep (client_users.client_id), so a deal has no company column of its own. |
| `leads.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `leads.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `leads.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `lead_stakeholders.lead_id` → `leads` | needed | Deleted with it |  | The deal the contact is on. Contacts are never merged across deals. |
| `lead_stakeholders.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `lead_stakeholders.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `lead_timeline_events.lead_id` → `leads` | needed | Deleted with it |  | The deal the entry is on. |
| `lead_timeline_events.meeting_id` → `meetings` | optional | Link cleared |  | The meeting the entry is about, for meeting entries. |
| `lead_timeline_events.author_id` → `client_users` | optional | Link cleared |  | Who wrote the entry, if a person did. |
| `lead_timeline_events.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `lead_risks.lead_id` → `leads` | needed | Deleted with it |  | The deal the risk is on. |
| `lead_risks.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `lead_risks.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |

### Meetings & analysis

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `media_files.uploaded_by` → `client_users` | optional | Blocked | ✔ | Who uploaded the file. Empty when fetched from Drive. |
| `media_files.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `media_files.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `meetings.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who made the call. This decides who can see it, and the company comes from this rep. |
| `meetings.lead_id` → `leads` | optional | Blocked |  | The deal it belongs to. Empty for a call without a deal. |
| `meetings.integration_id` → `integrations` | optional | Blocked |  | The connection it was fetched through. |
| `meetings.media_file_id` → `media_files` | optional | Blocked |  | The audio file. Empty while the audio has not arrived. One meeting per file. |
| `meetings.crm_activity_id` → `crm_activities` | optional | Blocked |  | The Salesforce call record this meeting came from. A call record can become only one meeting. |
| `meetings.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `meetings.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `meetings.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
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
| `cues.client_id` → `clients` | optional | Deleted with it |  | Empty = platform default cue. Set = that company's override or custom cue. |
| `cues.overrides_cue_id` → `cues` | optional | Blocked |  | The platform default cue that this company cue replaces. At most one override per cue per company. |
| `cues.updated_by` → `client_users` | optional | Link cleared |  | The client user who last edited the cue. |
| `cues.updated_by_owner_id` → `platform_owner_users` | optional | Link cleared |  | The platform owner who last edited a platform default cue. At most one of the two editor links is set. |
| `cues.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `cues.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `knowledge_sources.created_by` → `client_users` | needed | Blocked | ✔ | Who added it. |
| `knowledge_sources.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `knowledge_sources.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `company_documents.uploaded_by` → `client_users` | needed | Blocked | ✔ | Who uploaded it. |
| `company_documents.tagged_cue_id` → `cues` | optional | Link cleared |  | The cue this document is evidence for. |
| `company_documents.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `company_documents.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `knowledge_chunks.source_id` → `knowledge_sources` | optional | Deleted with it |  | Set when the chunk comes from a knowledge source. Exactly one of source_id and document_id is set. |
| `knowledge_chunks.document_id` → `company_documents` | optional | Deleted with it |  | Set when the chunk comes from a company document. Exactly one of document_id and source_id is set. |
| `knowledge_citations.source_id` → `knowledge_sources` | needed | Deleted with it |  | The source that was cited. |
| `knowledge_citations.user_id` → `client_users` | optional | Link cleared |  | Who was using the AI feature. |
| `knowledge_citations.meeting_id` → `meetings` | optional | Link cleared |  | The meeting where the source was used, if any. |

### Practice

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `practice_catalog.client_id` → `clients` | optional | Deleted with it |  | Empty = platform-wide template. Set = that company's own. |
| `practice_catalog.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `practice_catalog.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `practice_lessons.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who practises it. This decides who can see it. |
| `practice_lessons.created_by` → `client_users` | needed | Blocked |  | Who built the lesson: the rep, or a manager on the rep's behalf. |
| `practice_lessons.meeting_id` → `meetings` | optional | Blocked |  | The call, for lessons built from one call. |
| `practice_lessons.lead_id` → `leads` | optional | Blocked |  | The deal, for lessons built from a whole deal. |
| `practice_lessons.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `practice_lessons.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `practice_lesson_cues.lesson_id` → `practice_lessons` | many-to-many link | Deleted with it |  | The lesson. |
| `practice_lesson_cues.cue_id` → `cues` | many-to-many link | Blocked |  | A cue the lesson covers. |
| `practice_programs.lead_id` → `leads` | needed | Blocked |  | The deal being practised. One programme per deal per rep. |
| `practice_programs.client_user_id` → `client_users` | needed | Deleted with it |  | The rep practising. This decides who can see it. |
| `practice_programs.created_by` → `client_users` | optional | Link cleared |  | The client user who created the row. Empty when a sync, an import or an AI job did. |
| `practice_programs.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `practice_program_meetings.program_id` → `practice_programs` | many-to-many link | Deleted with it |  | The programme. |
| `practice_program_meetings.meeting_id` → `meetings` | many-to-many link | Deleted with it |  | A call the programme was built from. |
| `practice_program_lessons.program_id` → `practice_programs` | needed | Deleted with it |  | The programme the lesson belongs to. |
| `practice_program_lessons.evidence_meeting_id` → `meetings` | optional | Link cleared |  | The call the lesson uses as evidence, so it can be opened. |
| `practice_attempts.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who wrote the reply. |
| `practice_attempts.lesson_id` → `practice_lessons` | optional | Deleted with it |  | Set when the reply is to a practice lesson. Exactly one of the two lesson links is set. |
| `practice_attempts.program_lesson_id` → `practice_program_lessons` | optional | Deleted with it |  | Set when the reply is to a programme lesson. Exactly one of the two lesson links is set. |
| `lesson_feedback.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who practised. This decides who can see it. |
| `lesson_feedback.manager_id` → `client_users` | needed | Blocked |  | Who wrote the feedback. |
| `lesson_feedback.lesson_id` → `practice_lessons` | optional | Deleted with it |  | Set when the feedback is on a practice lesson. Exactly one of the two lesson links is set. |
| `lesson_feedback.program_lesson_id` → `practice_program_lessons` | optional | Deleted with it |  | Set when the feedback is on a programme lesson. Exactly one of the two lesson links is set. |
| `lesson_feedback.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `mock_meetings.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who practised. |
| `mock_meetings.source_meeting_id` → `meetings` | optional | Blocked |  | The analysed call the call prep was built from. |
| `mock_meetings.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `mock_meeting_focus_cues.mock_meeting_id` → `mock_meetings` | many-to-many link | Deleted with it |  | The mock meeting. |
| `mock_meeting_focus_cues.cue_id` → `cues` | many-to-many link | Blocked |  | A cue the mock meeting focused on. |
| `mock_meeting_points.mock_meeting_id` → `mock_meetings` | needed | Deleted with it |  | The mock meeting the point belongs to. |
| `live_assist_sessions.client_user_id` → `client_users` | needed | Deleted with it |  | The rep who ran the session. |
| `live_assist_sessions.meeting_id` → `meetings` | optional | Blocked |  | The analysed call the session was prepared from. |

### Automation & AI

| Relation (child → parent) | Link | If the parent is deleted | Same company | Meaning |
|---|---|---|---|---|
| `automations.created_by` → `client_users` | needed | Blocked | ✔ | Who created the automation. |
| `automations.updated_by` → `client_users` | optional | Link cleared |  | The client user who last changed the row. Empty when the system did. |
| `automations.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `automation_runs.automation_id` → `automations` | needed | Deleted with it |  | The automation that ran. |
| `automation_runs.meeting_id` → `meetings` | optional | Link cleared |  | The meeting it ran on, if any. |
| `automation_runs.lead_id` → `leads` | optional | Link cleared |  | The deal it ran on, if any. |
| `chat_threads.client_user_id` → `client_users` | needed | Deleted with it |  | Who owns the conversation. Only they can read it. The company comes from this user. |
| `chat_threads.lead_id` → `leads` | optional | Blocked |  | The deal the question was asked from, if any. |
| `chat_threads.deleted_by` → `client_users` | optional | Link cleared |  | The client user who deleted the row. Set together with `deleted_at`. |
| `chat_messages.thread_id` → `chat_threads` | needed | Deleted with it |  | The conversation the message belongs to. |

## Company-owned tables

Each table below has a needed `client_id → clients`. The rows are **deleted with the company**, and each table has an index that starts with `client_id`. Tables with another kind of company link (`client_users`, `cues`, `practice_catalog`, `platform_audit_log`, and the tables that belong to one person through `client_user_id`) are in the tables above.

- **Clients & people:** `client_users`, `invitations`, `audit_log`
- **Billing & credits:** `credit_transactions`, `invoices`
- **Integrations:** `integrations`, `integration_sync_runs`, `integration_events`, `crm_stage_mappings`, `crm_activities`
- **Meetings & analysis:** `media_files`
- **Cues & knowledge:** `knowledge_sources`, `company_documents`, `knowledge_chunks`
- **Automation & AI:** `automations`

## Same-company keys (12)

These links are composite keys on `(client_id, <the table's own id>)`, so a row can never point at another company's row:

`client_users.manager_id` → `client_users`, `invitations.manager_id` → `client_users`, `invitations.invited_by` → `client_users`, `integrations.connected_by` → `client_users`, `integration_sync_runs.integration_id` → `integrations`, `integration_events.integration_id` → `integrations`, `crm_activities.integration_id` → `integrations`, `crm_activities.owner_user_id` → `client_users`, `media_files.uploaded_by` → `client_users`, `knowledge_sources.created_by` → `client_users`, `company_documents.uploaded_by` → `client_users`, `automations.created_by` → `client_users`

## Relations worth knowing

**One call, three tables.** A phone call reaches SellMore from two places. `crm_activities` holds what Salesforce knows (who, when, outcome, summary). `media_files` holds the audio from Drive. `meetings` joins them: `meetings.crm_activity_id → crm_activities.crm_activity_id` and `meetings.media_file_id → media_files.media_file_id`. Either may be empty for a while (`awaiting_audio`, `unmatched`).

**Self-links.** `client_users.manager_id → client_users` (a rep's manager). `cues.overrides_cue_id → cues` (a company cue replacing a platform default).

**Either / or links.** `practice_attempts` and `lesson_feedback` point at *either* a `practice_lessons` row *or* a `practice_program_lessons` row, never both and never neither (a check enforces it). `knowledge_chunks` points at *either* a source *or* a document.

**Company by person, checked by trigger.** Tables that belong to one person have no `client_id`: they name the person (`client_user_id`) and the company is that person's. A trigger (`same_company_links`) refuses a row that points at anything from another company, such as a meeting pointing at another company's deal, audio file or call record.

**Text, tags and vectors.** Search-by-meaning vectors (`embeddings`, `meetings.summary_embeddings`) live next to the text they describe on `transcript_segments`, `chat_messages`, `knowledge_chunks`, `company_documents` and `meetings`, with the `embedding_model` that made them. Raw copies (`raw_text`, `raw_output`) sit beside the cleaned text. Both follow their row's access rule, and the raw copies and turn vectors of a call are cleared when its recording expires.

**Standard columns.** Every table key is named after its table (`client_users.client_user_id`, `meetings.meeting_id`), so a join reads the same on both sides. Every table has `created_at`, and tables whose rows change have `updated_at`. Tables that people create or edit also record `created_by`, `updated_by` and, where rows are hidden instead of removed, `deleted_by`. The database fills these in from the signed-in user, so the API cannot forget or forge them. They stay empty when a sync, an import or an AI job did the work, and when a super admin acted inside a company (that goes to `platform_audit_log`).

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
