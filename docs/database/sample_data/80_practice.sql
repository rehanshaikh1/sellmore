-- ===== Table 38: practice_catalog: platform exercises (client empty) and company ones; all 3 levels; one retired =====
SELECT s.act_as_owner();
INSERT INTO practice_catalog(practice_catalog_id, client_id, title, category, description, recommended_minutes, level, default_prompts, default_interval_sec, sample_prompts, active, created_by, updated_by) VALUES
 (s.id(38,1), NULL, 'Explain Engineering Simply', 'Technical Communication', 'Turn complex 5-axis CAM strategies and tolerance stacks into business value for procurement officers.', 10, 'Foundational', 5, 4,
  '["The buyer asks why they should pay extra for 5-axis simultaneous milling when a local shop has a 3-axis mill. Explain simply.","The client asks what a tolerance of plus or minus 0.005 mm means for their airframe assembly.","Explain how in-process laser tool inspection stops bad batches reaching the customer.","Translate thermal distortion in titanium milling into plain procurement language.","Explain why cleanroom packaging matters for medical implants without sounding academic."]', true, NULL, NULL),
 (s.id(38,2), NULL, 'Beyond the Price Quote', 'Commercial Discovery', 'Anchor value before sharing numbers. Discover budget cycles, the cost of downtime and scrap expense.', 12, 'Advanced', 6, 5,
  '["The prospect says: just send us your rate card per machining hour. Steer them toward project scope first.","The prospect asks you to match a 20% cheaper overseas quote. Respond with total cost of acquisition.","Ask three probing questions to find out what happens to their flight test schedule if parts arrive late.","The buyer will not share their prototyping budget. Anchor a realistic price bracket.","Frame an $8,500 tooling fee as zero-scrap insurance.","Propose milestone billing on a $200k aerospace prototype run."]', true, NULL, NULL),
 (s.id(38,3), NULL, 'Handle Technical Objections', 'Objection Handling', 'Address tolerance tightness, tool wear surcharges, material availability and tight delivery windows.', 15, 'Mastery', 8, 6,
  '["The lead engineer says Inconel 718 work hardens too fast for your machine speeds.","We need first articles in 3 weeks but your standard lead time is 8 weeks. This is a dealbreaker.","Your competitor promises to waive all fixture and tooling charges.","We had severe bore distortion with our last subcontractor. Why will your shop be different?","Our QA team mandates a 100% CMM report on every unit. Will that slow deliveries?","Your raw material index clause is too risky for our fixed-price contract.","What guarantees do we have that your operators are AS9100D certified?","How do you handle emergency engineering revisions mid-production?"]', true, NULL, NULL),
 (s.id(38,4), NULL, 'Win the Manufacturing Project', 'Closing & Commitments', 'Drive closing actions: native CAD models, technical review calls and purchase order release.', 8, 'Advanced', 4, 4,
  '["The call is ending with a vague we will be in touch. Lock in a date for drawing sign-off.","Ask the client to release native STEP files under NDA today.","Confirm purchase order release to hold the machine slot.","Close the loop on an agreed split shipment proposal."]', true, NULL, NULL),
 (s.id(38,5), s.id(6,1), 'Defend the Tooling Surcharge', 'Objection Handling', 'Apex exercise: respond when procurement challenges the $8,500 dedicated tooling charge.', 10, 'Advanced', 5, 5,
  '["Procurement says the tooling charge was not in the prototype budget. Respond.","Offer to amortise the tooling fee over the first 100 units, with a signing deadline.","The buyer asks why custom radius endmills cannot be absorbed into the unit price.","Explain what the tooling fee prevents: chatter, scrap and rework.","Close on the amortisation offer."]', true, s.id(7,1), s.id(7,2)),
 (s.id(38,6), s.id(6,1), 'Cold Call Opening Drill', 'Technical Communication', NULL, NULL, 'Foundational', 3, 3, '[]', false, s.id(7,1), NULL);   -- retired

