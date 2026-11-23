# SellMore database

PostgreSQL 15+ with the `pgvector` extension (0.7 or newer). 53 tables, 148 foreign keys, row level security on every table.

| File | What it is |
|---|---|
| `schema_def.py` | The tables, columns, keys, checks and access mode of each table. **Edit this.** |
| `sql/*.sql` | Hand-written parts: roles, functions, triggers, views, grants, seed data. **Edit these.** |
| `relations_notes.py` | One-line meaning of every table and every foreign key. **Edit this** when you add either; the generator refuses to run without it. |
| `generate.py` | Builds `schema.sql`, `schema.json`, `RELATIONS.md` and the data inside `er-diagram.html`. |
| `schema.sql` | Generated. The full schema, applied in one transaction. |
| `er-diagram.html` | The picture, with a role access table and design notes. |
| `RELATIONS.md` | Generated reference: every table, and every relation with its meaning, delete behaviour and same-company check. |
| `tests/verify.sql` | 125 behaviour checks (scoping, reassignment, limits, ledgers, tags, vectors, retention). |
| `sample_data/` | Example rows for all 53 tables, as SQL (`NN_*.sql`) plus `build_workbook.py`. The SQL loads into a database that already has `schema.sql`, so every row passed the real constraints and triggers. |
| `table-data-sample.xlsx` | Generated from `sample_data/`. One block per table: heading, one-line description, column names, then the example rows, plus a Contents sheet. Run `python3 sample_data/build_workbook.py` to rebuild it (needs PostgreSQL with pgvector and `openpyxl`). |

```bash
python3 generate.py
createdb sellmore_test
psql -v ON_ERROR_STOP=1 --single-transaction -d sellmore_test -f schema.sql
psql -d sellmore_test -f tests/verify.sql      # prints PASS / FAIL, then rolls back
```

## 1. The client organization is `clients`

One row per customer company. Every table that holds a company's data has a `client_id`, except the tables that belong to one person: deals, meetings, manager assignments, practice lessons, practice programmes, practice attempts, lesson feedback, mock meetings, Live Assist sessions, chat threads and notifications. Those store only that person (`client_user_id`) and take the company from them, and a trigger checks that anything they point at is in the same company.

```
plans ◄─ clients ─┬─ client_users (client_admin, manager, sales_rep; manager_id, crm_user_id, phone_extension)
                  ├─ invitations, notifications, audit_log, manager_assignments
                  ├─ integrations ─┬─ integration_credentials (encrypted tokens)
                  │                ├─ integration_sync_runs, integration_events
                  │                └─ crm_activities (Salesforce calls and meetings)
                  ├─ crm_stage_mappings
                  ├─ leads ─ lead_stakeholders, lead_risks, lead_timeline_events
                  ├─ media_files (audio) ─┐
                  ├─ meetings ◄───────────┘ ─ transcript_segments, meeting_cue_scores,
                  │                           meeting_objections, meeting_insights, analysis_runs
                  ├─ cues (company overrides of platform defaults)
                  ├─ knowledge_sources, company_documents, knowledge_chunks, knowledge_citations
                  ├─ practice_lessons, practice_programs ─ practice_program_lessons
                  ├─ practice_attempts, lesson_feedback, mock_meetings, live_assist_sessions
                  ├─ automations ─ automation_runs, chat_threads ─ chat_messages
                  └─ credit_transactions, invoices
```

Only `cues` / `practice_catalog` (platform defaults) may have a null `client_id`. Every `client_users` row belongs to a company; platform owners are a separate table, `platform_owner_users`.

## 2. Who can see what

The API connects as `sellmore_app` and, at the start of every transaction, runs:

```sql
SET LOCAL app.user_id = '<uuid>';  SET LOCAL app.client_id = '<uuid>';  SET LOCAL app.role = '<role>';
```

Row level security reads those three values. The rule is one function, `app_can_access_owner(owner_id)`:

| Role | Sees |
|---|---|
| `client_admin` | everything in their company |
| `manager` | themselves and the reps whose `client_users.manager_id` is them |
| `sales_rep` | themselves |
| `super_admin` | platform tables only (plans, limits, clients, client_users, platform_owner_users). Counts through the `client_usage` view. No meetings, deals or documents. |

