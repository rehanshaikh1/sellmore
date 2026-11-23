-- ===== Table 25: media_files. Drive and upload, MP3 / MP4 / TXT, one expired, one deleted by an admin. =====
-- retention_until is left empty on most rows: a trigger stamps it from the company's retention setting.
SELECT s.act_as_owner();
INSERT INTO media_files(media_file_id, client_id, uploaded_by, source, drive_file_id, drive_file_name, storage_key, file_format, mime_type, size_bytes, duration_sec, checksum_sha256, retention_until, deleted_at, updated_by, deleted_by) VALUES
 (s.id(25,1),  s.id(6,1), NULL,      'drive',  '1AeroCallAudio0001xYz',  'call_8007_20261108_1430.mp3', 'clients/apex-precision/media/call_8007_20261108_1430.mp3', 'MP3', 'audio/mpeg', 40640512, 2538, s.sha('media-1'),  NULL, NULL, NULL, NULL),
 (s.id(25,2),  s.id(6,1), NULL,      'drive',  '1BioMedAudio0002xYz',    'call_8007_20261106_1000.mp3', 'clients/apex-precision/media/call_8007_20261106_1000.mp3', 'MP3', 'audio/mpeg', 32800000, 2050, s.sha('media-2'),  NULL, NULL, NULL, NULL),
 (s.id(25,3),  s.id(6,1), NULL,      'drive',  '1VoltDriveAudio003xY',   'call_8011_20261107_1530.mp3', 'clients/apex-precision/media/call_8011_20261107_1530.mp3', 'MP3', 'audio/mpeg', 27600000, 1725, s.sha('media-3'),  NULL, NULL, NULL, NULL),
 (s.id(25,4),  s.id(6,1), NULL,      'drive',  '1KellerAudio0004xYzA',   'call_8007_20261103_1115.mp3', 'clients/apex-precision/media/call_8007_20261103_1115.mp3', 'MP3', 'audio/mpeg', 19040000, 1190, s.sha('media-4'),  NULL, NULL, NULL, NULL),
 (s.id(25,5),  s.id(6,1), s.id(7,5), 'upload', NULL, NULL,                                                'clients/apex-precision/uploads/satorbit_kickoff_20261112.mp4',   'MP4', 'video/mp4',  432013312, 2700, s.sha('media-5'),  NULL, NULL, NULL, NULL),
 (s.id(25,6),  s.id(6,1), s.id(7,4), 'upload', NULL, NULL,                                                'clients/apex-precision/uploads/call_recording_truncated.mp3',    'MP3', 'audio/mpeg', 1050624,   134,  s.sha('media-6'),  NULL, NULL, NULL, NULL),
 (s.id(25,7),  s.id(6,1), NULL,      'drive',  '1HydroAudio0007xYzAB',   'call_8007_20261110_1400.mp3', 'clients/apex-precision/media/call_8007_20261110_1400.mp3', 'MP3', 'audio/mpeg', 30080000, 1880, s.sha('media-7'),  NULL, NULL, NULL, NULL),
 (s.id(25,8),  s.id(6,1), NULL,      'drive',  '1UnknownAudio008xYzA',   'call_8013_20261117_1030.mp3', 'clients/apex-precision/media/call_8013_20261117_1030.mp3', 'MP3', NULL,         NULL,     960,  NULL,              NULL, NULL, NULL, NULL),
 (s.id(25,9),  s.id(6,1), s.id(7,7), 'upload', NULL, NULL,                                                'clients/apex-precision/uploads/precision_optics_intro_notes.txt','TXT', 'text/plain', 18432,     NULL, s.sha('media-9'),  NULL, NULL, NULL, NULL),
 (s.id(25,10), s.id(6,1), NULL,      'drive',  '1NordicAudio0010xYzA',   'call_8011_20261029_1300.mp3', 'clients/apex-precision/media/call_8011_20261029_1300.mp3', 'MP3', 'audio/mpeg', 31680000, 1980, s.sha('media-10'), NULL, NULL, NULL, NULL),
 -- past its retention date: expire_media() at the end of the load hides it and clears the raw copies of that call
 (s.id(25,11), s.id(6,1), NULL,      'drive',  '1GearAudio0011xYzABC',   'call_8007_20260827_1015.mp3', 'clients/apex-precision/media/call_8007_20260827_1015.mp3', 'MP3', 'audio/mpeg', 24000000, 1500, s.sha('media-11'), '2026-11-19 00:00+00', NULL, NULL, NULL),
 -- a duplicate upload the admin deleted
 (s.id(25,12), s.id(6,1), s.id(7,4), 'upload', NULL, NULL,                                                'clients/apex-precision/uploads/aero_call_duplicate.mp3',         'MP3', 'audio/mpeg', 5120000,   600,  s.sha('media-12'), NULL, '2026-11-10 09:00+00', s.id(7,1), s.id(7,1)),
 (s.id(25,13), s.id(6,2), s.id(7,12),'upload', NULL, NULL,                                                'clients/beta-sheet-metal/uploads/bracket_call_20261112.mp3',     'MP3', 'audio/mpeg', 12480000,  780,  s.sha('media-13'), NULL, NULL, NULL, NULL),
 (s.id(25,14), s.id(6,4), NULL,      'drive',  '1DeltaAudio0014xYzAB',   'anruf_8300_20261105_0900.mp3','clients/delta-foundry/media/anruf_8300_20261105_0900.mp3',        'MP3', 'audio/mpeg', 20160000,  1260, s.sha('media-14'), NULL, NULL, NULL, NULL);

