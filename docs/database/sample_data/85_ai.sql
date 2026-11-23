-- ===== Table 50: automations: all 4 categories and 3 statuses, with a condition and without, one deleted =====
SELECT s.act_as_owner();
INSERT INTO automations(automation_id, client_id, created_by, name, description, trigger_event, condition, action, category, status, runs_count, last_run_at, updated_by, deleted_at, deleted_by) VALUES
 (s.id(50,1), s.id(6,1), s.id(7,1), 'Generate Meeting Summary & Action Items', 'Creates the executive summary and cue evaluation when a meeting analysis completes.', 'Meeting status changes to Analysed', 'Duration > 5 minutes', 'Generate the 6-tab report and draft a follow-up email', 'Summary', 'Active', 48, '2026-11-08 19:02+00', s.id(7,1), NULL, NULL),
 (s.id(50,2), s.id(6,1), s.id(7,1), 'Pre-Meeting Deal Brief to Sales Rep', 'Sends a briefing 2 hours before a scheduled call: prior objections, stakeholder roles and coaching tips.', 'Scheduled calendar event is 2 hours away', 'Associated deal exists in the CRM', 'Send a briefing card to Live Assist and by email', 'Prompt', 'Active', 31, '2026-11-15 13:30+00', NULL, NULL, NULL),
 (s.id(50,3), s.id(6,1), s.id(7,2), 'Post-Call Negotiation Follow-Up Email Draft', 'Drafts a commercial follow-up email with the technical compromises and next milestone.', 'Analysis completed with Commercial or Objection cues', 'Rep approval required before sending', 'Create a Gmail or Outlook draft with CRM context', 'Email', 'Active', 19, '2026-11-07 19:00+00', NULL, NULL, NULL),
 (s.id(50,4), s.id(6,1), s.id(7,1), 'Closed-Lost Re-entry Campaign Trigger', 'Re-engages stalled accounts after 90 days with an updated case study.', 'Deal stage changes to Closed Lost', 'Loss reason is lead time or technical feasibility', 'Generate a re-entry email draft', 'Diagnostic', 'Draft', 0, NULL, NULL, NULL, NULL),
 (s.id(50,5), s.id(6,1), s.id(7,1), 'Weekly pipeline digest', 'Emails managers a summary of deals that moved stage this week.', 'Every Friday at 08:00', NULL, 'Email a digest to all managers', 'Summary', 'Paused', 12, '2026-10-30 08:00+00', s.id(7,1), NULL, NULL),
 (s.id(50,6), s.id(6,1), s.id(7,1), 'Old weekly digest', NULL, 'Every Monday at 08:00', NULL, 'Email a digest to all managers', 'Summary', 'Paused', 9, '2026-09-28 08:00+00', s.id(7,1), '2026-10-01 09:00+00', s.id(7,1));

-- ===== Table 51: automation_runs: success and failed, with and without a call or a deal =====
INSERT INTO automation_runs(automation_run_id, automation_id, meeting_id, lead_id, status, output, ran_at) VALUES
 (s.id(51,1), s.id(50,1), s.id(26,1), s.id(21,1), 'success', 'Generated the 6-tab report and a draft follow-up email.', '2026-11-08 19:02+00'),
 (s.id(51,2), s.id(50,1), s.id(26,2), s.id(21,2), 'success', 'Generated the 6-tab report and a draft follow-up email.', '2026-11-06 19:00+00'),
 (s.id(51,3), s.id(50,2), NULL,       s.id(21,3), 'success', 'Briefing card sent to Elena Rostova before the VoltDrive call.', '2026-11-15 13:30+00'),
 (s.id(51,4), s.id(50,3), s.id(26,3), s.id(21,3), 'failed',  'Could not draft the email: no recipient found on the Salesforce contact.', '2026-11-07 19:00+00'),
 (s.id(51,5), s.id(50,1), s.id(26,4), NULL,       'success', 'Generated the 6-tab report. No deal is linked to this call.', '2026-11-03 19:00+00'),
 (s.id(51,6), s.id(50,5), NULL,       NULL,       'success', NULL, '2026-10-30 08:00+00');