An unassigned rep (`manager_id` NULL) is seen by the admin and the rep only. The team is never stored twice: it comes from `client_users.manager_id`, and every change is kept in `manager_assignments` and `audit_log`.

Three database roles: `sellmore_app` (API, subject to RLS, cannot read tokens or password hashes), `sellmore_worker` (imports, transcription, scheduler; bypasses RLS, no DDL), `sellmore_auth` (sign-in and invitations; bypasses RLS, narrow grants).

## 3. How the app's data maps to columns

| App (`src/types`) | Database |
|---|---|
| `User.companyName` | `clients.name` via `client_users.client_id` |
| `TeamMember.invitationStatus` | pending / expired / revoked in `invitations`; an accepted invite is a `client_users` row |
| `TeamMember.managerId` | `client_users.manager_id` |
| `TeamMember.dealsCount / meetingsCount` | counts over `leads.client_user_id` and `meetings.client_user_id` |
| `MeetingRecord.processingStatus` Analysed / Processing / Failed | `analysed` / (`awaiting_audio`, `queued`, `transcribing`, `analysing`) / `failed` (`unmatched` shows as Processing with a notice) |
| `MeetingRecord.source` upload / crm / drive | `meetings.source`: how the meeting entered SellMore |
| `MeetingRecord.fileFormat / fileSize` | `media_files.file_format / size_bytes` |
| `MeetingRecord.crmActivityId` | `crm_activities.external_id`, reached through `meetings.crm_activity_id` |
| `MeetingRecord.duration` (text) | `meetings.duration_sec`, formatted in the UI |
| `DealRecord.crmId`, `rawStage`, `ownerCrmId` | `leads.crm_id`, `raw_stage`, `owner_crm_id`; stage from `crm_stage_mappings` |
| `DealRecord.callCount`, `emailCount`, `timeInStage` | view `lead_stats` |
| `DealRecord.risks`, `stakeholders`, `timeline` | `lead_risks`, `lead_stakeholders`, `lead_timeline_events` |
| `SalesCue` per meeting | `meeting_cue_scores` |
| `MeetingObjection` | `meeting_objections` (`segment_id` is the buyer line, so the UI can highlight it) |
| `LessonSpec` | `practice_lessons` + `practice_lesson_cues` |
| `DealCoachingProgram` / `CoachingLesson` (called practice in the database) | `practice_programs` / `practice_program_lessons`; replies in `practice_attempts`, manager notes in `lesson_feedback` |
| `KnowledgeSource.queriesCount` | view `knowledge_usage` |
| `CuePrompt.overridesId` | `cues.overrides_cue_id` |
| `PlatformTenant.seatsUsed / meetingsUsed` | view `client_usage` |
| `CreditTransaction` | `credit_transactions` (`credits_consumed` is negative for credits added) |

## 4. Calls: two sources, one meeting

A phone call reaches SellMore from two places, at different times.

1. **Salesforce** (minutes after the call): the Task / Event becomes a `crm_activities` row (who, when, direction, outcome, the 5-line summary, recording link). A `meetings` row is created with `source = 'crm'` and `processing_status = 'awaiting_audio'`.
2. **Drive folder** (after the evening copy): the audio becomes a `media_files` row (`source = 'drive'`, `drive_file_id` is unique per company). The worker matches it to the meeting and sets `media_file_id`, `match_status`, and `queued`.
3. SellMore transcribes the audio itself (`transcript_segments` with `speaker_role`), analyses it (`analysis_runs`, `meeting_cue_scores`, `meeting_objections`) and charges credits with `consume_credits(...)`.

Unmatched audio keeps `match_status = 'unmatched'` for an admin to resolve. **Open question:** the match needs the Drive file name or metadata to carry a call id, a phone number, or a timestamp plus extension. The call-logging doc does not say how files are named. Until it does, the worker falls back to `meeting_at` + `users.phone_extension`, and ambiguous results are left for a person.

A call to a number that is not in Salesforce never reaches Salesforce, so it never reaches SellMore through the CRM route. Only the Drive route (as an unmatched file with no CRM call) or a manual upload can bring it in.

## 5. What the database enforces itself

