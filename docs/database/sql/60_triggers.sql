-- ================================================================
-- Rules the database enforces itself
-- ================================================================

-- users: one manager per rep, in the same company, and only an admin may change who someone is.
CREATE FUNCTION users_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_mgr users%ROWTYPE; v_actor text := app_role();
BEGIN
  IF TG_OP = 'UPDATE' AND v_actor IS NOT NULL AND v_actor NOT IN ('client_admin', 'super_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.manager_id IS DISTINCT FROM OLD.manager_id OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'only an admin can change role, manager, status or email' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF NEW.manager_id IS NOT NULL THEN
    SELECT * INTO v_mgr FROM users WHERE id = NEW.manager_id;
    IF NOT FOUND OR v_mgr.tenant_id IS DISTINCT FROM NEW.tenant_id OR v_mgr.role <> 'manager' THEN
      RAISE EXCEPTION 'manager_id must be a manager in the same company' USING ERRCODE = '23514';
    END IF;
    IF v_mgr.status <> 'active' OR v_mgr.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'that manager is not active' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_users_guard BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION users_guard();

-- users: the plan's seat limit. Locks the tenant row so two invites cannot both take the last seat.
CREATE FUNCTION users_seat_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_limit int; v_used int;
BEGIN
  IF NEW.tenant_id IS NULL OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.deleted_at IS NULL AND OLD.tenant_id = NEW.tenant_id THEN RETURN NEW; END IF;
  SELECT p.seat_limit INTO v_limit FROM tenants t JOIN plans p ON p.id = t.plan_id WHERE t.id = NEW.tenant_id FOR UPDATE OF t;
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_used FROM users
   WHERE tenant_id = NEW.tenant_id AND status = 'active' AND deleted_at IS NULL AND id <> NEW.id;
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'the plan allows % seats and all are used', v_limit USING ERRCODE = '53400';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_users_seat_limit BEFORE INSERT OR UPDATE OF status, tenant_id, deleted_at ON users FOR EACH ROW EXECUTE FUNCTION users_seat_limit();

-- users: keep the assignment history, and leave a manager's reps unassigned when that manager stops being one.
CREATE FUNCTION users_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.manager_id IS NOT NULL THEN
      INSERT INTO manager_assignments(tenant_id, rep_id, manager_id, assigned_by) VALUES (NEW.tenant_id, NEW.id, NEW.manager_id, app_user_id());
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    UPDATE manager_assignments SET ended_at = now() WHERE rep_id = NEW.id AND ended_at IS NULL;
    IF NEW.manager_id IS NOT NULL THEN
      INSERT INTO manager_assignments(tenant_id, rep_id, manager_id, assigned_by) VALUES (NEW.tenant_id, NEW.id, NEW.manager_id, app_user_id());
    END IF;
    INSERT INTO audit_log(tenant_id, actor_id, action, entity_type, entity_id, detail)
    VALUES (NEW.tenant_id, app_user_id(), 'rep.reassigned', 'user', NEW.id, jsonb_build_object('from', OLD.manager_id, 'to', NEW.manager_id));
  END IF;
  IF OLD.role = 'manager' AND (NEW.role <> 'manager' OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL) THEN
    UPDATE users SET manager_id = NULL WHERE manager_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_users_after AFTER INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION users_after();

-- leads: restart "days in stage" when the stage changes.
CREATE FUNCTION leads_stage_clock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN NEW.stage_changed_at := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_leads_stage_clock BEFORE UPDATE OF stage ON leads FOR EACH ROW EXECUTE FUNCTION leads_stage_clock();

-- meetings: keep leads.last_meeting_at correct without the app doing it.
CREATE FUNCTION meetings_refresh_lead() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_lead uuid;
BEGIN
  FOR v_lead IN
    SELECT DISTINCT x FROM (VALUES (CASE WHEN TG_OP <> 'INSERT' THEN OLD.lead_id END), (CASE WHEN TG_OP <> 'DELETE' THEN NEW.lead_id END)) v(x)
    WHERE x IS NOT NULL
  LOOP
    UPDATE leads l SET last_meeting_at =
      (SELECT max(coalesce(m.meeting_at, m.uploaded_at)) FROM meetings m WHERE m.lead_id = l.id AND m.deleted_at IS NULL)
    WHERE l.id = v_lead;
  END LOOP;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_meetings_refresh_lead AFTER INSERT OR DELETE OR UPDATE OF lead_id, meeting_at, deleted_at ON meetings
  FOR EACH ROW EXECUTE FUNCTION meetings_refresh_lead();

-- meeting_objections: an objection is always something the buyer said, in the same meeting.
CREATE FUNCTION objections_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.segment_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM transcript_segments s WHERE s.id = NEW.segment_id AND s.meeting_id = NEW.meeting_id AND s.speaker_role = 'prospect') THEN
    RAISE EXCEPTION 'an objection must point at a buyer line of the same meeting' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_meeting_objections_check BEFORE INSERT OR UPDATE ON meeting_objections FOR EACH ROW EXECUTE FUNCTION objections_check();

-- media_files: stamp the delete-after date from the company's retention setting.
CREATE FUNCTION media_files_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.retention_until IS NULL THEN
    SELECT now() + make_interval(days => recording_retention_days) INTO NEW.retention_until FROM tenants WHERE id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_media_files_retention BEFORE INSERT ON media_files FOR EACH ROW EXECUTE FUNCTION media_files_retention();
