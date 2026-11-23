-- Sample data for every table in schema.sql, written so that real rows exist for each important combination.
-- Load it into an empty database that already has schema.sql applied:
--   psql -v ON_ERROR_STOP=1 --single-transaction -d sellmore_sample -f sample_data/00_helpers.sql -f sample_data/10_platform.sql ...
-- (build_workbook.py does all of this and writes the Excel file.)
--
-- Every id is readable: the first part is the table number in the workbook, the last part is the row number.
--   s.id(7, 4) = 00000007-0000-0000-0000-000000000004 = row 4 of table 7 (client_users)
-- Everything is real data for the constraints and triggers in schema.sql: if a row broke a rule, the load would stop.
SET timezone = 'UTC';

CREATE SCHEMA s;
CREATE FUNCTION s.id(p_table int, p_n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $$ SELECT (lpad(p_table::text, 8, '0') || '-0000-0000-0000-' || lpad(p_n::text, 12, '0'))::uuid $$;
CREATE FUNCTION s.sha(p_text text) RETURNS text LANGUAGE sql IMMUTABLE AS
  $$ SELECT encode(sha256(convert_to(p_text, 'UTF8')), 'hex') $$;
CREATE FUNCTION s.blob(p_seed text) RETURNS bytea LANGUAGE sql IMMUTABLE AS
  $$ SELECT decode(md5(p_seed || '1') || md5(p_seed || '2') || md5(p_seed || '3'), 'hex') $$;           -- 48 stand-in bytes
CREATE FUNCTION s.vec(p_seed int) RETURNS halfvec LANGUAGE sql IMMUTABLE AS
  $$ SELECT (array(SELECT round(sin(p_seed * g * 0.0137)::numeric, 4)::real FROM generate_series(1, 1536) g))::real[]::halfvec(1536) $$;
-- Pretend to be a signed-in user, the way the API does. The audit triggers then stamp created_by, updated_by and deleted_by.
CREATE FUNCTION s.act_as(p_role text, p_user uuid, p_client uuid) RETURNS void LANGUAGE sql AS
  $$ SELECT set_config('app.role', coalesce(p_role, ''), false), set_config('app.user_id', coalesce(p_user::text, ''), false), set_config('app.client_id', coalesce(p_client::text, ''), false) $$;
CREATE FUNCTION s.act_as_owner() RETURNS void LANGUAGE sql AS $$ SELECT s.act_as(NULL, NULL, NULL) $$;
