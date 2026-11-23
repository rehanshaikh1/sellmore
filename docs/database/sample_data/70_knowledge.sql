-- ===== Table 34: knowledge_sources: all 6 types, all 3 statuses, switched off for the AI, one deleted, and the same content in two companies =====
SELECT s.act_as_owner();
INSERT INTO knowledge_sources(knowledge_source_id, client_id, created_by, name, type, size_or_url, storage_key, status, assessment_tag, tags, raw_text, content_hash, available_to_ai, updated_by, deleted_at, deleted_by) VALUES
 (s.id(34,1),  s.id(6,1), s.id(7,1), 'Apex_5Axis_CNC_Machining_Capabilities_2026.pdf', 'PDF', '4.8 MB', 'clients/apex-precision/knowledge/apex_5axis_cnc_capabilities_2026.pdf', 'indexed', 'Product Knowledge QA', ARRAY['capabilities','5-axis','cnc'],
  'Apex Precision Engineering operates dual-spindle 5-axis machining cells for titanium, Inconel and aluminium. Typical tolerance is +/-0.005 mm with in-process laser tool probing and CMM inspection of every lot. Standard lead time is 8 weeks; priority shifts can deliver first articles in 3 weeks.', s.sha('ks-1'), true, NULL, NULL, NULL),
 (s.id(34,2),  s.id(6,1), s.id(7,1), 'AS9100D_and_ISO13485_Quality_Manual_Excerpts.pdf', 'PDF', '12.1 MB', 'clients/apex-precision/knowledge/quality_manual_excerpts.pdf', 'indexed', 'Technical Feasibility QA', ARRAY['quality','as9100d','iso-13485'],
  'Apex holds AS9100D and ISO 13485 certification. Audits are carried out annually by an accredited body. Every lot ships with mill test certificates and a full CMM dimensional report.', s.sha('ks-2'), true, NULL, NULL, NULL),
 (s.id(34,3),  s.id(6,1), s.id(7,2), 'Aerospace_Titanium_Milling_Feasibility_Study.docx', 'DOCX', '1.4 MB', 'clients/apex-precision/knowledge/titanium_milling_feasibility.docx', 'indexed', 'Technical Feasibility QA', ARRAY['titanium','feasibility'],
  'Ti-6Al-4V work hardens quickly under tool deflection. High-pressure through-spindle coolant and variable-pitch endmills keep the cut stable.', s.sha('ks-3'), true, NULL, NULL, NULL),
 (s.id(34,4),  s.id(6,1), s.id(7,1), 'https://apexengineering.example/services/five-axis-milling', 'Website', 'https://apexengineering.example/services/five-axis-milling', NULL, 'indexed', 'Commercial Awareness QA', ARRAY['website','services'],
  'Five-axis milling services page: capabilities, materials and typical industries.', s.sha('ks-4'), false, NULL, NULL, NULL),                                              -- indexed but switched off for the AI
 (s.id(34,5),  s.id(6,1), s.id(7,1), 'Standard_Commercial_Terms_and_Tooling_Policy.txt', 'TXT', '45 KB', 'clients/apex-precision/knowledge/commercial_terms.txt', 'indexed', 'Commercial Awareness QA', ARRAY['pricing','tooling','terms'],
  'Tooling surcharges are quoted per programme and can be amortised over the first 100 production units if the purchase order is signed within 10 business days.', s.sha('ks-5'), true, NULL, NULL, NULL),
 (s.id(34,6),  s.id(6,1), s.id(7,2), 'Apex 5-axis cell walkthrough (video)', 'YouTube', 'https://www.youtube.com/watch?v=aBcD1234xyZ', NULL, 'processing', NULL, ARRAY[]::text[],
  NULL, NULL, true, NULL, NULL, NULL),                                                                                                                                         -- still being indexed
 (s.id(34,7),  s.id(6,1), s.id(7,2), 'Tooling surcharge: standard answer', 'Manual QA', NULL, NULL, 'indexed', 'Commercial Awareness QA', ARRAY['pricing','tooling'],
  'Q: Why is there a tooling surcharge? A: Custom radius endmills are needed for internal fillets. We amortise the cost over the first 100 units if the purchase order is signed within 10 business days.', s.sha('ks-7'), true, s.id(7,2), NULL, NULL),
 (s.id(34,8),  s.id(6,1), s.id(7,1), 'Scanned_Brochure_2019.pdf', 'PDF', '22.7 MB', 'clients/apex-precision/knowledge/scanned_brochure_2019.pdf', 'failed', NULL, ARRAY[]::text[],
  NULL, s.sha('ks-8'), false, NULL, NULL, NULL),                                                                                                                                -- text could not be extracted
 (s.id(34,9),  s.id(6,1), s.id(7,1), 'Old_Price_List_2024.pdf', 'PDF', '0.9 MB', 'clients/apex-precision/knowledge/old_price_list_2024.pdf', 'indexed', 'Commercial Awareness QA', ARRAY['pricing','outdated'],
  'Price list valid until 31 December 2024.', s.sha('ks-9'), true, s.id(7,1), '2026-10-05 09:00+00', s.id(7,1)),
 (s.id(34,10), s.id(6,2), s.id(7,10), 'Machining_Capabilities_Overview.pdf', 'PDF', '4.8 MB', 'clients/beta-sheet-metal/knowledge/capabilities_overview.pdf', 'indexed', 'Product Knowledge QA', ARRAY['capabilities'],
  'Beta Sheet Metal Works cuts, bends and welds mild steel and aluminium brackets.', s.sha('ks-1'), true, NULL, NULL, NULL);                                                   -- same file content as source 1: allowed in another company