-- ===== Table 39: practice_lessons: from a call or from a deal; checklist or AI; created by the rep or their manager; one deleted =====
INSERT INTO practice_lessons(practice_lesson_id, client_user_id, created_by, meeting_id, lead_id, origin, method, title, context, updated_by, deleted_at, deleted_by) VALUES
 (s.id(39,1), s.id(7,4), s.id(7,4), s.id(26,1), NULL,        'meeting', 'checklist', 'Defend the tooling surcharge',               'Built from the tooling objection in the AeroDynamics call.', NULL, NULL, NULL),
 (s.id(39,2), s.id(7,4), s.id(7,2), NULL,       s.id(21,2),  'lead',    'ai',        'Anchor value before sharing the quote',      NULL,                                                          s.id(7,2), NULL, NULL),
 (s.id(39,3), s.id(7,5), s.id(7,5), s.id(26,3), s.id(21,3),  'meeting', 'ai',        'Handle the competitor free-fixtures claim',  'From the VoltDrive call: the rep let the competing offer set the price.', NULL, NULL, NULL),
 (s.id(39,4), s.id(7,7), s.id(7,7), NULL,       s.id(21,8),  'lead',    'checklist', 'Open a first call with a prototype buyer',   NULL,                                                          s.id(7,7), '2026-11-18 12:00+00', s.id(7,7));

-- ===== Table 40: practice_lesson_cues =====
INSERT INTO practice_lesson_cues(lesson_id, cue_id) VALUES
 (s.id(39,1), s.id(33,9)), (s.id(39,1), s.id(33,8)), (s.id(39,2), s.id(33,8)), (s.id(39,2), s.id(33,7)),
 (s.id(39,3), s.id(33,9)), (s.id(39,3), s.id(33,10)), (s.id(39,4), s.id(33,3));

-- ===== Table 41: practice_programs: one per rep and deal, all three statuses =====
INSERT INTO practice_programs(practice_program_id, lead_id, client_user_id, status, progress_pct, created_by, updated_by) VALUES
 (s.id(41,1), s.id(21,1), s.id(7,4), 'in_progress',    40,  NULL,      s.id(7,4)),     -- built by the AI
 (s.id(41,2), s.id(21,2), s.id(7,4), 'ready_to_start', 0,   s.id(7,2), NULL),          -- requested by the manager
 (s.id(41,3), s.id(21,3), s.id(7,5), 'completed',      100, NULL,      NULL);

-- ===== Table 42: practice_program_meetings: the calls each programme was built from =====
INSERT INTO practice_program_meetings(program_id, meeting_id) VALUES
 (s.id(41,1), s.id(26,1)), (s.id(41,2), s.id(26,2)), (s.id(41,3), s.id(26,3));