- A row can only point at rows of the **same company** (composite keys on `(client_id, <the table's own id>)` where a table has `client_id`, and the `same_company_links` trigger where a table belongs to one person).
- One manager per rep, a real, active manager, in the same company. Only an admin can change a role, manager, status or email.
- A manager who is deactivated or demoted leaves their reps unassigned.
- The plan's **seat limit** (race-safe).
- A CRM call and a Drive file can each be imported **once**.
- An objection points at a **buyer** line of the same meeting.
- Credits: never negative, a retried request with the same key charges once, balance moves only through `consume_credits` / `grant_credits`.
- `credit_transactions`, `audit_log`, `platform_audit_log`: append only.
- Recording `retention_until` is stamped from the company's retention setting. `expire_media()` is the nightly job: it hides the file, and clears the raw speech-to-text, the turn vectors and the model's raw replies that came from it. The cleaned transcript and the analysis stay.
- `created_by`, `updated_by` and `deleted_by` are stamped by a trigger from the signed-in user (`set_audit_columns`), so the API cannot forget or forge them. A client's `created_by` cannot be changed after insert, restoring a row clears `deleted_by`, and a job with no signed-in user (a worker or migration) keeps the values it gives.
- Tags are lower case, at most 20 per row. Raw text is never stored on a user's chat message. Evidence and objections must point at a line of their own meeting. The same knowledge content or document file cannot be added twice in a company.

**Not enforced in the database** (the API or a worker does it): the monthly meeting quota, file type and size limits (read from `platform_limits`, one key and value row each), stage mapping at import time, resolving a Salesforce owner to a SellMore user by email, and refilling `monthly_credits`.

## 6. Running it in production

- **Migrations.** `schema.sql` is the baseline. After the first deploy, change the database with numbered migrations (dbmate, Flyway or Sqitch), and regenerate `schema.sql` from a migrated database. Never edit a deployed table by hand.
- **Connection pooling.** `SET LOCAL` works with PgBouncer in transaction mode. Do not use session mode with a shared role, and never `SET` (without `LOCAL`) the three `app.*` values.
- **Trust boundary.** `app.role` is set by the API. Anyone who can run arbitrary SQL as `sellmore_app` can set it, so keep the API free of SQL injection and keep `sellmore_worker` / `sellmore_auth` credentials out of the API process.
- **Secrets.** `integration_credentials` holds tokens encrypted with a KMS key (`key_version` supports rotation). Password hashes use argon2id.
- **Backups.** Point-in-time recovery on, restore tested monthly. A hard delete of a client cascades through everything; use `clients.deleted_at` for normal offboarding and purge on a schedule.
- **Growth.** Watch `transcript_segments`, `chat_messages`, `audit_log` and `integration_events`. Partition them by month or by hash of `meeting_id` once any passes about 100 million rows. Do not partition earlier.
- **Search.** Two kinds. Word search: `tsv` on `transcript_segments` and `knowledge_chunks`. Search by meaning: `halfvec` vectors with HNSW indexes on `transcript_segments.embeddings`, `chat_messages.embeddings`, `knowledge_chunks.embeddings`, `company_documents.embeddings` (one vector for the whole document) and `meetings.summary_embeddings`. Tag filters use GIN indexes on `tags`.
- **Embedding model.** The vector size is fixed in each column (`EMBED_DIM` in `schema_def.py`, now 1536). Pick the model first; to change it, change `EMBED_DIM`, regenerate, and re-embed using `embedding_model` / `embedded_at` to find stale rows. Leave `embeddings` empty for very short turns ("okay"). Never `SELECT *` from these tables in list screens.
- **Searching one company.** An HNSW index filters by company *after* it searches, so a small company can get fewer results than asked for. For large installations use pgvector's iterative scan (`SET hnsw.iterative_scan = relaxed_order`) or a partial index per large company.
- **Privacy.** `raw_text`, `raw_output` and embeddings are copies of call content. They follow their row's access rule, and `expire_media()` clears the call-dependent ones when the recording expires. Knowledge `raw_text` is company content and stays until the source is deleted.
- **Seed data.** `sql/95_seed.sql` loads plans, plan features and platform limits. The 12 platform cues are exported from `createDefaultPlatformCues()` in the app; load them before the first client.
- **Monitoring.** Alert on `integration_sync_runs.status = 'failed'`, meetings stuck in a non-final `processing_status` for more than an hour, and `integrations.last_sync_at` older than twice `sync_interval`.

