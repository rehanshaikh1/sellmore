-- ================================================================
-- Rules the database enforces itself
-- ================================================================

-- client_users: one manager per rep, in the same company, and only an admin may change who someone is.
CREATE FUNCTION client_users_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_mgr client_users%ROWTYPE; v_actor text := app_role();
BEGIN
  IF TG_OP = 'UPDATE' AND v_actor IS NOT NULL AND v_actor NOT IN ('client_admin', 'super_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.manager_id IS DISTINCT FROM OLD.manager_id OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'only an admin can change role, manager, status or email' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF NEW.manager_id IS NOT NULL THEN
    SELECT * INTO v_mgr FROM client_users WHERE client_user_id = NEW.manager_id;
    IF NOT FOUND OR v_mgr.client_id IS DISTINCT FROM NEW.client_id OR v_mgr.role <> 'manager' THEN
      RAISE EXCEPTION 'manager_id must be a manager in the same company' USING ERRCODE = '23514';
    END IF;
    IF v_mgr.status <> 'active' OR v_mgr.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'that manager is not active' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_client_users_guard BEFORE INSERT OR UPDATE ON client_users FOR EACH ROW EXECUTE FUNCTION client_users_guard();

-- client_users: the plan's seat limit. Locks the client row so two invites cannot both take the last seat.
CREATE FUNCTION client_users_seat_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_limit int; v_used int;
BEGIN
  IF NEW.client_id IS NULL OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.deleted_at IS NULL AND OLD.client_id = NEW.client_id THEN RETURN NEW; END IF;
  SELECT p.seat_limit INTO v_limit FROM clients t JOIN plans p ON p.plan_id = t.plan_id WHERE t.client_id = NEW.client_id FOR UPDATE OF t;
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_used FROM client_users
   WHERE client_id = NEW.client_id AND status = 'active' AND deleted_at IS NULL AND client_user_id <> NEW.client_user_id;
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'the plan allows % seats and all are used', v_limit USING ERRCODE = '53400';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_client_users_seat_limit BEFORE INSERT OR UPDATE OF status, client_id, deleted_at ON client_users FOR EACH ROW EXECUTE FUNCTION client_users_seat_limit();

-- client_users: keep the assignment history, and leave a manager's reps unassigned when that manager stops being one.
CREATE FUNCTION client_users_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.manager_id IS NOT NULL THEN
      INSERT INTO manager_assignments(client_user_id, manager_id, assigned_by) VALUES (NEW.client_user_id, NEW.manager_id, app_client_user_id());
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    UPDATE manager_assignments SET ended_at = now() WHERE client_user_id = NEW.client_user_id AND ended_at IS NULL;
    IF NEW.manager_id IS NOT NULL THEN
      INSERT INTO manager_assignments(client_user_id, manager_id, assigned_by) VALUES (NEW.client_user_id, NEW.manager_id, app_client_user_id());
    END IF;
    INSERT INTO audit_log(client_id, actor_id, action, entity_type, entity_id, detail)
    VALUES (NEW.client_id, app_client_user_id(), 'rep.reassigned', 'user', NEW.client_user_id, jsonb_build_object('from', OLD.manager_id, 'to', NEW.manager_id));
  END IF;
  IF OLD.role = 'manager' AND (NEW.role <> 'manager' OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL) THEN
    UPDATE client_users SET manager_id = NULL WHERE manager_id = NEW.client_user_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_client_users_after AFTER INSERT OR UPDATE ON client_users FOR EACH ROW EXECUTE FUNCTION client_users_after();

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
      (SELECT max(coalesce(m.meeting_at, m.uploaded_at)) FROM meetings m WHERE m.lead_id = l.lead_id AND m.deleted_at IS NULL)
    WHERE l.lead_id = v_lead;
  END LOOP;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_meetings_refresh_lead AFTER INSERT OR DELETE OR UPDATE OF lead_id, meeting_at, deleted_at ON meetings
  FOR EACH ROW EXECUTE FUNCTION meetings_refresh_lead();

-- meeting_objections: an objection is always something the buyer said, in the same meeting.
CREATE FUNCTION objections_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.segment_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM transcript_segments s WHERE s.transcript_segment_id = NEW.segment_id AND s.meeting_id = NEW.meeting_id AND s.speaker_role = 'prospect') THEN
    RAISE EXCEPTION 'an objection must point at a buyer line of the same meeting' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_meeting_objections_check BEFORE INSERT OR UPDATE ON meeting_objections FOR EACH ROW EXECUTE FUNCTION objections_check();