-- ===== Table 52: chat_threads: with and without a deal, with and without a title, one deleted =====
INSERT INTO chat_threads(chat_thread_id, client_user_id, lead_id, title, deleted_at, deleted_by) VALUES
 (s.id(52,1), s.id(7,4),  s.id(21,1), 'AeroDynamics: tooling surcharge options',          NULL, NULL),
 (s.id(52,2), s.id(7,5),  NULL,       'What is our standard first-article lead time?',    NULL, NULL),
 (s.id(52,3), s.id(7,4),  NULL,       NULL,                                               NULL, NULL),
 (s.id(52,4), s.id(7,7),  NULL,       'Scratch',                                          '2026-11-19 08:00+00', s.id(7,7)),
 (s.id(52,5), s.id(7,12), s.id(21,9), 'Kestrel quote wording',                            NULL, NULL);

-- ===== Table 53: chat_messages: user and assistant. Only assistant messages keep the model's raw reply, citations and a vector. =====
INSERT INTO chat_messages(chat_message_id, thread_id, role, body, raw_text, citations, model, tags, embeddings, embedding_model, embedded_at, input_tokens, output_tokens) VALUES
 (s.id(53,1),  s.id(52,1), 'user',      'What are our options if procurement wants the $8,500 tooling surcharge removed?', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,2),  s.id(52,1), 'assistant', 'You can amortise the surcharge over the first 100 production units if the purchase order is signed within 10 business days, or offer a one-off waiver in exchange for a larger volume commitment.',
  E'**Options**\n1. Amortise the tooling fee over the first 100 units if the PO is signed within 10 business days.\n2. Offer a one-off waiver in exchange for a larger volume commitment.',
  jsonb_build_array(s.id(34,5)::text, s.id(34,7)::text), 'chat-model-2026-10', ARRAY['pricing','tooling'], s.vec(401), 'embed-3-large-1536', '2026-11-09 08:41+00', 1240, 210),
 (s.id(53,3),  s.id(52,1), 'user',      'Which one has the least margin impact?', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,4),  s.id(52,1), 'assistant', 'Amortising keeps the full price on every unit, so margin is protected. A waiver gives up the fee immediately and only pays back if the volume commitment is signed.',
  'Amortising keeps the full price on every unit, so margin is protected. A waiver gives up the fee immediately and only pays back if the volume commitment is signed.',
  jsonb_build_array(s.id(34,5)::text), 'chat-model-2026-10', ARRAY['pricing','margin'], NULL, NULL, NULL, 1620, 150),
 (s.id(53,5),  s.id(52,2), 'user',      'What is our standard first-article lead time?', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,6),  s.id(52,2), 'assistant', 'The standard lead time is 8 weeks. A priority shift can deliver first articles in 3 weeks.',
  'The standard lead time is 8 weeks. A priority shift can deliver first articles in 3 weeks.',
  jsonb_build_array(s.id(34,1)::text), 'chat-model-2026-10', ARRAY['lead-time'], s.vec(406), 'embed-3-large-1536', '2026-11-09 10:16+00', 980, 60),
 (s.id(53,7),  s.id(52,3), 'user',      'Draft a one-line summary of the Nordic call.', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,8),  s.id(52,3), 'assistant', 'Requirements call for super duplex subsea sonar housings; the buyer needs a sample qualification pack before a decision.',
  'Requirements call for super duplex subsea sonar housings; the buyer needs a sample qualification pack before a decision.',
  NULL, 'chat-model-2026-10', ARRAY[]::text[], NULL, NULL, NULL, 700, 45),                                              -- no sources were used
 (s.id(53,9),  s.id(52,4), 'user',      'test', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,10), s.id(52,5), 'user',      'Rewrite this quote note to sound friendlier.', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL),
 (s.id(53,11), s.id(52,5), 'assistant', 'Thanks for the enquiry. We can deliver the 500 brackets in ten working days and will send a full quote today.',
  'Thanks for the enquiry. We can deliver the 500 brackets in ten working days and will send a full quote today.',
  NULL, 'chat-model-2026-10', ARRAY['quote'], NULL, NULL, NULL, 450, 40);