## 7. Changes from the first design

People are in two tables, not one: `platform_owner_users` (the super admins who run SellMore, no company) and `client_users` (client admins, managers and sales reps, always in one company). The old single `users` table is gone. `auth_identities` has one link for each kind and a check that exactly one is set; `platform_audit_log.actor_id` and `platform_limits.updated_by` point at `platform_owner_users`. Actions a super admin takes inside a company (granting credits, moving a rep) leave `actor_id`, `user_id` or `assigned_by` empty on the company's own rows and are recorded in `platform_audit_log`.

Added 16 tables: `media_files`, `crm_activities`, `crm_stage_mappings`, `integration_credentials`, `integration_sync_runs`, `integration_events`, `analysis_runs`, `practice_programs`, `practice_program_meetings`, `practice_program_lessons`, `practice_catalog`, `knowledge_chunks`, `auth_identities`, `manager_assignments`, `audit_log`, `transcript_segment_cues`.

Moved file fields off `meetings` into `media_files`. Widened `processing_status` for the call flow. Added same-company keys, checks, soft delete, `updated_at`, real policies, triggers, views, grants and seed data. `lesson_feedback` and `practice_attempts` now carry `client_id` and the rep, so they follow the same access rule.

**Text, tags and vectors.** `raw_text` on `transcript_segments`, `knowledge_sources`, `company_documents` and (assistant messages only) `chat_messages`; `raw_output` on `analysis_runs`. `tags` on `transcript_segments`, `meetings`, `chat_messages`, `knowledge_sources` and `company_documents`. Vectors on `transcript_segments`, `chat_messages`, `knowledge_chunks`, `company_documents` and `meetings` (summary). Also `meeting_objections.category`, `meeting_cue_scores.evidence_segment_id` and `transcript_segment_cues` (the cues a line mentions, which the app already keeps as `cuesMentioned`).

**Key names, standard columns, key-value limits and free trials.**
- Every table's key is named after the table: `clients.client_id`, `client_users.client_user_id`, `meetings.meeting_id`, `plans.plan_id`. Link tables keep their two-column key. A foreign key that points straight at a table keeps the same name on both sides (`meetings.lead_id → leads.lead_id`); role names such as `manager_id` and `created_by` are unchanged.
- Standard columns are listed in one place, `STANDARD` in `schema_def.py`, and added by `with_standard_columns()`. Every table has `created_at`. Every table whose rows can change has `updated_at`; ledgers, logs, link tables and one-row-per-event tables do not. Tables that people create or edit also have `created_by` and `updated_by` (a client user, or a platform owner on `plans` and `platform_limits`), and the soft-deleted ones `deleted_by`. Soft delete (`deleted_at` + `deleted_by`) is on `clients`, `client_users`, `leads`, `meetings`, `media_files`, `knowledge_sources`, `company_documents`, `cues`, `automations`, `practice_lessons`, `mock_meetings` and `chat_threads`. A unique rule on a soft-deleted table ignores deleted rows (a partial index on `deleted_at IS NULL`), so a deleted name can be reused. Queries and views must add `deleted_at IS NULL`: row level security does not hide deleted rows. Not soft deleted on purpose: derived data (transcripts, chunks, scores), ledgers, logs and link tables. `uploaded_at`, `started_at` and similar columns stay as the business time and sit beside `created_at`. `clients` has no `*_by` columns because only a super admin creates and removes companies, and that is recorded in `platform_audit_log`.
- `platform_limits` is a key and value table: `limit_key` (snake_case, unique) and `limit_value` (JSON). It replaces the one-row table with `formats`, `max_file_size_mb`, `max_duration_min` and `invite_expiry_hours`. Those four are now rows (`allowed_formats`, `max_file_size_mb`, `max_duration_min`, `invite_expiry_hours`), and a new limit is a new row with no schema change.
- Free trial: `plans.trial_days` (empty = no trial) and `clients.trial_ends_at` (empty = not on a trial). The seed sets 14 days on Starter and Growth as placeholders. The database stores the dates; the API decides what a trial allows and what happens when it ends.