-- ===== Table 43: practice_program_lessons: ordered lessons; completed and not =====
INSERT INTO practice_program_lessons(practice_program_lesson_id, program_id, position, title, objective, relevance_to_deal, evidence_meeting_id, tailored_explanation, talk_track, practice_activity, practice_scenario, expected_outcome, completed, completed_at) VALUES
 (s.id(43,1), s.id(41,1), 1, 'Quantify the value of 99.8% first-pass yield', 'State the dollar savings from scrap avoidance in one sentence.', 'Procurement is challenging the tooling surcharge.', s.id(26,1),
  'In the call the rep described quality but never put a number on it.', '["Our 99.8% first-pass yield saves you about $42,000 in titanium billets on this run.","That is more than five times the tooling fee."]',
  'Say it in 20 seconds without notes.', 'Sarah says the $8,500 tooling fee is too high.', 'The rep ties the fee to a much larger saving.', true, '2026-11-12 09:30+00'),
 (s.id(43,2), s.id(41,1), 2, 'Anchor the price early', 'Ask for a target per-unit cost before waiving fees.', 'Pricing came up only at the end of the call.', s.id(26,1),
  'Asking early avoids conceding setup fees blindly.', '["Before we finalise the plan, what per-unit cost are you aiming for?"]',
  'Ask the question in the first five minutes of a role-play.', 'The buyer avoids talking about budget.', 'The buyer names a price range.', false, NULL),
 (s.id(43,3), s.id(41,1), 3, 'Offer the amortisation with a deadline', 'Offer to spread the tooling fee over 100 units if signed within 10 business days.', 'The surcharge is only partly resolved.', s.id(26,1),
  'A deadline turns the concession into momentum.', '["I can spread the tooling fee over the first 100 units if we sign within ten business days."]',
  'Deliver the offer, then stop talking.', 'Procurement asks for the fee to be removed.', 'The buyer agrees to a signing date.', false, NULL),
 (s.id(43,4), s.id(41,2), 1, 'Reframe the cheaper incumbent', 'Compare total cost including scrap and re-inspection.', 'The incumbent is about 20% cheaper.', s.id(26,2),
  'Price per part hides re-inspection and scrap costs.', '["Let me show you the total cost, including scrap and re-inspection."]',
  'Reframe in two sentences.', 'Joel says the other supplier is 20% cheaper.', 'The buyer asks for the total-cost comparison.', false, NULL),
 (s.id(43,5), s.id(41,2), 2, 'Get the quality director in the room', 'Ask to include the approver in the next call.', 'Any supplier change needs the quality director.', s.id(26,2),
  'Unmet approvers stall deals.', '["Who else needs to be on the next call so we can answer their questions directly?"]',
  'Practise asking without sounding pushy.', 'Karen says the quality director must approve.', 'A call with the quality director is booked.', false, NULL),
 (s.id(43,6), s.id(41,3), 1, 'Compare total programme cost', 'Move the discussion from fixture cost to programme cost.', 'A rival offers free fixtures.', s.id(26,3),
  'Free fixtures are recovered in the unit price.', '["Let us compare the total programme cost over the full run, not just the fixture line."]',
  'Do the comparison with real numbers.', 'Lukas says the other bidder has free fixtures.', 'The buyer agrees to compare total cost.', true, '2026-11-10 14:00+00'),
 (s.id(43,7), s.id(41,3), 2, 'Agree the price review date', 'Leave every call with a dated next step.', 'The buyer wants a price by Friday.', s.id(26,3),
  'A dated next step prevents the deal drifting.', '["I will send the per-unit price on Thursday, and we can review it on Friday at ten."]',
  'End the call with a date and a name.', 'The buyer says send it when it is ready.', 'A review meeting is in the calendar.', true, '2026-11-14 10:30+00'),
 (s.id(43,8), s.id(41,3), 3, 'Warm-up: open with the buyer''s name', 'Start every call by using the buyer''s name.', NULL, NULL, NULL, '[]', NULL, NULL, NULL, true, '2026-11-09 09:00+00');

-- ===== Table 44: practice_attempts: typed replies, each scored. They belong to a lesson or to a programme lesson, never both. =====
INSERT INTO practice_attempts(practice_attempt_id, client_user_id, lesson_id, program_lesson_id, turn_no, response, score) VALUES
 (s.id(44,1), s.id(7,4), s.id(39,1), NULL,        1, 'Our tooling covers custom radius endmills for the cavity fillets, so there is no chatter on the bore walls.', 72),
 (s.id(44,2), s.id(7,4), s.id(39,1), NULL,        2, 'I can amortise it over the first 100 units if you sign within ten business days.', 85),
 (s.id(44,3), s.id(7,4), NULL,       s.id(43,1),  1, 'Our 99.8% first-pass yield saves you roughly $42,000 in titanium billets, far more than the $8,500 tooling fee.', 91),
 (s.id(44,4), s.id(7,5), s.id(39,3), NULL,        1, 'Free fixtures usually get added back into the unit price, so let us compare the full programme.', 64),
 (s.id(44,5), s.id(7,5), NULL,       s.id(43,6),  1, 'Over the full run our programme cost is lower once fixtures are reused for every lot.', 88),
 (s.id(44,6), s.id(7,5), NULL,       s.id(43,7),  1, 'I will send the per-unit price on Thursday and we can review it on Friday at ten.', 79);

-- ===== Table 45: lesson_feedback: a manager's notes on a rep's practice =====
INSERT INTO lesson_feedback(lesson_feedback_id, client_user_id, manager_id, lesson_id, program_lesson_id, feedback, updated_by) VALUES
 (s.id(45,1), s.id(7,4), s.id(7,2), s.id(39,1), NULL,       'Good reframing of the surcharge. Next time name the dollar saving first.', NULL),
 (s.id(45,2), s.id(7,4), s.id(7,2), NULL,       s.id(43,1), 'Excellent: a concrete number and a comparison. Keep it under 20 seconds.', s.id(7,2)),
 (s.id(45,3), s.id(7,5), s.id(7,2), s.id(39,3), NULL,       'Slow down on the price comparison and check the buyer follows each step.', NULL);