-- media_files: stamp the delete-after date from the company's retention setting.
CREATE FUNCTION media_files_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.retention_until IS NULL THEN
    SELECT now() + make_interval(days => recording_retention_days) INTO NEW.retention_until FROM clients WHERE client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_media_files_retention BEFORE INSERT ON media_files FOR EACH ROW EXECUTE FUNCTION media_files_retention();

-- meeting_cue_scores: evidence points at a line of the same meeting, so clicking it always lands on the right place.
CREATE FUNCTION cue_scores_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.evidence_segment_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM transcript_segments s WHERE s.transcript_segment_id = NEW.evidence_segment_id AND s.meeting_id = NEW.meeting_id) THEN
    RAISE EXCEPTION 'evidence must point at a line of the same meeting' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_meeting_cue_scores_check BEFORE INSERT OR UPDATE ON meeting_cue_scores FOR EACH ROW EXECUTE FUNCTION cue_scores_check();

-- Same company, checked by trigger.
-- Some tables have no client_id: they name the person they belong to (client_user_id) and the company is that person's.
-- A row may only point at other rows of that same company. company_of() finds the company of a row in any of the tables below.
CREATE FUNCTION company_of(p_table text, p_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT CASE p_table
    WHEN 'client_users'     THEN (SELECT client_id FROM client_users WHERE client_user_id = p_id)
    WHEN 'leads'            THEN (SELECT u.client_id FROM leads l JOIN client_users u ON u.client_user_id = l.client_user_id WHERE l.lead_id = p_id)
    WHEN 'meetings'         THEN (SELECT u.client_id FROM meetings m JOIN client_users u ON u.client_user_id = m.client_user_id WHERE m.meeting_id = p_id)
    WHEN 'integrations'     THEN (SELECT client_id FROM integrations WHERE integration_id = p_id)
    WHEN 'media_files'      THEN (SELECT client_id FROM media_files WHERE media_file_id = p_id)
    WHEN 'crm_activities'   THEN (SELECT client_id FROM crm_activities WHERE crm_activity_id = p_id)
    ELSE NULL
  END
$$;
-- Trigger arguments: first the company source ('client_id' or 'owner:<column>'), then one 'column:table' for each link to check.
CREATE FUNCTION same_company_links() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_row jsonb := to_jsonb(NEW); v_company uuid; v_link text; v_col text; v_tbl text; v_id uuid;
BEGIN
  IF TG_ARGV[0] = 'client_id' THEN v_company := (v_row->>'client_id')::uuid;
  ELSE v_company := company_of('client_users', (v_row->>substr(TG_ARGV[0], 7))::uuid);
  END IF;
  FOR i IN 1 .. TG_NARGS - 1 LOOP
    v_link := TG_ARGV[i]; v_col := split_part(v_link, ':', 1); v_tbl := split_part(v_link, ':', 2);
    v_id := (v_row->>v_col)::uuid;
    IF v_id IS NOT NULL AND company_of(v_tbl, v_id) IS DISTINCT FROM v_company THEN
      RAISE EXCEPTION '% points at a % of another company', v_col, v_tbl USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_meetings_same_company             BEFORE INSERT OR UPDATE ON meetings              FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'lead_id:leads', 'integration_id:integrations', 'media_file_id:media_files', 'crm_activity_id:crm_activities');
CREATE TRIGGER trg_manager_assignments_same_company  BEFORE INSERT OR UPDATE ON manager_assignments   FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'manager_id:client_users', 'assigned_by:client_users');
CREATE TRIGGER trg_practice_lessons_same_company     BEFORE INSERT OR UPDATE ON practice_lessons      FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'created_by:client_users', 'meeting_id:meetings', 'lead_id:leads');
CREATE TRIGGER trg_practice_programs_same_company    BEFORE INSERT OR UPDATE ON practice_programs     FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'lead_id:leads');
CREATE TRIGGER trg_lesson_feedback_same_company      BEFORE INSERT OR UPDATE ON lesson_feedback       FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'manager_id:client_users');
CREATE TRIGGER trg_mock_meetings_same_company        BEFORE INSERT OR UPDATE ON mock_meetings         FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'source_meeting_id:meetings');
CREATE TRIGGER trg_live_assist_sessions_same_company BEFORE INSERT OR UPDATE ON live_assist_sessions  FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'meeting_id:meetings');
CREATE TRIGGER trg_chat_threads_same_company         BEFORE INSERT OR UPDATE ON chat_threads          FOR EACH ROW EXECUTE FUNCTION same_company_links('owner:client_user_id', 'lead_id:leads');
