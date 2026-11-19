-- ================================================================
-- Views. security_invoker means the caller's row level security still applies.
-- ================================================================

-- Deal screen numbers: calls, analysed calls, last call, days in stage.
CREATE VIEW lead_stats WITH (security_invoker = true) AS
SELECT l.lead_id, u.client_id,
       count(m.meeting_id)                                                 AS call_count,
       count(m.meeting_id) FILTER (WHERE m.processing_status = 'analysed')         AS analysed_count,
       max(coalesce(m.meeting_at, m.uploaded_at))                          AS last_meeting_at,
       (now()::date - l.stage_changed_at::date)                            AS days_in_stage,
       (SELECT count(*) FROM lead_timeline_events e WHERE e.lead_id = l.lead_id AND e.type = 'email') AS email_count
FROM leads l
JOIN client_users u ON u.client_user_id = l.client_user_id
LEFT JOIN meetings m ON m.lead_id = l.lead_id AND m.deleted_at IS NULL
WHERE l.deleted_at IS NULL
GROUP BY l.lead_id, u.client_id;

-- Knowledge base "queries" column.
CREATE VIEW knowledge_usage WITH (security_invoker = true) AS
SELECT s.knowledge_source_id AS source_id, s.client_id, count(c.knowledge_citation_id) AS queries_count
FROM knowledge_sources s LEFT JOIN knowledge_citations c ON c.source_id = s.knowledge_source_id
WHERE s.deleted_at IS NULL
GROUP BY s.knowledge_source_id;

-- Seats and meetings used. The super admin sees every company, a client admin sees their own.
-- Counts only: this view runs as its owner so it can count rows the super admin may not read.
CREATE VIEW client_usage AS
SELECT t.client_id,
       (SELECT count(*) FROM client_users u WHERE u.client_id = t.client_id AND u.status = 'active' AND u.deleted_at IS NULL) AS seats_used,
       (SELECT count(*) FROM meetings m JOIN client_users u ON u.client_user_id = m.client_user_id WHERE u.client_id = t.client_id AND m.deleted_at IS NULL)                      AS meetings_used
FROM clients t
WHERE app_role() = 'super_admin' OR t.client_id = app_client_id();