-- ===== Table 46: mock_meetings (AI role-play): all 3 rescore states, with and without a source call, one deleted =====
INSERT INTO mock_meetings(mock_meeting_id, client_user_id, source_meeting_id, buyer_name, buyer_role, roleplay_type, domain, started_at, duration_sec, score, summary, talk_listen_ratio, fillers_per_min, words_per_min, longest_monologue, rescore_status, deleted_at, deleted_by) VALUES
 (s.id(46,1), s.id(7,4), s.id(26,1), 'David Sterling (AI Simulation)', 'VP of Procurement, Global Aerospace Systems', 'Warm Commercial Negotiation', 'Aerospace CNC Machining', '2026-11-09 15:30+00', 860, 84,
  'Strong rehearsal defending custom tooling charges. Marcus introduced amortising the fixture cost across production batches.', '46% / 54%', 1.20, 138, '1m 15s', 'idle', NULL, NULL),
 (s.id(46,2), s.id(7,4), NULL,       'Karen Vance (AI Simulation)', 'Lead Quality Engineer, MedTech Robotics', 'Cold Technical Discovery', 'Medical Swiss Micro-Machining', '2026-11-04 11:00+00', 585, 72,
  'Good discovery on Swiss turning tolerances. Stumbled on Class 7 cleanroom packaging certificates.', '58% / 42%', 3.40, 154, '2m 10s', 'rescored', NULL, NULL),
 (s.id(46,3), s.id(7,5), s.id(26,3), 'Anders Lund (AI Simulation)', 'Sourcing Manager, VoltDrive Mobility', 'Competitive Price Defence', 'EV Powertrain Components', '2026-11-16 10:00+00', 620, NULL,
  NULL, NULL, NULL, NULL, NULL, 'processing', NULL, NULL),                                                                      -- the score is still being worked out
 (s.id(46,4), s.id(7,7), NULL,       'Test buyer (AI Simulation)', NULL, 'Cold Call', NULL, '2026-11-12 09:00+00', NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, 'idle', '2026-11-12 09:30+00', s.id(7,7));

-- ===== Tables 47, 48: the cues a role-play focuses on, and its feedback points =====
INSERT INTO mock_meeting_focus_cues(mock_meeting_id, cue_id) VALUES
 (s.id(46,1), s.id(33,8)), (s.id(46,1), s.id(33,9)), (s.id(46,2), s.id(33,2)), (s.id(46,2), s.id(33,3)), (s.id(46,3), s.id(33,9));
INSERT INTO mock_meeting_points(mock_meeting_point_id, mock_meeting_id, kind, body) VALUES
 (s.id(48,1), s.id(46,1), 'went_well',   'Kept calm when the buyer threatened to walk to a competitor.'),
 (s.id(48,2), s.id(46,1), 'went_well',   'Clear explanation of AS9100D audit compliance.'),
 (s.id(48,3), s.id(46,1), 'went_well',   'Proposed split delivery terms within 2 minutes of the objection.'),
 (s.id(48,4), s.id(46,1), 'to_improve',  'Cut down on basically and essentially when explaining technical setups.'),
 (s.id(48,5), s.id(46,1), 'to_improve',  'Confirm approval authority before proposing price concessions.'),
 (s.id(48,6), s.id(46,2), 'went_well',   'Good discovery questions on Swiss turning tolerances.'),
 (s.id(48,7), s.id(46,2), 'to_improve',  'Prepare the cleanroom packaging certificates before the call.');

-- ===== Table 49: live_assist_sessions: ended with a source call, ended without notes, and one running now =====
INSERT INTO live_assist_sessions(live_assist_session_id, client_user_id, meeting_id, started_at, ended_at, notes, status) VALUES
 (s.id(49,1), s.id(7,4), s.id(26,2), '2026-11-08 14:28+00', '2026-11-08 15:10+00', 'Used the pre-call brief: it surfaced the earlier objection about tooling.', 'ended'),
 (s.id(49,2), s.id(7,5), NULL,       '2026-11-20 08:50+00', NULL,                  NULL,                                                                          'active'),
 (s.id(49,3), s.id(7,4), s.id(26,1), '2026-11-19 09:00+00', '2026-11-19 09:20+00', 'Rehearsed the amortisation answer before the Tuesday call.',                'ended');
