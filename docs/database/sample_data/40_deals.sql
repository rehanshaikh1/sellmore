-- ===== Table 21: leads (deals). All six stages, three currencies, Salesforce deals and ones typed in by a rep, one soft-deleted. =====
-- last_meeting_at is kept up to date by a trigger when meetings are added, so it is not set here.
SELECT s.act_as_owner();
INSERT INTO leads(lead_id, client_user_id, name, company_name, stage, source, crm_system, crm_id, raw_stage, owner_crm_id, crm_account_id,
                  amount, currency, close_date, next_meeting_at, stage_changed_at, crm_last_synced_at, created_by, updated_by, deleted_at, deleted_by) VALUES
 (s.id(21,1),  s.id(7,4),  'AeroDynamics: Titanium Aerospace Tooling',            'AeroDynamics UK Ltd',        'Technical Review',    'crm',   'salesforce', '006Hs00001AERO1', 'Technical Validation', '005Hs000001MV01', '001Hs00001AERO0',
  185000.00, 'USD', '2026-12-15', '2026-11-24 14:00+00', '2026-10-29 10:00+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 (s.id(21,2),  s.id(7,4),  'BioMedix: Precision Medical Robotic Components',      'BioMedix Surgical Devices',  'Commercial Proposal', 'crm',   'salesforce', '006Hs00001BIOM2', 'Proposal/Price Quote', '005Hs000001MV01', '001Hs00001BIOM0',
  320000.00, 'USD', '2027-01-20', '2026-11-25 11:00+00', '2026-11-06 11:30+00', '2026-11-20 08:00+00', NULL,      s.id(7,4), NULL, NULL),
 (s.id(21,3),  s.id(7,5),  'VoltDrive: EV Powertrain Inverter Casing',            'VoltDrive Mobility AG',      'Negotiation',         'crm',   'salesforce', '006Hs00001VOLT3', 'Negotiation/Review',  '005Hs000001ER01', '001Hs00001VOLT0',
  540000.00, 'EUR', '2026-11-30', '2026-11-27 15:30+00', '2026-11-07 15:45+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 (s.id(21,4),  s.id(7,5),  'Nordic Defense: Subsea Sonar Transducer Housings',    'Nordic Marine Defense AS',   'Discovery',           'crm',   'salesforce', '006Hs00001NORD4', 'Prospecting',         '005Hs000001ER01', '001Hs00001NORD0',
  140000.00, 'GBP', '2027-02-15', NULL,                  '2026-10-20 09:00+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 (s.id(21,5),  s.id(7,5),  'SatOrbit: Thruster Nozzle Inconel Machining',         'SatOrbit Propulsion Ltd',    'Closed Won',          'crm',   'salesforce', '006Hs00001SATO5', 'Closed Won',          '005Hs000001ER01', '001Hs00001SATO0',
  265000.00, 'USD', '2026-10-09', NULL,                  '2026-10-09 16:00+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 (s.id(21,6),  s.id(7,4),  'HydroMarine: Bronze Impeller 5-Axis Turning',         'HydroMarine Pumps Ltd',      'Discovery',           'crm',   'salesforce', '006Hs00001HYDR6', 'Prospecting',         '005Hs000001MV01', '001Hs00001HYDR0',
  95000.00,  'GBP', '2027-03-31', '2026-11-26 10:00+00', '2026-11-10 14:30+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 (s.id(21,7),  s.id(7,4),  'Gearwerk: Planetary Gearbox Housings',                'Gearwerk Industrial GmbH',   'Closed Lost',         'crm',   'salesforce', '006Hs00001GEAR5', 'Closed Lost',         '005Hs000001MV01', '001Hs00001GEAR0',
  210000.00, 'EUR', '2026-10-22', NULL,                  '2026-10-22 12:00+00', '2026-11-20 08:00+00', NULL,      NULL,      NULL, NULL),
 -- typed in by a rep, so there are no Salesforce fields
 (s.id(21,8),  s.id(7,7),  'Precision Optics: Lens Mount Prototype',              'Precision Optics Ltd',       'Discovery',           'draft', NULL, NULL, NULL, NULL, NULL,
  NULL, 'USD', NULL, NULL, '2026-11-18 09:15+00', NULL,                  s.id(7,7), s.id(7,7), NULL, NULL),
 (s.id(21,9),  s.id(7,12), 'Kestrel Marine: Bracket Batch',                       'Kestrel Marine Ltd',         'Technical Review',    'draft', NULL, NULL, NULL, NULL, NULL,
  18500.00, 'USD', '2026-12-10', NULL,                  '2026-11-12 13:20+00', NULL,                  s.id(7,12), NULL,     NULL, NULL),
 (s.id(21,10), s.id(7,19), 'Rhine Auto: Engine Block Castings',                   'Rhine Automotive GmbH',      'Negotiation',         'crm',   'salesforce', '006De00001RHIN1', 'Negotiation/Review',  '005De000001MK01', '001De00001RHIN0',
  910000.00, 'EUR', '2026-12-18', NULL,                  '2026-11-05 10:30+00', '2026-11-15 06:01+00', NULL,      NULL,      NULL, NULL),
 -- a draft the rep deleted again
 (s.id(21,11), s.id(7,4),  'AeroDynamics (duplicate, typed by mistake)',          'AeroDynamics UK Ltd',        'Discovery',           'draft', NULL, NULL, NULL, NULL, NULL,
  NULL, 'USD', NULL, NULL, '2026-11-09 08:50+00', NULL,                  s.id(7,4), NULL,      '2026-11-10 09:00+00', s.id(7,4));
