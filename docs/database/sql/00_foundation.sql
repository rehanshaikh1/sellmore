CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- Database roles. Passwords / login are granted outside this file (secrets manager).
--   sellmore_app    the API. Subject to row level security. Cannot read tokens or password hashes.
--   sellmore_worker import, transcription and scheduling jobs. Bypasses row level security, no DDL.
--   sellmore_auth   sign-in, invitations and password reset. Bypasses row level security, narrow grants.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sellmore_app')    THEN CREATE ROLE sellmore_app    NOLOGIN NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sellmore_worker') THEN CREATE ROLE sellmore_worker NOLOGIN BYPASSRLS;   END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sellmore_auth')   THEN CREATE ROLE sellmore_auth   NOLOGIN BYPASSRLS;   END IF;
END $$;

-- Who is asking. The API sets these with SET LOCAL at the start of every transaction.
CREATE FUNCTION app_user_id()   RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
CREATE FUNCTION app_tenant_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;
CREATE FUNCTION app_role()      RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.role', true), '') $$;

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- Ledgers and audit trails are append only. A tenant purge (cascade from tenants) is the one allowed delete.
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  RAISE EXCEPTION '% is append only', TG_TABLE_NAME USING ERRCODE = '42501';
END $$;
