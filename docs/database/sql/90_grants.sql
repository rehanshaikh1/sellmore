-- ================================================================
-- Privileges. Row level security decides which rows, grants decide which tables and commands.
-- ================================================================
GRANT USAGE ON SCHEMA public TO sellmore_app, sellmore_worker, sellmore_auth;

-- API
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sellmore_app;
REVOKE ALL ON auth_identities, integration_credentials, integration_events FROM sellmore_app;
REVOKE UPDATE, DELETE ON credit_transactions, audit_log, platform_audit_log FROM sellmore_app;
REVOKE EXECUTE ON FUNCTION grant_credits(uuid, int, text, text, text), expire_media() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_credits(uuid, uuid, text, int, text, text, uuid), seed_salesforce_stage_mappings(uuid) TO sellmore_app, sellmore_worker;
GRANT EXECUTE ON FUNCTION grant_credits(uuid, int, text, text, text) TO sellmore_app, sellmore_worker;  -- the function itself refuses anyone but super_admin

-- Workers (imports, transcription, scheduler)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sellmore_worker;
REVOKE UPDATE, DELETE ON credit_transactions, audit_log, platform_audit_log FROM sellmore_worker;
GRANT EXECUTE ON FUNCTION expire_media() TO sellmore_worker;

-- Sign-in service
GRANT SELECT ON tenants, plans, users, invitations TO sellmore_auth;
GRANT INSERT, UPDATE ON users, invitations TO sellmore_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_identities TO sellmore_auth;
GRANT INSERT ON audit_log TO sellmore_auth;
