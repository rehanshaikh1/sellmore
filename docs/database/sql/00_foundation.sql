CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector: halfvec columns and HNSW indexes for search by meaning (0.7 or newer)

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
CREATE FUNCTION app_client_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.client_id', true), '')::uuid $$;
CREATE FUNCTION app_role()      RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.role', true), '') $$;
-- The caller as a client user. Empty for a platform owner, who is not in client_users, so company rows never point at one.
CREATE FUNCTION app_client_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT CASE WHEN app_role() = 'super_admin' THEN NULL ELSE app_user_id() END $$;

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- Stamps created_by, updated_by and deleted_by from the session, so the API cannot forget or forge them.
--   argument 'client'   : the actor is the signed-in client user (empty for a super admin, who is not a client user)
--   argument 'platform' : the actor is the signed-in platform owner
-- A session with no role (a worker, a migration) keeps the values it was given. created_by never changes after insert.
CREATE FUNCTION set_audit_columns() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_actor uuid := CASE WHEN TG_ARGV[0] = 'platform' THEN (CASE WHEN app_role() = 'super_admin' THEN app_user_id() END) ELSE app_client_user_id() END;
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) END;
  v_patch jsonb := '{}'::jsonb;
BEGIN
  IF v_new ? 'created_by' THEN
    IF TG_OP = 'UPDATE' THEN v_patch := v_patch || jsonb_build_object('created_by', v_old->'created_by');
    ELSIF app_role() IS NOT NULL THEN v_patch := v_patch || jsonb_build_object('created_by', v_actor);
    END IF;
  END IF;
  IF v_new ? 'updated_by' AND app_role() IS NOT NULL THEN
    v_patch := v_patch || jsonb_build_object('updated_by', v_actor);
  END IF;
  IF v_new ? 'deleted_by' THEN
    IF v_new->'deleted_at' = 'null'::jsonb THEN
      v_patch := v_patch || jsonb_build_object('deleted_by', NULL);                    -- restored, or never deleted
    ELSIF app_role() IS NOT NULL AND (TG_OP = 'INSERT' OR v_old->'deleted_at' = 'null'::jsonb) THEN
      v_patch := v_patch || jsonb_build_object('deleted_by', v_actor);                 -- being deleted now
    ELSIF TG_OP = 'UPDATE' THEN
      v_patch := v_patch || jsonb_build_object('deleted_by', v_old->'deleted_by');     -- already deleted: keep who did it
    END IF;
  END IF;
  IF v_patch <> '{}'::jsonb THEN NEW := jsonb_populate_record(NEW, v_patch); END IF;
  RETURN NEW;
END $$;

-- Ledgers and audit trails are append only. A client purge (cascade from clients) is the one allowed delete.
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  RAISE EXCEPTION '% is append only', TG_TABLE_NAME USING ERRCODE = '42501';
END $$;