-- ===== Table 26: meetings. Every processing status, every source and every match result; with and without a deal. =====
INSERT INTO meetings(meeting_id, client_user_id, lead_id, integration_id, media_file_id, crm_activity_id, crm_opportunity_id, name, source, source_detail, meeting_at, uploaded_at,
                     duration_sec, processing_status, failure_reason, match_status, overall_score, summary, language, tags, summary_embeddings, embedding_model, embedded_at, analysed_at,
                     created_by, updated_by, deleted_at, deleted_by) VALUES
 -- 1: Salesforce call plus Drive audio, fully analysed
 (s.id(26,1), s.id(7,4), s.id(21,1), s.id(15,1), s.id(25,1), s.id(20,1), '006Hs00001AERO1', 'AeroDynamics UK: Titanium Bracket Technical Feasibility & Drawing Review', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-11-08 14:30+00', '2026-11-08 18:45+00', 2538, 'analysed', NULL, 'matched', 78,
  'High-conviction technical alignment with Dr. Thomas Wright and Sarah Jenkins. Verified +/-5 micron bore tolerances on the titanium bracket and agreed a split delivery: 10 first articles in week 3, 90 units in week 7. The $8,500 tooling surcharge is only partly resolved.',
  'en', ARRAY['aerospace','titanium','tooling-cost','split-shipment'], s.vec(1), 'embed-3-large-1536', '2026-11-08 19:02+00', '2026-11-08 19:01+00', NULL, s.id(7,4), NULL, NULL),
 -- 2: audio arrived first from Drive and was matched to the Salesforce call afterwards
 (s.id(26,2), s.id(7,4), s.id(21,2), s.id(15,2), s.id(25,2), s.id(20,2), '006Hs00001BIOM2', 'BioMedix Instruments: Surgical Endoscope Micro-Shaft Assembly', 'drive', 'Google Drive / Call recordings',
  '2026-11-06 10:00+00', '2026-11-06 18:45+00', 2050, 'analysed', NULL, 'matched', 71,
  'Strong technical fit on micro-shaft concentricity. The buyer is price-sensitive against a cheaper incumbent and needs quality director approval for a supplier change.',
  'en', ARRAY['medical','cleanroom','price'], s.vec(2), 'embed-3-large-1536', '2026-11-06 19:00+00', '2026-11-06 18:59+00', NULL, NULL, NULL, NULL),
 -- 3: a second rep
 (s.id(26,3), s.id(7,5), s.id(21,3), s.id(15,1), s.id(25,3), s.id(20,3), '006Hs00001VOLT3', 'VoltDrive EV: Inverter Heat Sink Billet Extrusion & CNC Milling', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-11-07 15:30+00', '2026-11-07 18:45+00', 1725, 'analysed', NULL, 'matched', 66,
  'A competing bidder offers free fixtures. The buyer wants a per-unit price by next Friday; the rep did not anchor value before price came up.',
  'en', ARRAY['ev','competitor','pricing'], s.vec(3), 'embed-3-large-1536', '2026-11-07 19:00+00', '2026-11-07 18:59+00', NULL, NULL, NULL, NULL),
 -- 4: a call on a Salesforce Lead: no deal yet
 (s.id(26,4), s.id(7,4), NULL, s.id(15,1), s.id(25,4), s.id(20,4), NULL, 'Unassociated call: German auto component supplier, cold discovery', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-11-03 11:15+00', '2026-11-03 18:45+00', 1190, 'analysed', NULL, 'matched', 69,
  'Cold discovery call with a German auto component supplier. Good questioning; no deal exists yet.',
  'en', ARRAY['cold-call','germany'], NULL, NULL, NULL, '2026-11-03 19:00+00', NULL, NULL, NULL, NULL),
 -- 5: uploaded video recording, being transcribed
 (s.id(26,5), s.id(7,5), s.id(21,5), NULL, s.id(25,5), NULL, NULL, 'SatOrbit Propulsion: kickoff call, Thruster Nozzle Inconel Machining', 'upload', 'Uploaded in the app by Elena Rostova',
  '2026-11-12 11:00+00', '2026-11-12 12:40+00', 2700, 'transcribing', NULL, NULL, NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, s.id(7,5), NULL, NULL, NULL),
 -- 6: failed: the upload was cut off
 (s.id(26,6), s.id(7,4), NULL, NULL, s.id(25,6), NULL, NULL, 'Corrupted recording: audio stream truncated', 'upload', 'Uploaded in the app by Marcus Vance',
  '2026-11-14 16:20+00', '2026-11-14 16:30+00', 134, 'failed', 'The audio stream is cut off at 02:14 and cannot be decoded.', NULL, NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, s.id(7,4), NULL, NULL, NULL),
 -- 7: Drive audio that fits two Salesforce calls: an admin has to choose
 (s.id(26,7), s.id(7,4), s.id(21,6), s.id(15,2), s.id(25,7), NULL, NULL, 'HydroMarine Pumps: Bronze Impeller 5-Axis Turning & Dynamic Balance', 'drive', 'Google Drive / Call recordings',
  '2026-11-10 14:00+00', '2026-11-10 18:45+00', 1880, 'unmatched', NULL, 'ambiguous', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
 -- 8: Salesforce call logged, audio not copied to Drive yet
 (s.id(26,8), s.id(7,4), NULL, s.id(15,1), NULL, s.id(20,5), NULL, 'Inbound enquiry: Kestrel Marine fixture plates repeat quote', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-11-19 16:40+00', '2026-11-19 17:00+00', 420, 'awaiting_audio', NULL, NULL, NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
 -- 9: Drive audio with no Salesforce call at all (the owner is known from the phone extension)
 (s.id(26,9), s.id(7,7), NULL, s.id(15,2), s.id(25,8), NULL, NULL, 'Recording call_8013_20261117_1030 (no matching Salesforce call)', 'drive', 'Google Drive / Call recordings',
  '2026-11-17 10:30+00', '2026-11-17 18:45+00', 960, 'unmatched', NULL, 'unmatched', NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
 -- 10: a text file of call notes, waiting in the queue
 (s.id(26,10), s.id(7,7), s.id(21,8), NULL, s.id(25,9), NULL, NULL, 'Precision Optics: intro call notes (text file)', 'upload', 'Uploaded in the app by Tom Becker',
  NULL, '2026-11-18 09:10+00', NULL, 'queued', NULL, NULL, NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, s.id(7,7), NULL, NULL, NULL),
 -- 11: analysis is running
 (s.id(26,11), s.id(7,5), s.id(21,4), s.id(15,1), s.id(25,10), s.id(20,6), '006Hs00001NORD4', 'Nordic Defense: subsea sonar housing requirements call', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-10-29 13:00+00', '2026-10-29 18:45+00', 1980, 'analysing', NULL, 'matched', NULL, NULL, NULL, ARRAY['defence','subsea']::text[], NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
 -- 12: an old call whose recording has expired (its raw copies are cleared by expire_media() below)
 (s.id(26,12), s.id(7,4), s.id(21,7), s.id(15,1), s.id(25,11), s.id(20,7), '006Hs00001GEAR5', 'Gearwerk: planetary gearbox housings, quote review', 'crm', 'Salesforce: Apex Precision Engineering',
  '2026-08-27 10:15+00', '2026-08-27 18:45+00', 1500, 'analysed', NULL, 'matched', 59,
  'Revised quote review. The buyer chose a supplier that delivers in six weeks.',
  'en', ARRAY['lost-deal','lead-time'], s.vec(12), 'embed-3-large-1536', '2026-08-27 19:00+00', '2026-08-27 18:59+00', NULL, NULL, NULL, NULL),
 -- 13: a duplicate upload the admin deleted
 (s.id(26,13), s.id(7,4), s.id(21,1), NULL, s.id(25,12), NULL, NULL, 'AeroDynamics call (duplicate upload)', 'upload', NULL,
  '2026-11-09 09:00+00', '2026-11-09 09:10+00', 600, 'queued', NULL, NULL, NULL, NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL, NULL, s.id(7,4), NULL, '2026-11-10 09:00+00', s.id(7,1)),
 -- 14: Beta, manual upload on the free plan
 (s.id(26,14), s.id(7,12), s.id(21,9), NULL, s.id(25,13), NULL, NULL, 'Kestrel Marine: sheet metal bracket batch', 'upload', 'Uploaded in the app by Chris Lee',
  '2026-11-12 13:00+00', '2026-11-12 13:20+00', 780, 'analysed', NULL, NULL, 82,
  'Quick call about a 500-piece bracket batch. The buyer prefers a local shop; the rep offered a 10-working-day lead time.',
  'en', ARRAY['sheet-metal','local-supplier'], s.vec(14), 'embed-3-large-1536', '2026-11-12 13:40+00', '2026-11-12 13:39+00', s.id(7,12), NULL, NULL, NULL),
 -- 15: Delta, a call in German
 (s.id(26,15), s.id(7,19), s.id(21,10), s.id(15,6), s.id(25,14), s.id(20,13), '006De00001RHIN1', 'Rhine Automotive: Porosität bei Motorblöcken', 'crm', 'Salesforce: Delta Foundry',
  '2026-11-05 09:00+00', '2026-11-05 18:45+00', 1260, 'analysed', NULL, 'matched', 74,
  'Die Qualitätsabteilung verlangt eine Röntgenprüfung für jede Charge. Der Prüfplan wird noch heute gesendet.',
  'de', ARRAY['casting','porosity','x-ray'], NULL, NULL, NULL, '2026-11-05 19:00+00', NULL, NULL, NULL, NULL);

-- ===== Table 31: transcript_segments: one row per speaker turn. raw_text is what the speech engine heard; text is cleaned. =====
INSERT INTO transcript_segments(transcript_segment_id, meeting_id, seq, speaker, speaker_role, start_ms, end_ms, text, language, asr_confidence, tags, embeddings, embedding_model, embedded_at) VALUES
 -- meeting 1 (AeroDynamics): the full report is built on these turns
 (s.id(31,1),  s.id(26,1), 1,  'Marcus Vance',      'rep',      0,       21000,   'Good morning Thomas, thank you for joining. Before we review the 5-axis tolerances for the bracket housing, I wanted to share our recent ISO audit results.', 'en', 0.964, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,2),  s.id(26,1), 2,  'Dr. Thomas Wright', 'prospect', 95000,   122000,  'Thanks Marcus. The critical feature is the pylon bracket bore, plus or minus five microns across the full depth, in Ti-6Al-4V.', 'en', 0.951, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,3),  s.id(26,1), 3,  'Marcus Vance',      'rep',      210000,  232000,  'Could you clarify whether the anodizing layer is factored into the 15-micron inner diameter bore tolerance or applied post-reaming?', 'en', 0.972, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,4),  s.id(26,1), 4,  'Dr. Thomas Wright', 'prospect', 350000,  365000,  'It is applied after reaming, so the bore has to be measured before anodising.', 'en', 0.938, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,5),  s.id(26,1), 5,  'Marcus Vance',      'rep',      480000,  505000,  'What happens if the batch 1 test specimens arrive in 4 weeks rather than 6 weeks? How does that alter your wind-tunnel test window?', 'en', 0.968, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,6),  s.id(26,1), 6,  'Dr. Thomas Wright', 'prospect', 640000,  672000,  'Our wind-tunnel window starts in Q3. And our last subcontractor gave us harmonic vibration and severe bore distortion, so we cannot afford a repeat.', 'en', 0.947, ARRAY['risk','quality'], s.vec(6), 'embed-3-large-1536', '2026-11-08 19:00+00'),
 (s.id(31,7),  s.id(26,1), 7,  'Marcus Vance',      'rep',      800000,  848000,  'I hear your concern loud and clear regarding harmonic vibration during rapid spindle passes. Because Ti-6Al-4V work hardens rapidly under tool deflection, we utilize high-pressure through-spindle coolant at 70 bar with variable-pitch endmills.', 'en', 0.981, ARRAY['technical','titanium'], NULL, NULL, NULL),
 (s.id(31,8),  s.id(26,1), 8,  'Dr. Thomas Wright', 'prospect', 1010000, 1018000, 'That is what our engineers wanted to hear.', 'en', 0.903, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,9),  s.id(26,1), 9,  'Marcus Vance',      'rep',      1100000, 1150000, 'We will assign this run to our dedicated Hermle C42 machining center paired with in-process Renishaw laser tool probing. We will provide full mill test certificates and 100% CMM dimensional inspection logs with every lot. Our in-house CMM eliminates third-party lab inspection latency.', 'en', 0.977, ARRAY['solution'], NULL, NULL, NULL),
 (s.id(31,10), s.id(26,1), 10, 'Sarah Jenkins',     'prospect', 1320000, 1340000, 'My concern is lead time. Our flight test is in four weeks and your standard lead time is eight weeks.', 'en', 0.955, ARRAY['lead-time','objection'], s.vec(10), 'embed-3-large-1536', '2026-11-08 19:00+00'),
 (s.id(31,11), s.id(26,1), 11, 'Marcus Vance',      'rep',      1560000, 1590000, 'I understand 8 weeks is tight for your airframe integration; what if we deliver 10 first articles in 3 weeks and the remaining 90 units in week 7?', 'en', 0.974, ARRAY['split-shipment'], NULL, NULL, NULL),
 (s.id(31,12), s.id(26,1), 12, 'Sarah Jenkins',     'prospect', 1700000, 1725000, 'That could work. But the eight and a half thousand dollar tooling charge was not in our prototype budget.', 'en', 0.929, ARRAY['pricing','objection'], s.vec(12), 'embed-3-large-1536', '2026-11-08 19:00+00'),
 (s.id(31,13), s.id(26,1), 13, 'Marcus Vance',      'rep',      1900000, 1920000, 'We can look at the formal numbers once we receive your native STEP files next week.', 'en', 0.969, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,14), s.id(26,1), 14, 'Dr. Thomas Wright', 'prospect', 2050000, 2062000, 'Can you amortise that fee across the first hundred units?', 'en', 0.958, ARRAY['pricing'], NULL, NULL, NULL),
 (s.id(31,15), s.id(26,1), 15, 'Marcus Vance',      'rep',      2200000, 2230000, 'Let us lock in Tuesday at 2 PM GMT for the formal engineering drawing sign-off and pricing review.', 'en', 0.983, ARRAY['next-step'], NULL, NULL, NULL),
 (s.id(31,16), s.id(26,1), 16, 'Dr. Thomas Wright', 'prospect', 2300000, 2312000, 'Agreed. Please send the NDA pack today and I will release the STEP files.', 'en', 0.944, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,17), s.id(26,1), 17, 'Marcus Vance',      'rep',      2410000, 2428000, 'I will send the non-disclosure execution pack and our tooling study by end of day today.', 'en', 0.976, ARRAY['next-step'], NULL, NULL, NULL),
 -- meeting 2 (BioMedix)
 (s.id(31,18), s.id(26,2), 1,  'Marcus Vance',      'rep',      0,       18000,   'Thanks for making time, Karen and Joel. I would like to start with the shaft tolerances and then talk about cleanroom packaging.', 'en', 0.966, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,19), s.id(26,2), 2,  'Dr. Karen Holt',    'prospect', 150000,  180000,  'The micro-shaft needs a concentricity of two microns, and every lot must ship with Class 7 cleanroom packaging certificates.', 'en', 0.952, ARRAY['cleanroom'], NULL, NULL, NULL),
 (s.id(31,20), s.id(26,2), 3,  'Marcus Vance',      'rep',      300000,  322000,  'Our Swiss-type cells hold that concentricity routinely. I will send the packaging verification certificates from our last medical lot.', 'en', 0.971, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,21), s.id(26,2), 4,  'Joel Nakamura',     'prospect', 900000,  925000,  'Our current supplier is about twenty percent cheaper. Can you match that?', 'en', 0.949, ARRAY['pricing','competitor'], NULL, NULL, NULL),
 (s.id(31,22), s.id(26,2), 5,  'Marcus Vance',      'rep',      1100000, 1130000, 'I cannot match a headline price, but I can show total cost including scrap and re-inspection, which is where most of the savings are.', 'en', 0.968, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,23), s.id(26,2), 6,  'Dr. Karen Holt',    'prospect', 1800000, 1822000, 'Any supplier change has to be approved by our quality director before we can place a pilot order.', 'en', 0.941, ARRAY['decision-process'], NULL, NULL, NULL),
 -- meeting 3 (VoltDrive)
 (s.id(31,24), s.id(26,3), 1,  'Elena Rostova',     'rep',      0,       16000,   'Thank you both. Let us go through the heat sink billet extrusion and the milling plan for the inverter casing.', 'en', 0.962, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,25), s.id(26,3), 2,  'Lukas Brandt',      'prospect', 400000,  425000,  'Our other bidder offers free fixtures and tooling. Why should we pay for yours?', 'en', 0.957, ARRAY['competitor'], NULL, NULL, NULL),
 (s.id(31,26), s.id(26,3), 3,  'Elena Rostova',     'rep',      600000,  630000,  'Our fixtures are reusable for the whole programme, so the cost per unit drops once volumes ramp up.', 'en', 0.965, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,27), s.id(26,3), 4,  'Lukas Brandt',      'prospect', 1500000, 1522000, 'We need a clear price per unit by next Friday, otherwise we go with them.', 'en', 0.946, ARRAY['deadline'], NULL, NULL, NULL),
 -- meeting 12 (Gearwerk, recording expired): raw text and vectors below are cleared by expire_media()
 (s.id(31,28), s.id(26,12), 1, 'Marcus Vance',      'rep',      0,       14000,   'Hello Jens, I wanted to walk through the revised quote for the planetary gearbox housings.', 'en', 0.961, ARRAY[]::text[], s.vec(28), 'embed-3-large-1536', '2026-08-27 19:00+00'),
 (s.id(31,29), s.id(26,12), 2, 'Jens Weber',        'prospect', 200000,  222000,  'We have decided to go with a supplier that can deliver in six weeks.', 'en', 0.948, ARRAY['lead-time'], s.vec(29), 'embed-3-large-1536', '2026-08-27 19:00+00'),
 (s.id(31,30), s.id(26,12), 3, 'Marcus Vance',      'rep',      300000,  318000,  'Understood. Can I ask what lead time you need so we can see if there is any flexibility?', 'en', 0.970, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,31), s.id(26,12), 4, 'Jens Weber',        'prospect', 400000,  410000,  'Six weeks, firm. I am sorry, Marcus.', 'en', 0.935, ARRAY[]::text[], NULL, NULL, NULL),
 -- meeting 14 (Beta): no raw text and no confidence score from this speech engine
 (s.id(31,32), s.id(26,14), 1, 'Chris Lee',         'rep',      0,       12000,   'Thanks for calling about the bracket batch. How many pieces do you need and what is the delivery window?', NULL, NULL, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,33), s.id(26,14), 2, 'Owen Hart',         'prospect', 40000,   62000,   'About five hundred brackets. We normally buy from a local shop down the road.', 'en', NULL, ARRAY['local-supplier'], s.vec(33), 'embed-3-large-1536', '2026-11-12 13:40+00'),
 (s.id(31,34), s.id(26,14), 3, 'Chris Lee',         'rep',      90000,   112000,  'We can beat their lead time and deliver in ten working days. I will send a quote today.', 'en', NULL, ARRAY[]::text[], NULL, NULL, NULL),
 -- meeting 15 (Delta, German)
 (s.id(31,35), s.id(26,15), 1, 'Mara Klein',        'rep',      0,       15000,   'Guten Tag Herr Weber, hier ist Mara Klein von Delta Foundry. Wir sprechen heute über die Porosität bei den Motorblöcken.', 'de', 0.931, ARRAY[]::text[], NULL, NULL, NULL),
 (s.id(31,36), s.id(26,15), 2, 'Herr Weber',        'prospect', 300000,  325000,  'Unsere Qualitätsabteilung verlangt eine Röntgenprüfung für jede Charge.', 'de', 0.918, ARRAY['qualität'], NULL, NULL, NULL),
 (s.id(31,37), s.id(26,15), 3, 'Mara Klein',        'rep',      500000,  NULL,    'Das ist bei uns Standard. Ich schicke Ihnen den Prüfplan noch heute.', 'de', 0.944, ARRAY[]::text[], NULL, NULL, NULL);