-- ===== Table 35: company_documents: tagged to the cue they support, with a whole-document vector once processed =====
INSERT INTO company_documents(company_document_id, client_id, uploaded_by, name, size_bytes, mime_type, storage_key, checksum_sha256, tagged_cue_id, tags, raw_text, embeddings, embedding_model, embedded_at, considered, status, uploaded_at, updated_by, deleted_at, deleted_by) VALUES
 (s.id(35,1), s.id(6,1), s.id(7,1), 'Apex_Manufacturing_Handbook_v3.pdf', 8808038, 'application/pdf', 'clients/apex-precision/documents/manufacturing_handbook_v3.pdf', s.sha('doc-1'), s.id(33,13), ARRAY['handbook','manufacturing'],
  'Apex Manufacturing Handbook v3. Machine capacity: four Hermle C42 5-axis cells and two Swiss-type lathes. Materials: Ti-6Al-4V, Inconel 718, 316L stainless steel, 7075 aluminium.', s.vec(101), 'embed-3-large-1536', '2026-09-15 10:30+00', true, 'ready', '2026-09-15 10:00+00', NULL, NULL, NULL),
 (s.id(35,2), s.id(6,1), s.id(7,1), 'Pricing_and_Surcharge_Policy_2026.pdf', 1258291, 'application/pdf', 'clients/apex-precision/documents/pricing_surcharge_policy_2026.pdf', s.sha('doc-2'), s.id(33,8), ARRAY['pricing','surcharge'],
  'Pricing policy: setup fees are waived for orders above 100 units. Surcharges apply to custom tooling and expedited shifts.', s.vec(102), 'embed-3-large-1536', '2026-10-04 11:10+00', true, 'ready', '2026-10-04 10:45+00', NULL, NULL, NULL),
 (s.id(35,3), s.id(6,1), s.id(7,1), 'Cleanroom_ISO_Class7_SOP.docx', 2936012, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'clients/apex-precision/documents/cleanroom_iso_class7_sop.docx', s.sha('doc-3'), s.id(33,14), ARRAY['cleanroom','sop'],
  'Cleanroom ISO Class 7 SOP: gowning, packaging and verification steps for medical lots.', s.vec(103), 'embed-3-large-1536', '2026-10-22 09:40+00', true, 'ready', '2026-10-22 09:15+00', s.id(7,1), NULL, NULL),
 -- just uploaded: still processing, so no text, no vector and not used in scoring yet
 (s.id(35,4), s.id(6,1), s.id(7,2), 'New_Quality_Procedure_Draft.docx', NULL, NULL, 'clients/apex-precision/documents/new_quality_procedure_draft.docx', NULL, NULL, ARRAY[]::text[],
  NULL, NULL, NULL, NULL, false, 'processing', '2026-11-19 16:10+00', NULL, NULL, NULL),
 (s.id(35,5), s.id(6,1), s.id(7,1), 'Old_Terms_2023.pdf', 301056, 'application/pdf', 'clients/apex-precision/documents/old_terms_2023.pdf', s.sha('doc-5'), NULL, ARRAY['outdated'],
  'Terms of trade valid until 2023.', NULL, NULL, NULL, false, 'ready', '2026-02-01 09:00+00', s.id(7,1), '2026-10-05 09:05+00', s.id(7,1)),
 (s.id(35,6), s.id(6,2), s.id(7,10), 'Beta_Capabilities.pdf', 905216, 'application/pdf', 'clients/beta-sheet-metal/documents/beta_capabilities.pdf', s.sha('doc-6'), s.id(33,17), ARRAY['capabilities'],
  'Beta capabilities: laser cutting up to 12 mm steel, press brake bending to 4 m, MIG and TIG welding.', s.vec(106), 'embed-3-large-1536', '2026-10-12 09:30+00', true, 'ready', '2026-10-12 09:10+00', NULL, NULL, NULL);

