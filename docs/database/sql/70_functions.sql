-- ================================================================
-- Functions the API and workers call
-- ================================================================

-- Spend credits. One row lock per company, a ledger line, and a retry with the same key charges once.
CREATE FUNCTION consume_credits(p_client uuid, p_user uuid, p_activity text, p_credits int,
                                p_idem text DEFAULT NULL, p_ref_type text DEFAULT NULL, p_ref_id uuid DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_balance int; v_prior int;
BEGIN
  IF p_credits <= 0 THEN RAISE EXCEPTION 'credits must be positive'; END IF;
  IF app_role() IS NOT NULL AND p_client IS DISTINCT FROM app_client_id() THEN
    RAISE EXCEPTION 'wrong company' USING ERRCODE = '42501';
  END IF;
  IF p_idem IS NOT NULL THEN
    SELECT balance_after INTO v_prior FROM credit_transactions WHERE client_id = p_client AND idempotency_key = p_idem;
    IF FOUND THEN RETURN v_prior; END IF;
  END IF;
  SELECT credit_balance INTO v_balance FROM clients WHERE client_id = p_client FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown company'; END IF;
  IF v_balance < p_credits THEN RAISE EXCEPTION 'not enough credits (% left, % needed)', v_balance, p_credits USING ERRCODE = 'P0001'; END IF;
  UPDATE clients SET credit_balance = v_balance - p_credits WHERE client_id = p_client;
  INSERT INTO credit_transactions(client_id, user_id, activity, kind, credits_consumed, balance_after, ref_type, ref_id, idempotency_key)
  VALUES (p_client, p_user, p_activity, 'consume', p_credits, v_balance - p_credits, p_ref_type, p_ref_id, p_idem);
  RETURN v_balance - p_credits;
END $$;

-- Add credits (monthly plan refill, top-up, refund). Platform or worker only.
CREATE FUNCTION grant_credits(p_client uuid, p_credits int, p_activity text, p_kind text DEFAULT 'grant', p_idem text DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_balance int; v_prior int;
BEGIN
  IF p_credits <= 0 THEN RAISE EXCEPTION 'credits must be positive'; END IF;
  IF app_role() IS NOT NULL AND app_role() <> 'super_admin' THEN RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501'; END IF;
  IF p_kind NOT IN ('grant', 'refund', 'adjust') THEN RAISE EXCEPTION 'bad kind'; END IF;
  IF p_idem IS NOT NULL THEN
    SELECT balance_after INTO v_prior FROM credit_transactions WHERE client_id = p_client AND idempotency_key = p_idem;
    IF FOUND THEN RETURN v_prior; END IF;
  END IF;
  SELECT credit_balance INTO v_balance FROM clients WHERE client_id = p_client FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown company'; END IF;
  UPDATE clients SET credit_balance = v_balance + p_credits WHERE client_id = p_client;
  INSERT INTO credit_transactions(client_id, user_id, activity, kind, credits_consumed, balance_after, idempotency_key)
  VALUES (p_client, app_client_user_id(), p_activity, p_kind, -p_credits, v_balance + p_credits, p_idem);
  RETURN v_balance + p_credits;
END $$;

-- On Salesforce connect: load the standard stage names. The admin edits them afterwards.
CREATE FUNCTION seed_salesforce_stage_mappings(p_client uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF app_role() IS NOT NULL AND p_client IS DISTINCT FROM app_client_id() THEN RAISE EXCEPTION 'wrong company' USING ERRCODE = '42501'; END IF;
  INSERT INTO crm_stage_mappings(client_id, crm_stage, sellmore_stage) VALUES
    (p_client, 'Prospecting', 'Discovery'), (p_client, 'Qualification', 'Discovery'), (p_client, 'Needs Analysis', 'Discovery'),
    (p_client, 'Technical Validation', 'Technical Review'), (p_client, 'Value Proposition', 'Technical Review'),
    (p_client, 'Proposal/Price Quote', 'Commercial Proposal'), (p_client, 'Negotiation/Review', 'Negotiation'),
    (p_client, 'Closed Won', 'Closed Won'), (p_client, 'Closed Lost', 'Closed Lost')
  ON CONFLICT (client_id, crm_stage) DO NOTHING;
END $$;

-- Nightly retention job (worker). When a recording expires it:
--   hides the media file and returns its object key, so the worker can delete the file;
--   clears the copies of the call content that depend on it: the raw speech-to-text, the turn embeddings
--   and the model's raw replies. The cleaned transcript and the analysis stay, as the product's record of the call.
CREATE FUNCTION expire_media() RETURNS TABLE(media_file_id uuid, storage_key text) LANGUAGE sql AS $$
  WITH expired AS (
    UPDATE media_files SET deleted_at = now()
    WHERE retention_until < now() AND deleted_at IS NULL
    RETURNING media_files.media_file_id, media_files.storage_key
  ), purge_segments AS (
    UPDATE transcript_segments s SET raw_text = NULL, embeddings = NULL, embedding_model = NULL, embedded_at = NULL
    FROM meetings m JOIN expired e ON e.media_file_id = m.media_file_id
    WHERE s.meeting_id = m.meeting_id
    RETURNING s.transcript_segment_id
  ), purge_runs AS (
    UPDATE analysis_runs r SET raw_output = NULL
    FROM meetings m JOIN expired e ON e.media_file_id = m.media_file_id
    WHERE r.meeting_id = m.meeting_id
    RETURNING r.analysis_run_id
  )
  SELECT expired.media_file_id, expired.storage_key FROM expired
$$;