-- what the speech engine heard: no punctuation, lower case, some fillers (only for the engines that return it)
UPDATE transcript_segments SET raw_text = lower(regexp_replace(text, '[^[:alnum:] -]', '', 'g'))
 WHERE meeting_id IN (s.id(26,1), s.id(26,2), s.id(26,3), s.id(26,12));
UPDATE transcript_segments SET raw_text = 'um ' || raw_text WHERE transcript_segment_id IN (s.id(31,1), s.id(31,13), s.id(31,22), s.id(31,28));

-- ===== Table 27: analysis_runs: every kind and status =====
INSERT INTO analysis_runs(analysis_run_id, meeting_id, kind, status, model, prompt_version, input_tokens, output_tokens, credits_charged, raw_output, started_at, finished_at, error) VALUES
 (s.id(27,1),  s.id(26,1),  'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":6120,"language":"en","duration_sec":2538}',                                  '2026-11-08 18:50+00', '2026-11-08 18:56+00', NULL),
 (s.id(27,2),  s.id(26,1),  'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 18420, 2210, 15, '{"overall_score":78,"cues":[{"cue":1,"score":4},{"cue":2,"score":5},{"cue":8,"score":2}]}',  '2026-11-08 18:56+00', '2026-11-08 19:01+00', NULL),
 (s.id(27,3),  s.id(26,1),  'rescore',       'success', 'analysis-model-2026-10',  'cue-scoring-v15', 18420, 2150, 0,  '{"overall_score":78,"changed_cues":[]}',                                               '2026-11-12 10:00+00', '2026-11-12 10:03+00', NULL),
 (s.id(27,4),  s.id(26,2),  'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":4980,"language":"en","duration_sec":2050}',                                  '2026-11-06 18:50+00', '2026-11-06 18:55+00', NULL),
 (s.id(27,5),  s.id(26,2),  'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 15100, 1890, 15, '{"overall_score":71,"cues":[{"cue":2,"score":4},{"cue":8,"score":3}]}',                '2026-11-06 18:55+00', '2026-11-06 18:59+00', NULL),
 (s.id(27,6),  s.id(26,3),  'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":4210,"language":"en","duration_sec":1725}',                                  '2026-11-07 18:50+00', '2026-11-07 18:54+00', NULL),
 (s.id(27,7),  s.id(26,3),  'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 12800, 1620, 15, '{"overall_score":66,"cues":[{"cue":8,"score":2},{"cue":9,"score":2}]}',                '2026-11-07 18:54+00', '2026-11-07 18:59+00', NULL),
 (s.id(27,8),  s.id(26,4),  'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":2890,"language":"en","duration_sec":1190}',                                  '2026-11-03 18:50+00', '2026-11-03 18:53+00', NULL),
 (s.id(27,9),  s.id(26,4),  'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 8900,  1210, 15, '{"overall_score":69,"cues":[{"cue":3,"score":4}]}',                                    '2026-11-03 18:53+00', '2026-11-03 19:00+00', NULL),
 (s.id(27,10), s.id(26,5),  'transcription', 'running', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  NULL,                                                                                      '2026-11-12 12:45+00', NULL,                  NULL),
 (s.id(27,11), s.id(26,6),  'transcription', 'failed',  'speech-large-v3',         NULL,             NULL,  NULL, 15, NULL,                                                                                      '2026-11-14 16:31+00', '2026-11-14 16:31+00', 'Audio stream truncated: the decoder reached end of file at 02:14'),
 (s.id(27,12), s.id(26,10), 'analysis',      'queued',  NULL,                      NULL,             NULL,  NULL, 0,  NULL,                                                                                      NULL,                  NULL,                  NULL),
 (s.id(27,13), s.id(26,11), 'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":4620,"language":"en","duration_sec":1980}',                                  '2026-10-29 18:50+00', '2026-10-29 18:55+00', NULL),
 (s.id(27,14), s.id(26,11), 'analysis',      'running', 'analysis-model-2026-10',  'cue-scoring-v15', NULL,  NULL, 0,  NULL,                                                                                      '2026-11-20 08:55+00', NULL,                  NULL),
 (s.id(27,15), s.id(26,12), 'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":3400,"language":"en","duration_sec":1500}',                                  '2026-08-27 18:50+00', '2026-08-27 18:54+00', NULL),
 (s.id(27,16), s.id(26,12), 'analysis',      'success', 'analysis-model-2026-08',  'cue-scoring-v12', 9800,  1300, 15, '{"overall_score":59,"cues":[{"cue":9,"score":2}]}',                                    '2026-08-27 18:54+00', '2026-08-27 18:59+00', NULL),
 (s.id(27,17), s.id(26,14), 'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":1800,"language":"en","duration_sec":780}',                                   '2026-11-12 13:25+00', '2026-11-12 13:30+00', NULL),
 (s.id(27,18), s.id(26,14), 'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 5200,  900,  15, '{"overall_score":82,"cues":[{"cue":1,"score":4}]}',                                    '2026-11-12 13:30+00', '2026-11-12 13:39+00', NULL),
 (s.id(27,19), s.id(26,15), 'transcription', 'success', 'speech-large-v3',         NULL,             NULL,  NULL, 0,  '{"words":2950,"language":"de","duration_sec":1260}',                                  '2026-11-05 18:50+00', '2026-11-05 18:55+00', NULL),
 (s.id(27,20), s.id(26,15), 'analysis',      'success', 'analysis-model-2026-10',  'cue-scoring-v14', 7600,  1100, 15, '{"overall_score":74,"cues":[{"cue":5,"score":4}]}',                                    '2026-11-05 18:55+00', '2026-11-05 19:00+00', NULL);

-- ===== Table 28: meeting_insights: the four kinds of finding in the report =====
INSERT INTO meeting_insights(meeting_insight_id, meeting_id, kind, body, position) VALUES
 (s.id(28,1),  s.id(26,1),  'went_well',        'Showcased exceptional technical understanding of Ti-6Al-4V thermal dissipation and milling behaviour.', 1),
 (s.id(28,2),  s.id(26,1),  'went_well',        'Uncovered the Q3 flight testing milestone, which gives the prototype batch high urgency.', 2),
 (s.id(28,3),  s.id(26,1),  'went_well',        'Secured firm agreement for native STEP file handover and a follow-up commercial review.', 3),
 (s.id(28,4),  s.id(26,1),  'struggled',        'Delayed the commercial pricing discussion until the closing minutes of the call.', 1),
 (s.id(28,5),  s.id(26,1),  'struggled',        'Did not quantify the dollar savings from the 99.8% first-pass yield.', 2),
 (s.id(28,6),  s.id(26,1),  'struggled',        'Stumbled slightly when procurement challenged the custom carbide endmill charges.', 3),
 (s.id(28,7),  s.id(26,1),  'could_be_better',  'Introduce the commercial envelope during requirement discovery so budget is set before engineering concessions.', 1),
 (s.id(28,8),  s.id(26,1),  'could_be_better',  'Prepare a one-page amortised tooling cost table for aerospace procurement officers.', 2),
 (s.id(28,9),  s.id(26,1),  'next_step',        'Email the NDA and tooling feasibility study by 5:00 PM GMT.', 1),
 (s.id(28,10), s.id(26,1),  'next_step',        'Calendar Tuesday 2:00 PM for the formal drawing sign-off and commercial proposal.', 2),
 (s.id(28,11), s.id(26,1),  'next_step',        'Sync the agreed milestone dates with the Salesforce Opportunity.', 3),
 (s.id(28,12), s.id(26,2),  'went_well',        'Handled the cleanroom packaging requirement with a concrete promise of certificates.', 1),
 (s.id(28,13), s.id(26,2),  'struggled',        'Did not ask who else must approve a supplier change.', 1),
 (s.id(28,14), s.id(26,2),  'could_be_better',  'Quantify scrap and re-inspection savings with the buyer''s own numbers.', 1),
 (s.id(28,15), s.id(26,2),  'next_step',        'Send the packaging certificates and a total-cost comparison.', 1),
 (s.id(28,16), s.id(26,3),  'struggled',        'Let the competing free-fixtures offer set the price conversation.', 1),
 (s.id(28,17), s.id(26,3),  'could_be_better',  'Compare total programme cost, not fixture cost.', 1),
 (s.id(28,18), s.id(26,3),  'next_step',        'Send a per-unit price by next Friday.', 1),
 (s.id(28,19), s.id(26,12), 'struggled',        'Did not ask about the required lead time before sending the revised quote.', 1),
 (s.id(28,20), s.id(26,12), 'could_be_better',  'Offer a split delivery earlier in the conversation.', 1);

-- ===== Table 29: meeting_cue_scores: one row per cue per call. Meeting 1 shows all 12 cues; others show the variants. =====
-- Apex scores cue 5 with its own version (cue 13), the one in force for its calls.
INSERT INTO meeting_cue_scores(meeting_cue_score_id, meeting_id, cue_id, score, is_assessable, observation, improvement, evidence, evidence_segment_id, severity) VALUES
 (s.id(29,1),  s.id(26,1), s.id(33,1),  4, true,  'Marcus established immediate rapport by referencing recent AS9100D audit milestones.', 'Frame the agenda earlier, before diving into the client''s engineering updates.', 'Good morning Thomas, thank you for joining. Before we review the 5-axis tolerances for the bracket housing, I wanted to share our recent ISO audit results...', s.id(31,1),  'positive'),
 (s.id(29,2),  s.id(26,1), s.id(33,2),  5, true,  'Thorough inspection of thermal dissipation requirements and strict +/-0.005 mm dimensioning.', 'Excellent depth; keep probing secondary surface treatments.', 'Could you clarify whether the anodizing layer is factored into the 15-micron inner diameter bore tolerance or applied post-reaming?', s.id(31,3),  'positive'),
 (s.id(29,3),  s.id(26,1), s.id(33,3),  4, true,  'Good balance of technical and procurement timeline questions. Uncovered the Q3 flight test.', 'Ask who else on the certification committee needs to sign off.', 'What happens if the batch 1 test specimens arrive in 4 weeks rather than 6 weeks? How does that alter your wind-tunnel test window?', s.id(31,5),  'positive'),
 (s.id(29,4),  s.id(26,1), s.id(33,4),  4, true,  'Let the lead engineer finish explaining the failure with competitor parts without interrupting.', 'Summarise the engineer''s words before introducing the titanium capability.', 'I hear your concern loud and clear regarding harmonic vibration during rapid spindle passes.', s.id(31,7),  'positive'),
 (s.id(29,5),  s.id(26,1), s.id(33,13), 5, true,  'Flawless grasp of Ti-6Al-4V work hardening, coolant strategy and 5-axis cycle optimisation.', 'None needed. The client praised the technical depth.', 'Because Ti-6Al-4V work hardens rapidly under tool deflection, we utilize high-pressure through-spindle coolant at 70 bar...', s.id(31,7),  'positive'),
 (s.id(29,6),  s.id(26,1), s.id(33,6),  4, true,  'Presented the dual-spindle cell and automated CMM inspection tailored to the drawing.', 'Compare turnaround against standard subcontract milling.', 'We will assign this run to our dedicated Hermle C42 machining center paired with in-process Renishaw laser tool probing.', NULL, 'positive'),     -- quote kept, line not linked
 (s.id(29,7),  s.id(26,1), s.id(33,7),  3, true,  'Stressed technical quality but did not quantify scrap reduction or unit cost.', 'Quantify that 99.8% first-pass yield saves about $42,000 in raw titanium billets.', 'Our in-house CMM eliminates third-party lab inspection latency.', s.id(31,9),  'warning'),
 (s.id(29,8),  s.id(26,1), s.id(33,8),  2, true,  'Left volume discounting until the end and did not ask about payment terms.', 'Anchor price early: ask for a target per-unit cost before waiving setup fees.', 'We can look at the formal numbers once we receive your native STEP files next week.', s.id(31,13), 'critical'),
 (s.id(29,9),  s.id(26,1), s.id(33,9),  3, true,  'Handled the lead time objection with a split shipment but stumbled on the tool wear surcharge.', 'Reframe tooling as an all-inclusive fixed manufacturing cost.', 'I understand 8 weeks is tight for your airframe integration; what if we deliver 10 first articles in 3 weeks and the remaining 90 units in week 7?', s.id(31,11), 'warning'),
 (s.id(29,10), s.id(26,1), s.id(33,10), 5, true,  'Provided credible evidence: metallurgical test certificates from prior aerospace runs.', 'Keep this level of factual detail.', 'We will provide full mill test certificates and 100% CMM dimensional inspection logs with every lot.', s.id(31,9),  'positive'),
 (s.id(29,11), s.id(26,1), s.id(33,11), 4, true,  'Agreed native CAD models by Friday and a commercial review on Tuesday.', 'Send the calendar invite while still on the call.', 'Let us lock in Tuesday at 2 PM GMT for the formal engineering drawing sign-off and pricing review.', s.id(31,15), 'positive'),
 (s.id(29,12), s.id(26,1), s.id(33,12), 4, true,  'Listed what Apex will prepare and what the client will release.', 'State the exact time the summary email will arrive.', 'I will send the non-disclosure execution pack and our tooling study by end of day today.', s.id(31,17), 'positive'),
 (s.id(29,13), s.id(26,2), s.id(33,2),  4, true,  'Opened with the tolerances and the packaging requirement.', 'Ask about volumes and release schedule.', 'I would like to start with the shaft tolerances and then talk about cleanroom packaging.', s.id(31,18), 'positive'),
 (s.id(29,14), s.id(26,2), s.id(33,13), 4, true,  'Confident on Swiss-type concentricity and packaging evidence.', 'Name the machine and the inspection method.', 'Our Swiss-type cells hold that concentricity routinely.', s.id(31,20), 'positive'),
 (s.id(29,15), s.id(26,2), s.id(33,8),  3, true,  'Raised total cost but did not ask about the buyer''s budget.', 'Ask what price the incumbent charges.', 'I cannot match a headline price, but I can show total cost including scrap and re-inspection.', s.id(31,22), 'warning'),
 (s.id(29,16), s.id(26,2), s.id(33,12), NULL, false, 'The call ended before follow-up responsibilities were discussed.', NULL, NULL, NULL, NULL),                                                    -- not assessable
 (s.id(29,17), s.id(26,3), s.id(33,8),  2, true,  'Let the competing free-fixtures offer frame the price discussion.', 'Ask for the buyer''s target price first.', 'Our fixtures are reusable for the whole programme, so the cost per unit drops once volumes ramp up.', s.id(31,26), 'critical'),
 (s.id(29,18), s.id(26,3), s.id(33,9),  2, true,  'Did not reframe fixtures as part of total programme cost.', 'Compare total programme cost, not fixture cost.', 'Our fixtures are reusable for the whole programme...', s.id(31,26), 'critical'),
 (s.id(29,19), s.id(26,3), s.id(33,11), 3, true,  'No clear next action was agreed before the call ended.', 'Propose a date for the price review.', NULL, NULL, 'warning'),
 (s.id(29,20), s.id(26,12), s.id(33,9), 2, true,  'Did not ask about the buyer''s required lead time.', 'Ask for the delivery window before quoting.', 'Understood. Can I ask what lead time you need so we can see if there is any flexibility?', s.id(31,30), 'critical'),
 (s.id(29,21), s.id(26,14), s.id(33,17), 5, true, 'Answered the local-shop concern in one sentence and offered a date.', NULL, 'We can beat their lead time and deliver in ten working days.', s.id(31,34), 'positive'),
 (s.id(29,22), s.id(26,14), s.id(33,1), 4, true,  NULL, NULL, 'Thanks for calling about the bracket batch.', s.id(31,32), 'positive'),
 (s.id(29,23), s.id(26,15), s.id(33,5), 4, true,  'Knew the inspection standard and offered a test plan the same day.', NULL, 'Das ist bei uns Standard. Ich schicke Ihnen den Prüfplan noch heute.', s.id(31,37), 'positive');

-- ===== Table 32: transcript_segment_cues: which cues a turn touches =====
INSERT INTO transcript_segment_cues(segment_id, cue_id) VALUES
 (s.id(31,1),  s.id(33,1)),  (s.id(31,3),  s.id(33,2)),  (s.id(31,5),  s.id(33,3)),  (s.id(31,7),  s.id(33,4)),  (s.id(31,7),  s.id(33,13)),
 (s.id(31,9),  s.id(33,6)),  (s.id(31,9),  s.id(33,7)),  (s.id(31,9),  s.id(33,10)), (s.id(31,11), s.id(33,9)),  (s.id(31,12), s.id(33,8)),
 (s.id(31,13), s.id(33,8)),  (s.id(31,15), s.id(33,11)), (s.id(31,17), s.id(33,12)), (s.id(31,20), s.id(33,13)), (s.id(31,22), s.id(33,9)),
 (s.id(31,34), s.id(33,17));

-- ===== Table 30: meeting_objections: all 7 categories (and none), all 3 statuses, with and without the exact line =====
INSERT INTO meeting_objections(meeting_objection_id, meeting_id, segment_id, at_ms, objection, category, rep_response, status, stronger_response) VALUES
 (s.id(30,1),  s.id(26,1),  s.id(31,6),  640000,  'Our last subcontractor gave us harmonic vibration and severe bore distortion; we cannot afford a repeat.', 'risk', 'Explained through-spindle coolant at 70 bar and variable-pitch endmills, and offered mill test certificates.', 'Resolved', 'Offer a reference call with a customer who had the same bore distortion problem.'),
 (s.id(30,2),  s.id(26,1),  s.id(31,10), 1320000, 'Our flight integration deadline requires first articles in 4 weeks, but the standard Apex lead time is 8 weeks.', 'timing', 'Offered a split shipment: 10 first articles in 3 weeks on a priority shift, the remaining 90 units in week 7.', 'Resolved', 'Confirm courier tracking and reserve the weekend machine slot in writing.'),
 (s.id(30,3),  s.id(26,1),  s.id(31,12), 1700000, 'The $8,500 dedicated tooling surcharge was not in our preliminary prototyping budget.', 'price', 'Explained that custom radius endmills are needed for the internal cavity fillets without chatter.', 'Partially Resolved', 'Offer to amortise the $8,500 over the first 100 production units if signed within 10 business days.'),
 (s.id(30,4),  s.id(26,2),  s.id(31,19), 150000,  'Every lot must ship with Class 7 cleanroom packaging certificates.', 'technical', 'Promised the verification certificates from the last medical lot.', 'Resolved', NULL),
 (s.id(30,5),  s.id(26,2),  s.id(31,21), 900000,  'Our current supplier is about twenty percent cheaper. Can you match that?', 'competitor', 'Offered a total-cost comparison instead of matching the price.', 'Partially Resolved', 'Quantify scrap and re-inspection savings with the buyer''s own numbers before showing a price.'),
 (s.id(30,6),  s.id(26,2),  s.id(31,23), 1800000, 'Any supplier change has to be approved by our quality director.', 'authority', NULL, 'Unresolved', 'Ask to include the quality director in the next call.'),
 (s.id(30,7),  s.id(26,3),  s.id(31,25), 400000,  'Our other bidder offers free fixtures and tooling.', 'competitor', 'Said the fixtures are reusable for the whole programme.', 'Unresolved', 'Compare total programme cost, not fixture cost.'),
 (s.id(30,8),  s.id(26,3),  s.id(31,27), 1500000, 'We need a clear price per unit by next Friday.', 'timing', NULL, 'Unresolved', 'Agree the date for the price review before ending the call.'),
 (s.id(30,9),  s.id(26,3),  NULL,        1650000, 'Budget approval is still pending on their side.', 'other', 'Asked when the budget is released.', 'Partially Resolved', NULL),                -- no exact line
 (s.id(30,10), s.id(26,12), s.id(31,29), 200000,  'We have decided to go with a supplier that can deliver in six weeks.', 'timing', 'Asked what lead time they need.', 'Unresolved', NULL),
 (s.id(30,11), s.id(26,12), NULL,        700000,  'Price was also mentioned as a concern.', NULL, NULL, 'Unresolved', NULL),                                                          -- no category, no line
 (s.id(30,12), s.id(26,14), s.id(31,33), 40000,   'We normally buy from a local shop down the road.', 'other', 'Offered a 10-working-day lead time and a same-day quote.', 'Resolved', NULL);

-- ===== Table 22: lead_stakeholders: the buyer-side people. All four sentiments, from Salesforce and added by hand. =====
INSERT INTO lead_stakeholders(lead_stakeholder_id, lead_id, name, role, company, email, crm_contact_id, sentiment, last_spoke_at, created_by, updated_by) VALUES
 (s.id(22,1),  s.id(21,1),  'Dr. Thomas Wright', 'Chief Airframe Engineer',          'AeroDynamics UK',          'thomas.wright@aerodynamics.example', '003Hs00001WR01', 'Champion',       '2026-11-08 14:30+00', NULL,      NULL),
 (s.id(22,2),  s.id(21,1),  'Sarah Jenkins',     'Senior Procurement Lead',          'AeroDynamics UK',          'sarah.jenkins@aerodynamics.example', '003Hs00001SJ01', 'Skeptic',        '2026-11-08 14:30+00', NULL,      NULL),
 (s.id(22,3),  s.id(21,1),  'Peter Macintyre',   'VP of Manufacturing & Quality',    'AeroDynamics UK',          'peter.macintyre@aerodynamics.example','003Hs00001PM01','Decision Maker', '2026-10-28 15:00+00', NULL,      NULL),
 (s.id(22,4),  s.id(21,1),  'Alan Reeves',       'Quality Inspector',                'AeroDynamics UK',          NULL,                                 NULL,             'Neutral',        NULL,                  s.id(7,4), s.id(7,4)),   -- added by the rep, not in Salesforce
 (s.id(22,5),  s.id(21,2),  'Dr. Karen Holt',    'Lead Quality Engineer',            'BioMedix Surgical Devices','karen.holt@biomedix.example',        '003Hs00001KH02', 'Champion',       '2026-11-06 10:00+00', NULL,      NULL),
 (s.id(22,6),  s.id(21,2),  'Joel Nakamura',     'Procurement Manager',              'BioMedix Surgical Devices','joel.nakamura@biomedix.example',     '003Hs00001JN02', 'Skeptic',        '2026-11-06 10:00+00', NULL,      NULL),
 (s.id(22,7),  s.id(21,3),  'Lukas Brandt',      'Head of Sourcing',                 'VoltDrive Mobility AG',    'lukas.brandt@voltdrive.example',     '003Hs00001LB03', 'Decision Maker', '2026-11-07 15:30+00', NULL,      NULL),
 (s.id(22,8),  s.id(21,3),  'Anika Vogel',       'Process Engineer',                 'VoltDrive Mobility AG',    'anika.vogel@voltdrive.example',      '003Hs00001AV03', 'Neutral',        '2026-11-07 15:30+00', NULL,      NULL),
 (s.id(22,9),  s.id(21,4),  'Ingrid Solberg',    'Technical Director',               'Nordic Marine Defense AS', 'ingrid.solberg@nordicmarine.example','003Hs00001IS06', 'Champion',       '2026-10-29 13:00+00', NULL,      NULL),
 (s.id(22,10), s.id(21,7),  'Jens Weber',        'Procurement Lead',                 'Gearwerk Industrial GmbH', 'jens.weber@gearwerk.example',        '003Hs00001JW07', 'Neutral',        '2026-08-27 10:15+00', NULL,      NULL),
 (s.id(22,11), s.id(21,10), 'Herr Weber',        'Quality Manager',                  'Rhine Automotive GmbH',    'weber@rhineauto.example',            '003De00001HW01', 'Skeptic',        '2026-11-05 09:00+00', NULL,      NULL),
 (s.id(22,12), s.id(21,1),  'Dev Patel',         NULL,                               NULL,                       NULL,                                 NULL,             'Neutral',        NULL,                  s.id(7,4), NULL);       -- name only

-- ===== Table 23: lead_timeline_events: meeting, email, stage_change and note =====
INSERT INTO lead_timeline_events(lead_timeline_event_id, lead_id, meeting_id, author_id, type, title, description, occurred_at, updated_by) VALUES
 (s.id(23,1),  s.id(21,1), s.id(26,1),  s.id(7,4), 'meeting',      'Drawing Review & Technical Feasibility', '42m call with Thomas and Sarah. Verified +/-5 micron bore tolerances and proposed a 3-week prototype split delivery.', '2026-11-08 14:30+00', NULL),
 (s.id(23,2),  s.id(21,1), NULL,        NULL,      'email',        'Updated Aerospace Drawing Rev C received', 'Received a preliminary PDF drawing showing the 5-axis wing pylon bracket geometry.', '2026-11-04 10:12+00', NULL),
 (s.id(23,3),  s.id(21,1), NULL,        NULL,      'stage_change', 'Moved to Technical Review', 'Salesforce stage changed from Prospecting to Technical Validation.', '2026-10-29 10:00+00', NULL),
 (s.id(23,4),  s.id(21,1), NULL,        s.id(7,4), 'note',         'Procurement wants an amortised tooling quote', 'Sarah asked for the $8,500 tooling fee to be spread over the first 100 units.', '2026-11-09 08:30+00', s.id(7,4)),
 (s.id(23,5),  s.id(21,2), s.id(26,2),  s.id(7,4), 'meeting',      'Surgical Endoscope Micro-Shaft Assembly', 'Call with Karen and Joel about concentricity and cleanroom packaging.', '2026-11-06 10:00+00', NULL),
 (s.id(23,6),  s.id(21,3), s.id(26,3),  s.id(7,5), 'meeting',      'Inverter Heat Sink Billet Extrusion & CNC Milling', 'Competing bidder offers free fixtures; buyer wants a per-unit price.', '2026-11-07 15:30+00', NULL),
 (s.id(23,7),  s.id(21,3), NULL,        NULL,      'stage_change', 'Moved to Negotiation', 'Salesforce stage changed to Negotiation/Review.', '2026-11-07 15:45+00', NULL),
 (s.id(23,8),  s.id(21,7), s.id(26,12), s.id(7,4), 'meeting',      'Quote review', 'Buyer chose a supplier that delivers in six weeks.', '2026-08-27 10:15+00', NULL),
 (s.id(23,9),  s.id(21,7), NULL,        NULL,      'stage_change', 'Moved to Closed Lost', 'Salesforce stage changed to Closed Lost.', '2026-10-22 12:00+00', NULL),
 (s.id(23,10), s.id(21,4), s.id(26,11), s.id(7,5), 'meeting',      'Requirements call', 'Material, pressure rating and test certificates discussed.', '2026-10-29 13:00+00', NULL),
 (s.id(23,11), s.id(21,5), NULL,        NULL,      'stage_change', 'Moved to Closed Won', 'Salesforce stage changed to Closed Won.', '2026-10-09 16:00+00', NULL),
 (s.id(23,12), s.id(21,6), NULL,        s.id(7,4), 'note',         'Needs a drawing before a quote', 'Prospect has no drawing yet; asked for a sample part.', '2026-11-10 15:00+00', NULL),
 (s.id(23,13), s.id(21,1), NULL,        s.id(7,4), 'note',         'Spoke to reception', NULL, '2026-11-11 09:00+00', NULL);

-- ===== Table 24: lead_risks: open and resolved, found by the AI or added by a rep =====
INSERT INTO lead_risks(lead_risk_id, lead_id, text, detected_at, resolved_at, created_by, updated_by) VALUES
 (s.id(24,1), s.id(21,1), 'The client''s flight testing deadline demands the first 10 articles in 3 weeks.', '2026-11-08 15:30+00', NULL,                  NULL,      NULL),
 (s.id(24,2), s.id(21,1), 'Procurement is pushing back on the $8,500 dedicated carbide tooling surcharge.', '2026-11-08 15:30+00', NULL,                  NULL,      NULL),
 (s.id(24,3), s.id(21,1), 'A competitor (Vanguard Precision) submitted alternative quotes.',               '2026-11-04 12:00+00', '2026-11-09 10:00+00', s.id(7,4), s.id(7,4)),
 (s.id(24,4), s.id(21,2), 'The current supplier is about 20% cheaper.',                                    '2026-11-06 11:00+00', NULL,                  NULL,      NULL),
 (s.id(24,5), s.id(21,3), 'A competing bidder offers free fixtures and tooling.',                          '2026-11-07 16:00+00', NULL,                  NULL,      NULL),
 (s.id(24,6), s.id(21,7), 'The buyer needs delivery in six weeks.',                                        '2026-08-27 11:00+00', '2026-10-22 12:00+00', NULL,      NULL);
