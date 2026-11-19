-- ===== Table 15: integrations. One CRM and one Drive link per company at most. All 3 statuses and all 7 sync intervals. =====
SELECT s.act_as_owner();
INSERT INTO integrations(integration_id, client_id, type, provider, status, org_name, provider_org_id, folder_id, folder, sync_interval,
                         last_sync_at, last_sync_result, next_sync_at, sync_cursor, connected_by, connected_at, created_by, updated_by) VALUES
 (s.id(15,1), s.id(6,1), 'crm',   'salesforce',   'connected',    'Apex Precision Engineering (Production)', '00DHs000000ApexAAA', NULL, NULL,                 '1h',
  '2026-11-20 08:00+00', 'Imported 3 of 42 calls, updated 1 deal',                '2026-11-20 09:00+00', '2026-11-20T07:58:41.000+0000', s.id(7,1),  '2026-09-02 10:15+00', s.id(7,1),  s.id(7,1)),
 (s.id(15,2), s.id(6,1), 'drive', 'google_drive', 'connected',    'apexengineering.example',                 NULL,                 '1pQ9XkR2vLmN8sT4uWyZ0aBcDeFgHiJkL', 'Call recordings', '24h',
  '2026-11-19 18:30+00', 'Found 6 new recordings, imported 6',                    '2026-11-20 18:30+00', 'drive-change-token-88142',          s.id(7,1),  '2026-09-02 10:40+00', s.id(7,1),  NULL),
 (s.id(15,3), s.id(6,2), 'drive', 'google_drive', 'connected',    'betasheetmetal.example',                  NULL,                 '1mZ4cVbN7qWeR2tYuI9oPaSdFgHjKlXcV', 'Sales calls',     'manual',
  '2026-11-14 11:02+00', 'Found 2 new recordings, imported 2',                    NULL,                  'drive-change-token-1207',           s.id(7,10), '2026-10-12 09:00+00', s.id(7,10), NULL),
 (s.id(15,4), s.id(6,3), 'crm',   'salesforce',   'error',        'Cedar Composites (Production)',           '00DCe000000CedarAA', NULL, NULL,                 '15m',
  '2026-11-20 06:45+00', 'Failed: INVALID_SESSION_ID, the refresh token was revoked', '2026-11-20 07:00+00', '2026-11-19T21:10:02.000+0000', s.id(7,15), '2026-11-18 14:00+00', s.id(7,15), NULL),
 (s.id(15,5), s.id(6,3), 'drive', 'google_drive', 'disconnected', NULL,                                      NULL,                 NULL, NULL,               '30m',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
 (s.id(15,6), s.id(6,4), 'crm',   'salesforce',   'connected',    'Delta Foundry (Production)',              '00DDe000000DeltaAA', NULL, NULL,                 '6h',
  '2026-11-15 06:00+00', 'Imported 1 of 9 calls',                                 '2026-11-15 12:00+00', '2026-11-15T05:59:10.000+0000', s.id(7,17), '2026-07-01 08:30+00', s.id(7,17), NULL),
 (s.id(15,7), s.id(6,4), 'drive', 'google_drive', 'connected',    'deltafoundry.example',                    NULL,                 '1rTy6uIo8pAsDf3gHjKl5zXcVbNm9QwEr', 'Anrufe',           '12h',
  '2026-11-15 00:00+00', 'Found 1 new recording, imported 1',                     '2026-11-15 12:00+00', 'drive-change-token-5530',           s.id(7,17), '2026-07-01 08:45+00', s.id(7,17), NULL),
 (s.id(15,8), s.id(6,5), 'crm',   'salesforce',   'disconnected', 'Echo Fabrication (Production)',           '00DEc000000EchoAAA', NULL, NULL,                 '1h',
  '2026-10-29 09:00+00', 'Disconnected by the admin before offboarding',          NULL,                  NULL,                                s.id(7,20), '2026-05-03 09:00+00', s.id(7,20), s.id(7,20));

-- ===== Table 16: integration_credentials. Tokens are encrypted bytes (shown here as stand-in bytes). A disconnected link keeps no tokens. =====
INSERT INTO integration_credentials(integration_id, access_token_enc, refresh_token_enc, instance_url, scopes, expires_at, key_version) VALUES
 (s.id(15,1), s.blob('apex-crm-access'),   s.blob('apex-crm-refresh'),   'https://apexengineering.my.salesforce.com', 'api refresh_token offline_access',                  '2026-11-20 09:58+00', 2),
 (s.id(15,2), s.blob('apex-drive-access'), s.blob('apex-drive-refresh'), NULL,                                          'https://www.googleapis.com/auth/drive.readonly', '2026-11-20 09:40+00', 2),
 (s.id(15,3), s.blob('beta-drive-access'), s.blob('beta-drive-refresh'), NULL,                                          'https://www.googleapis.com/auth/drive.readonly', '2026-11-14 12:02+00', 1),
 (s.id(15,4), s.blob('cedar-crm-access'),  s.blob('cedar-crm-refresh'),  'https://cedarcomposites.my.salesforce.com',   'api refresh_token offline_access',                  '2026-11-20 05:45+00', 1),
 (s.id(15,5), NULL,                        NULL,                         NULL,                                          NULL,                                              NULL,                  1),
 (s.id(15,6), s.blob('delta-crm-access'),  s.blob('delta-crm-refresh'),  'https://deltafoundry.my.salesforce.com',      'api refresh_token offline_access',                  '2026-11-15 07:00+00', 2),
 (s.id(15,7), s.blob('delta-drive-access'),s.blob('delta-drive-refresh'),NULL,                                          'https://www.googleapis.com/auth/drive.readonly', '2026-11-15 00:55+00', 2),
 (s.id(15,8), NULL,                        NULL,                         NULL,                                          NULL,                                              NULL,                  1);

-- ===== Table 19: crm_stage_mappings. The default Salesforce stages are loaded by the function; companies add their own. =====
SELECT seed_salesforce_stage_mappings(s.id(6,1));
INSERT INTO crm_stage_mappings(crm_stage_mapping_id, client_id, crm_stage, sellmore_stage, created_by, updated_by) VALUES
 (s.id(19,101), s.id(6,1), 'Pilot Review',     'Technical Review',    s.id(7,1),  s.id(7,1)),
 (s.id(19,102), s.id(6,4), 'Tooling Approval', 'Commercial Proposal', s.id(7,17), NULL),
 (s.id(19,103), s.id(6,4), 'PO Received',      'Closed Won',          s.id(7,17), s.id(7,18));

-- ===== Table 20: crm_activities (Salesforce calls and meetings exactly as received). Both directions, every outcome, Contact / Lead / none. =====
INSERT INTO crm_activities(crm_activity_id, client_id, integration_id, external_id, kind, subject, description, direction, outcome, phone_number,
                           started_at, duration_sec, who_type, who_id, what_type, what_id, account_name, owner_crm_id, owner_user_id, recording_url, raw, synced_at) VALUES
 -- 1: outbound call on a deal, with the AI summary the evening job wrote into Comments
 (s.id(20,1), s.id(6,1), s.id(15,1), '00THs00000AERO801', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 09/11/2026\nReason: Technical feasibility and drawing review for the titanium bracket.\nDiscussed: +/-5 micron bore, split shipment (10 in week 3, 90 in week 7), tooling charge.\nConcerns: 4-week flight test deadline; $8,500 tooling surcharge.\nNext step: NDA pack and tooling study today; drawing sign-off Tuesday 2 PM.\nFollow-up needed: Yes.\n\nMarcus (8007) called Dr. Thomas Wright\nCall Duration: 42m 18s\nView details in Yappl',
  'outbound', 'answered', '+442079460142', '2026-11-08 14:30+00', 2538, 'Contact', '003Hs00001WR01', 'Opportunity', '006Hs00001AERO1', 'AeroDynamics UK Ltd', '005Hs000001MV01', s.id(7,4),
  'https://yappl.example/calls/8007-20261108-1430',
  '{"Id":"00THs00000AERO801","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":2538,"WhoId":"003Hs00001WR01","WhatId":"006Hs00001AERO1","OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-11-09 18:50+00'),
 -- 2: inbound call on a deal
 (s.id(20,2), s.id(6,1), s.id(15,1), '00THs00000BIOM802', 'call', 'CallSwitch One call (inbound)',
  E'CALL SUMMARY (automatic, local AI), 07/11/2026\nReason: Customer asked about micro-shaft concentricity and cleanroom packaging.\nDiscussed: 2 micron concentricity, Class 7 packaging certificates.\nConcerns: Current supplier is about 20% cheaper; supplier change needs quality director approval.\nNext step: Send packaging certificates and a total-cost comparison.\nFollow-up needed: Yes.\n\nMarcus (8007) spoke with Dr. Karen Holt\nCall Duration: 34m 10s\nView details in Yappl',
  'inbound', 'answered', '+442079460231', '2026-11-06 10:00+00', 2050, 'Contact', '003Hs00001KH02', 'Opportunity', '006Hs00001BIOM2', 'BioMedix Surgical Devices', '005Hs000001MV01', s.id(7,4),
  'https://yappl.example/calls/8007-20261106-1000',
  '{"Id":"00THs00000BIOM802","TaskSubtype":"Call","CallType":"Inbound","CallDurationInSeconds":2050,"WhoId":"003Hs00001KH02","WhatId":"006Hs00001BIOM2","OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-11-07 18:50+00'),
 -- 3: call by a second rep
 (s.id(20,3), s.id(6,1), s.id(15,1), '00THs00000VOLT803', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 08/11/2026\nReason: Review of heat sink billet extrusion and CNC milling plan.\nDiscussed: Fixture cost, unit price, delivery plan.\nConcerns: Competing bidder offers free fixtures and tooling.\nNext step: Price per unit by next Friday.\nFollow-up needed: Yes.\n\nElena (8011) called Lukas Brandt\nCall Duration: 28m 45s\nView details in Yappl',
  'outbound', 'answered', '+4989955500123', '2026-11-07 15:30+00', 1725, 'Contact', '003Hs00001LB03', 'Opportunity', '006Hs00001VOLT3', 'VoltDrive Mobility AG', '005Hs000001ER01', s.id(7,5),
  'https://yappl.example/calls/8011-20261107-1530',
  '{"Id":"00THs00000VOLT803","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":1725,"WhoId":"003Hs00001LB03","WhatId":"006Hs00001VOLT3","OwnerId":"005Hs000001ER01","Status":"Completed"}',
  '2026-11-08 18:50+00'),
 -- 4: call to a Salesforce Lead (no deal yet): who is a Lead, nothing in "what"
 (s.id(20,4), s.id(6,1), s.id(15,1), '00THs00000LEAD804', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 04/11/2026\nReason: Cold discovery call with a German auto component supplier.\nDiscussed: Annual volumes, current subcontractors.\nConcerns: None raised.\nNext step: Send capability brochure.\nFollow-up needed: Yes.\n\nMarcus (8007) called Jonas Keller\nCall Duration: 19m 50s',
  'outbound', 'answered', '+4930555500777', '2026-11-03 11:15+00', 1190, 'Lead', '00QHs00001LD01', NULL, NULL, 'Keller Automotive Teile GmbH', '005Hs000001MV01', s.id(7,4),
  'https://yappl.example/calls/8007-20261103-1115',
  '{"Id":"00THs00000LEAD804","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":1190,"WhoId":"00QHs00001LD01","WhatId":null,"OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-11-04 18:50+00'),
 -- 5: inbound call on an Account that has no open deal; the audio has not arrived yet
 (s.id(20,5), s.id(6,1), s.id(15,1), '00THs00000ACCT805', 'call', 'CallSwitch One call (inbound)',
  E'CALL SUMMARY (automatic, local AI), 20/11/2026\nReason: Existing customer asked for a repeat quote on fixture plates.\nDiscussed: Quantities and lead time.\nConcerns: None.\nNext step: Quote by Friday.\nFollow-up needed: Yes.\n\nMarcus (8007) spoke with Olivia Reed\nCall Duration: 7m 00s',
  'inbound', 'answered', '+442079460388', '2026-11-19 16:40+00', 420, 'Contact', '003Hs00001OR05', 'Account', '001Hs00001ACCT9', 'Kestrel Marine Ltd', '005Hs000001MV01', s.id(7,4),
  'https://yappl.example/calls/8007-20261119-1640',
  '{"Id":"00THs00000ACCT805","TaskSubtype":"Call","CallType":"Inbound","CallDurationInSeconds":420,"WhoId":"003Hs00001OR05","WhatId":"001Hs00001ACCT9","OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-11-20 08:00+00'),
 -- 6: Nordic call, used by the analysis that is running
 (s.id(20,6), s.id(6,1), s.id(15,1), '00THs00000NORD806', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 30/10/2026\nReason: Requirements call for subsea sonar transducer housings.\nDiscussed: Material (super duplex), pressure rating, test certificates.\nConcerns: Qualification of a new supplier takes 3 months.\nNext step: Send sample qualification pack.\nFollow-up needed: Yes.\n\nElena (8011) called Ingrid Solberg\nCall Duration: 33m 00s',
  'outbound', 'answered', '+4722555500190', '2026-10-29 13:00+00', 1980, 'Contact', '003Hs00001IS06', 'Opportunity', '006Hs00001NORD4', 'Nordic Marine Defense AS', '005Hs000001ER01', s.id(7,5),
  'https://yappl.example/calls/8011-20261029-1300',
  '{"Id":"00THs00000NORD806","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":1980,"WhoId":"003Hs00001IS06","WhatId":"006Hs00001NORD4","OwnerId":"005Hs000001ER01","Status":"Completed"}',
  '2026-10-30 18:50+00'),
 -- 7: an older call whose recording has since expired
 (s.id(20,7), s.id(6,1), s.id(15,1), '00THs00000GEAR807', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 28/08/2026\nReason: Walk through the revised quote for planetary gearbox housings.\nDiscussed: Price and lead time.\nConcerns: Buyer needs delivery in 6 weeks.\nNext step: None agreed.\nFollow-up needed: No.\n\nMarcus (8007) called Jens Weber\nCall Duration: 25m 00s',
  'outbound', 'answered', '+4971155500456', '2026-08-27 10:15+00', 1500, 'Contact', '003Hs00001JW07', 'Opportunity', '006Hs00001GEAR5', 'Gearwerk Industrial GmbH', '005Hs000001MV01', s.id(7,4),
  'https://yappl.example/calls/8007-20260827-1015',
  '{"Id":"00THs00000GEAR807","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":1500,"WhoId":"003Hs00001JW07","WhatId":"006Hs00001GEAR5","OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-08-28 18:50+00'),
 -- 8: voicemail left, too short to analyse
 (s.id(20,8), s.id(6,1), s.id(15,1), '00THs00000VMAIL08', 'call', 'CallSwitch One call (outbound)',
  NULL, 'outbound', 'voicemail', '+442079460142', '2026-11-18 09:05+00', 45, 'Contact', '003Hs00001WR01', 'Opportunity', '006Hs00001AERO1', 'AeroDynamics UK Ltd', '005Hs000001MV01', s.id(7,4),
  NULL,
  '{"Id":"00THs00000VMAIL08","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":45,"WhoId":"003Hs00001WR01","WhatId":"006Hs00001AERO1","OwnerId":"005Hs000001MV01","Status":"Completed"}',
  '2026-11-18 18:50+00'),
 -- 9: nobody answered, call to a Lead
 (s.id(20,9), s.id(6,1), s.id(15,1), '00THs00000NOANS09', 'call', 'CallSwitch One call (outbound)',
  NULL, 'outbound', 'no_answer', '+4930555500777', '2026-11-19 10:20+00', 0, 'Lead', '00QHs00001LD01', NULL, NULL, 'Keller Automotive Teile GmbH', '005Hs000001TB01', s.id(7,7),
  NULL,
  '{"Id":"00THs00000NOANS09","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":0,"WhoId":"00QHs00001LD01","WhatId":null,"OwnerId":"005Hs000001TB01","Status":"Completed"}',
  '2026-11-19 18:50+00'),
 -- 10: missed inbound call from an unknown number; the Salesforce owner is not a SellMore user, so owner_user_id stays empty
 (s.id(20,10), s.id(6,1), s.id(15,1), '00THs00000MISS010', 'call', 'CallSwitch One call (inbound)',
  NULL, 'inbound', 'missed', '+442079460111', '2026-11-18 15:02+00', 0, NULL, NULL, NULL, NULL, NULL, '005Hs000001XX99', NULL,
  NULL,
  '{"Id":"00THs00000MISS010","TaskSubtype":"Call","CallType":"Inbound","CallDurationInSeconds":0,"WhoId":null,"WhatId":null,"OwnerId":"005Hs000001XX99","Status":"Completed"}',
  '2026-11-18 18:50+00'),
 -- 11: a calendar meeting (a Salesforce Event, not a call)
 (s.id(20,11), s.id(6,1), s.id(15,1), '00UHs00000EVNT011', 'meeting', 'Teams: Technical review, VoltDrive inverter casing',
  NULL, NULL, NULL, NULL, '2026-11-15 15:30+00', 3600, 'Contact', '003Hs00001LB03', 'Opportunity', '006Hs00001VOLT3', 'VoltDrive Mobility AG', '005Hs000001ER01', s.id(7,5),
  NULL,
  '{"Id":"00UHs00000EVNT011","Type":"Meeting","DurationInMinutes":60,"WhoId":"003Hs00001LB03","WhatId":"006Hs00001VOLT3","OwnerId":"005Hs000001ER01"}',
  '2026-11-15 18:50+00'),
 -- 12: today's call: the summary job has not run yet, so there is no description and no recording link
 (s.id(20,12), s.id(6,1), s.id(15,1), '00THs00000TODAY12', 'call', 'CallSwitch One call (outbound)',
  NULL, 'outbound', 'answered', '+442079460388', '2026-11-20 09:05+00', 310, 'Contact', '003Hs00001OR05', 'Account', '001Hs00001ACCT9', 'Kestrel Marine Ltd', '005Hs000001TB01', s.id(7,7),
  NULL,
  '{"Id":"00THs00000TODAY12","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":310,"WhoId":"003Hs00001OR05","WhatId":"001Hs00001ACCT9","OwnerId":"005Hs000001TB01","Status":"Completed"}',
  '2026-11-20 09:30+00'),
 -- 14: an old import with no time, owner or raw payload
 (s.id(20,14), s.id(6,1), s.id(15,1), '00THs00000LEGACY14', 'call', 'Imported call log (no time recorded)',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-02 18:50+00'),
 -- 13: another company (Delta), in German
 (s.id(20,13), s.id(6,4), s.id(15,6), '00THs00000DELT013', 'call', 'CallSwitch One call (outbound)',
  E'CALL SUMMARY (automatic, local AI), 06/11/2026\nReason: Gespräch über Porosität bei Motorblöcken.\nNext step: Prüfplan senden.\nFollow-up needed: Yes.',
  'outbound', 'answered', '+4989955500600', '2026-11-05 09:00+00', 1260, 'Contact', '003De00001HW01', 'Opportunity', '006De00001RHIN1', 'Rhine Automotive GmbH', '005De000001MK01', s.id(7,19),
  'https://yappl.example/calls/8300-20261105-0900',
  '{"Id":"00THs00000DELT013","TaskSubtype":"Call","CallType":"Outbound","CallDurationInSeconds":1260,"WhoId":"003De00001HW01","WhatId":"006De00001RHIN1","OwnerId":"005De000001MK01","Status":"Completed"}',
  '2026-11-06 18:50+00');

-- ===== Table 17: integration_sync_runs. Every trigger and every status. =====
INSERT INTO integration_sync_runs(integration_sync_run_id, client_id, integration_id, trigger_kind, status, started_at, finished_at, items_found, items_imported, items_failed, error) VALUES
 (s.id(17,1),  s.id(6,1), s.id(15,1), 'schedule', 'success', '2026-11-20 08:00+00', '2026-11-20 08:01+00', 42,  3,   0, NULL),
 (s.id(17,2),  s.id(6,1), s.id(15,1), 'webhook',  'success', '2026-11-20 08:20+00', '2026-11-20 08:20+00', 1,   1,   0, NULL),
 (s.id(17,3),  s.id(6,1), s.id(15,1), 'manual',   'partial', '2026-11-19 16:10+00', '2026-11-19 16:12+00', 120, 118, 2, '2 calls skipped: Salesforce owner 005Hs000001XX99 is not a SellMore user'),
 (s.id(17,4),  s.id(6,1), s.id(15,1), 'manual',   'running', '2026-11-20 08:50+00', NULL,                  0,   0,   0, NULL),
 (s.id(17,5),  s.id(6,1), s.id(15,2), 'schedule', 'success', '2026-11-19 18:30+00', '2026-11-19 18:34+00', 6,   6,   0, NULL),
 (s.id(17,6),  s.id(6,1), s.id(15,2), 'schedule', 'failed',  '2026-11-18 18:30+00', '2026-11-18 18:30+00', 0,   0,   0, 'Google Drive API quota exceeded (403 rateLimitExceeded)'),
 (s.id(17,7),  s.id(6,2), s.id(15,3), 'manual',   'success', '2026-11-14 11:02+00', '2026-11-14 11:03+00', 2,   2,   0, NULL),
 (s.id(17,8),  s.id(6,3), s.id(15,4), 'schedule', 'failed',  '2026-11-20 06:45+00', '2026-11-20 06:45+00', 0,   0,   0, 'INVALID_SESSION_ID: the refresh token was revoked'),
 (s.id(17,9),  s.id(6,4), s.id(15,6), 'schedule', 'success', '2026-11-15 06:00+00', '2026-11-15 06:01+00', 9,   1,   0, NULL),
 (s.id(17,10), s.id(6,4), s.id(15,7), 'schedule', 'success', '2026-11-15 00:00+00', '2026-11-15 00:02+00', 1,   1,   0, NULL);

-- ===== Table 18: integration_events (raw change notices, kept so they can be replayed). Processed, waiting and failed. =====
INSERT INTO integration_events(integration_event_id, client_id, integration_id, provider_event_id, event_type, payload, received_at, processed_at, error) VALUES
 (s.id(18,1), s.id(6,1), s.id(15,1), '24391820', 'Task.created',        '{"Id":"00THs00000TODAY12","Subject":"CallSwitch One call (outbound)","OwnerId":"005Hs000001TB01"}',                    '2026-11-20 09:05:40+00', '2026-11-20 09:05:42+00', NULL),
 (s.id(18,2), s.id(6,1), s.id(15,1), '24391844', 'Opportunity.updated', '{"Id":"006Hs00001BIOM2","StageName":"Proposal/Price Quote","Amount":320000}',                                         '2026-11-06 11:30:10+00', '2026-11-06 11:30:11+00', NULL),
 (s.id(18,3), s.id(6,1), s.id(15,1), '24391901', 'Task.updated',        '{"Id":"00THs00000ACCT805","Description":"CALL SUMMARY (automatic, local AI), 20/11/2026 ..."}',                         '2026-11-20 08:45:02+00', NULL,                    NULL),                                             -- waiting
 (s.id(18,4), s.id(6,1), s.id(15,1), '24391977', 'Task.created',        '{"Id":"00THs00000MISS010","Subject":"CallSwitch One call (inbound)","OwnerId":"005Hs000001XX99"}',                      '2026-11-18 15:02:30+00', NULL,                    'Owner 005Hs000001XX99 is not a SellMore user'),    -- failed
 (s.id(18,5), s.id(6,1), s.id(15,2), 'drive-evt-2208841', 'file.created','{"fileId":"1AeroCallAudio0001xYz","name":"call_8007_20261108_1430.mp3","mimeType":"audio/mpeg"}',                  '2026-11-08 18:30:05+00', '2026-11-08 18:30:06+00', NULL);
