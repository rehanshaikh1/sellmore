-- ================================================================
-- Views. security_invoker means the caller's row level security still applies.
-- ================================================================

-- Deal screen numbers: calls, analysed calls, last call, days in stage.
CREATE VIEW lead_stats WITH (security_invoker = true) AS
SELECT l.id AS lead_id, l.tenant_id,
       count(m.id)                                                         AS call_count,
       count(m.id) FILTER (WHERE m.processing_status = 'analysed')         AS analysed_count,
       max(coalesce(m.meeting_at, m.uploaded_at))                          AS last_meeting_at,
       (now()::date - l.stage_changed_at::date)                            AS days_in_stage,
       (SELECT count(*) FROM lead_timeline_events e WHERE e.lead_id = l.id AND e.type = 'email') AS email_count
FROM leads l
LEFT JOIN meetings m ON m.lead_id = l.id AND m.deleted_at IS NULL
WHERE l.deleted_at IS NULL
GROUP BY l.id;

-- Knowledge base "queries" column.
CREATE VIEW knowledge_usage WITH (security_invoker = true) AS
SELECT s.id AS source_id, s.tenant_id, count(c.id) AS queries_count
FROM knowledge_sources s LEFT JOIN knowledge_citations c ON c.source_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id;

-- Seats and meetings used. The super admin sees every company, a client admin sees their own.
-- Counts only: this view runs as its owner so it can count rows the super admin may not read.
CREATE VIEW tenant_usage AS
SELECT t.id AS tenant_id,
       (SELECT count(*) FROM users u WHERE u.tenant_id = t.id AND u.status = 'active' AND u.deleted_at IS NULL) AS seats_used,
       (SELECT count(*) FROM meetings m WHERE m.tenant_id = t.id AND m.deleted_at IS NULL)                      AS meetings_used
FROM tenants t
WHERE app_role() = 'super_admin' OR t.id = app_tenant_id();