-- ===== Table 36: knowledge_chunks: the searchable pieces. Each belongs to a source or to a document, never both. =====
INSERT INTO knowledge_chunks(knowledge_chunk_id, client_id, source_id, document_id, seq, content, token_count, embeddings, embedding_model, embedded_at) VALUES
 (s.id(36,1),  s.id(6,1), s.id(34,1),  NULL,        1, 'Apex Precision Engineering operates dual-spindle 5-axis machining cells for titanium, Inconel and aluminium.', 21, s.vec(301), 'embed-3-large-1536', '2026-09-12 10:05+00'),
 (s.id(36,2),  s.id(6,1), s.id(34,1),  NULL,        2, 'Typical tolerance is +/-0.005 mm with in-process laser tool probing and CMM inspection of every lot.', 24, s.vec(302), 'embed-3-large-1536', '2026-09-12 10:05+00'),
 (s.id(36,3),  s.id(6,1), s.id(34,1),  NULL,        3, 'Standard lead time is 8 weeks; priority shifts can deliver first articles in 3 weeks.', 19, NULL, NULL, NULL),                       -- not embedded yet
 (s.id(36,4),  s.id(6,1), s.id(34,2),  NULL,        1, 'Apex holds AS9100D and ISO 13485 certification. Audits are carried out annually by an accredited body.', 22, s.vec(304), 'embed-3-large-1536', '2026-10-01 09:20+00'),
 (s.id(36,5),  s.id(6,1), s.id(34,2),  NULL,        2, 'Every lot ships with mill test certificates and a full CMM dimensional report.', 16, s.vec(305), 'embed-3-large-1536', '2026-10-01 09:20+00'),
 (s.id(36,6),  s.id(6,1), s.id(34,5),  NULL,        1, 'Tooling surcharges are quoted per programme and can be amortised over the first 100 production units.', 19, s.vec(306), 'embed-3-large-1536', '2026-11-01 08:30+00'),
 (s.id(36,7),  s.id(6,1), s.id(34,7),  NULL,        1, 'Q: Why is there a tooling surcharge? A: Custom radius endmills are needed for internal fillets.', 20, s.vec(307), 'embed-3-large-1536', '2026-11-02 09:00+00'),
 (s.id(36,8),  s.id(6,1), NULL,        s.id(35,1),  1, 'Machine capacity: four Hermle C42 5-axis cells and two Swiss-type lathes.', 16, s.vec(308), 'embed-3-large-1536', '2026-09-15 10:30+00'),
 (s.id(36,9),  s.id(6,1), NULL,        s.id(35,1),  2, 'Materials: Ti-6Al-4V, Inconel 718, 316L stainless steel, 7075 aluminium.', 18, s.vec(309), 'embed-3-large-1536', '2026-09-15 10:30+00'),
 (s.id(36,10), s.id(6,1), NULL,        s.id(35,2),  1, 'Pricing policy: setup fees are waived for orders above 100 units.', 14, s.vec(310), 'embed-3-large-1536', '2026-10-04 11:10+00'),
 (s.id(36,11), s.id(6,1), NULL,        s.id(35,2),  2, 'Surcharges apply to custom tooling and expedited shifts.', NULL, NULL, NULL, NULL),
 (s.id(36,12), s.id(6,2), s.id(34,10), NULL,        1, 'Beta Sheet Metal Works cuts, bends and welds mild steel and aluminium brackets.', 15, s.vec(312), 'embed-3-large-1536', '2026-10-12 09:30+00');

-- ===== Table 37: knowledge_citations: every place the AI used a source =====
INSERT INTO knowledge_citations(knowledge_citation_id, source_id, user_id, meeting_id, used_by, cited_at) VALUES
 (s.id(37,1), s.id(34,1),  s.id(7,4),  NULL,        'ask_ai',      '2026-11-09 08:40+00'),
 (s.id(37,2), s.id(34,2),  s.id(7,5),  NULL,        'ai_chat',     '2026-11-09 10:15+00'),
 (s.id(37,3), s.id(34,5),  s.id(7,4),  s.id(26,1),  'live_assist', '2026-11-08 14:35+00'),
 (s.id(37,4), s.id(34,1),  s.id(7,4),  NULL,        'mock',        '2026-11-09 15:30+00'),
 (s.id(37,5), s.id(34,7),  s.id(7,5),  NULL,        'practice',    '2026-11-10 11:00+00'),
 (s.id(37,6), s.id(34,3),  NULL,       s.id(26,1),  'ask_ai',      '2026-11-08 19:00+00'),      -- used by the analysis itself, not a person
 (s.id(37,7), s.id(34,1),  s.id(7,4),  s.id(26,2),  'ai_chat',     '2026-11-06 19:10+00'),
 (s.id(37,8), s.id(34,10), s.id(7,12), NULL,        'ask_ai',      '2026-11-12 14:00+00');
