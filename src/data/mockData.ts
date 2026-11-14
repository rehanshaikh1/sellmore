import { 
  User, 
  TeamMember, 
  SalesCue, 
  MeetingRecord, 
  DealRecord, 
  DealCoachingProgram, 
  AutomationWorkflow, 
  KnowledgeSource, 
  PracticeLessonCatalog, 
  MockMeetingHistoryItem, 
  CreditTransaction, 
  InvoiceItem, 
  CompanyDocument 
} from '../types';
import { withMockAnalysis } from './mockAnalysis';

export const INITIAL_USERS: Record<string, User> = {
  client_admin: {
    id: 'usr_admin_1',
    name: 'Sarah Lin',
    email: 'sarah.lin@apexengineering.com',
    role: 'client_admin',
    companyName: 'Apex Precision Engineering Ltd',
    title: 'VP of Commercial Operations',
    avatar: 'SL'
  },
  manager: {
    id: 'usr_mgr_1',
    name: 'David Miller',
    email: 'david.miller@apexengineering.com',
    role: 'manager',
    companyName: 'Apex Precision Engineering Ltd',
    title: 'Regional Sales Director',
    avatar: 'DM'
  },
  sales_rep: {
    id: 'usr_rep_1',
    name: 'Marcus Vance',
    email: 'marcus.vance@apexengineering.com',
    role: 'sales_rep',
    companyName: 'Apex Precision Engineering Ltd',
    title: 'Senior Technical Account Executive',
    avatar: 'MV'
  },
  super_admin: {
    id: 'usr_super_1',
    name: 'Alexander Chen',
    email: 'operator@sellmore.io',
    role: 'super_admin',
    companyName: 'SellMore Global Platform',
    title: 'Platform Infrastructure Lead',
    avatar: 'AC'
  }
};

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr_mgr_1',
    name: 'David Miller',
    email: 'david.miller@apexengineering.com',
    role: 'manager',
    status: 'active',
    invitationStatus: 'accepted',
    dateJoined: '2026-01-15',
    dealsCount: 8,
    meetingsCount: 22
  },
  {
    id: 'usr_mgr_2',
    name: 'Priya Nair',
    email: 'priya.nair@apexengineering.com',
    role: 'manager',
    status: 'active',
    invitationStatus: 'accepted',
    dateJoined: '2026-02-20',
    dealsCount: 0,
    meetingsCount: 0
  },
  {
    id: 'usr_rep_1',
    name: 'Marcus Vance',
    email: 'marcus.vance@apexengineering.com',
    role: 'sales_rep',
    status: 'active',
    invitationStatus: 'accepted',
    dateJoined: '2026-02-01',
    managerId: 'usr_mgr_1',
    dealsCount: 5,
    meetingsCount: 14
  },
  {
    id: 'usr_rep_2',
    name: 'Elena Rostova',
    email: 'elena.rostova@apexengineering.com',
    role: 'sales_rep',
    status: 'active',
    invitationStatus: 'accepted',
    dateJoined: '2026-03-10',
    managerId: 'usr_mgr_1',
    dealsCount: 3,
    meetingsCount: 8
  },
  {
    id: 'usr_rep_3',
    name: 'Julian Hayes',
    email: 'julian.hayes@apexengineering.com',
    role: 'sales_rep',
    status: 'inactive',
    invitationStatus: 'accepted',
    dateJoined: '2026-04-05',
    managerId: 'usr_mgr_1',
    dealsCount: 0,
    meetingsCount: 2
  },
  {
    id: 'usr_invite_1',
    name: 'Chloe Bennett',
    email: 'chloe.bennett@apexengineering.com',
    role: 'sales_rep',
    status: 'inactive',
    invitationStatus: 'pending',
    dateJoined: '2026-11-09',
        dealsCount: 0,
    meetingsCount: 0
  }
];

export { SALES_CUES_FRAMEWORK } from './cueFramework';

export const SAMPLE_CUES_MET1: SalesCue[] = [
  {
    id: 1,
    name: 'Introduction & Rapport',
    evaluationFocus: 'Did salesperson introduce themselves, establish credibility and build rapport?',
    score: 4,
    percentage: 80,
    observation: 'Marcus established immediate rapport referencing recent AS9100D audit milestones and shared past project contexts smoothly.',
    improvement: 'Could have framed the agenda earlier before diving into client engineering updates.',
    evidence: '"Good morning Thomas, thank you for joining. Before we review the 5-axis tolerances for the bracket housing, I wanted to share our recent ISO audit results..."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 2,
    name: 'Requirement Discovery',
    evaluationFocus: 'Did they identify engineering requirements, project scope, constraints and expectations?',
    score: 5,
    percentage: 100,
    observation: 'Thorough inspection of thermal dissipation requirements and strict ±0.005mm geometric dimensioning.',
    improvement: 'Excellent discovery depth; keep probing into secondary assembly surface treatments.',
    evidence: '"Could you clarify whether the anodizing layer is factored into the 15-micron inner diameter bore tolerance or applied post-reaming?"',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 3,
    name: 'Questioning Skills',
    evaluationFocus: 'Did they ask relevant open-ended and probing questions to uncover needs, priorities and decision criteria?',
    score: 4,
    percentage: 80,
    observation: 'Good balance of technical and procurement timeline inquiry. Uncovered that flight testing starts in Q3.',
    improvement: 'Ask more about who else on the airframe certification committee needs sign-off.',
    evidence: '"What happens if the batch 1 test specimens arrive in 4 weeks rather than 6 weeks? How does that alter your wind-tunnel test window?"',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 4,
    name: 'Active Listening',
    evaluationFocus: 'Did they listen carefully, acknowledge concerns and avoid unnecessary interruptions or assumptions?',
    score: 4,
    percentage: 80,
    observation: 'Allowed lead engineer to finish explaining the thermal stress failure with competitor parts without interrupting.',
    improvement: 'Summarize the engineer’s words verbatim before introducing the titanium milling capability.',
    evidence: '"I hear your concern loud and clear regarding harmonic vibration during rapid spindle passes. Let me address that specifically..."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 5,
    name: 'Technical Understanding',
    evaluationFocus: 'Did they demonstrate relevant understanding of engineering, CNC machining, fabrication, materials and manufacturing feasibility?',
    score: 5,
    percentage: 100,
    observation: 'Flawless grasp of Ti-6Al-4V Grade 5 work hardening, coolant strategy, and 5-axis DMG MORI cycle optimization.',
    improvement: 'None needed. The client praised the technical depth.',
    evidence: '"Because Ti-6Al-4V work hardens rapidly under tool deflection, we utilize high-pressure through-spindle coolant at 70 bar with variable-pitch endmills..."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 6,
    name: 'Solution Presentation',
    evaluationFocus: 'Did they recommend relevant services and explain how the solution addresses requirements?',
    score: 4,
    percentage: 80,
    observation: 'Presented the dual-spindle machining cell and automated CMM inspection routines tailored to the drawing specs.',
    improvement: 'Include a direct comparison of turnaround lead times vs standard subcontract milling.',
    evidence: '"We will assign this run to our dedicated Hermle C42 machining center paired with in-process Renishaw laser tool probing."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 7,
    name: 'Value Proposition',
    evaluationFocus: 'Did they communicate differentiators such as capabilities, quality, cost efficiency and delivery benefits?',
    score: 3,
    percentage: 60,
    observation: 'Emphasized technical quality, but did not quantify scrap reduction or long-term unit cost amortisation.',
    improvement: 'Explicitly quantify that 99.8% first-pass yield saves the customer an estimated $42,000 in raw titanium billets.',
    evidence: '"Our in-house CMM eliminates third-party lab inspection latency."',
    severity: 'warning',
    isAssessable: true
  },
  {
    id: 8,
    name: 'Commercial Awareness',
    evaluationFocus: 'Did they explore/address budget, pricing, production volumes, timelines and purchasing requirements?',
    score: 2,
    percentage: 40,
    observation: 'Left the discussion of volume discounting until the very end and did not ask about payment terms approval flow.',
    improvement: 'Anchor price early: ask for target per-unit cost before committing to prototype setup fee waivers.',
    evidence: '"We can look at the formal numbers once we receive your native STEP files next week."',
    severity: 'critical',
    isAssessable: true
  },
  {
    id: 9,
    name: 'Objection Handling',
    evaluationFocus: 'Did they respond effectively to pricing, quality, delivery, technical feasibility or supplier reliability concerns?',
    score: 3,
    percentage: 60,
    observation: 'Handled the lead time objection adequately by proposing split shipment, but stumbled on tool wear surcharge concerns.',
    improvement: 'Reframe tooling charges as an all-inclusive fixed manufacturing cost rather than a variable client risk.',
    evidence: '"I understand 8 weeks is tight for your airframe integration; what if we deliver 10 first articles in 3 weeks and the remaining 90 units in week 7?"',
    severity: 'warning',
    isAssessable: true
  },
  {
    id: 10,
    name: 'Trust & Confidence',
    evaluationFocus: 'Did they communicate professionally, provide credible information and build confidence without unsupported claims?',
    score: 5,
    percentage: 100,
    observation: 'Demonstrated deep credibility, provided batch metallurgical test certificates from prior aerospace runs.',
    improvement: 'Maintain this high level of factual integrity.',
    evidence: '"We will provide full mill test certificates and 100% CMM dimensional inspection logs with every lot."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 11,
    name: 'Closing & Next Steps',
    evaluationFocus: 'Did they move toward a clear next action such as RFQ, drawing submission, quotation, technical review or order?',
    score: 4,
    percentage: 80,
    observation: 'Agreed on receiving native CAD models by Friday with a follow-up commercial review on Tuesday.',
    improvement: 'Send calendar invite while still on the call.',
    evidence: '"Let us lock in Tuesday at 2 PM GMT for the formal engineering drawing sign-off and pricing review."',
    severity: 'positive',
    isAssessable: true
  },
  {
    id: 12,
    name: 'Follow-up Commitment',
    evaluationFocus: 'Did they agree clear responsibilities, deliverables and follow-up timelines?',
    score: 4,
    percentage: 80,
    observation: 'Clearly enumerated that Apex will prepare tooling feasibility notes and client will release STEP files.',
    improvement: 'State exact delivery time of the summary email (e.g. by 5:00 PM today).',
    evidence: '"I will send the non-disclosure execution pack and our tooling study by end of day today."',
    severity: 'positive',
    isAssessable: true
  }
];

export const INITIAL_MEETINGS: MeetingRecord[] = [
  {
    id: 'met_1',
    name: 'AeroDynamics UK — Titanium Bracket Technical Feasibility & Drawing Review',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    uploadDate: '2026-11-08 14:30',
    duration: '42m 18s',
    processingStatus: 'Analysed',
    associatedDealId: 'deal_1',
    associatedDealName: 'AeroDynamics — Titanium Aerospace Tooling',
    overallScorePercent: 78,
    fileFormat: 'MP4',
    fileSize: '412 MB',
    summary: 'High-conviction technical alignment meeting with Dr. Thomas Wright (Chief Airframe Engineer) and Sarah Jenkins (Senior Procurement Lead). Verified tight GD&T tolerances (±0.005mm) on 5-axis titanium bracket. Main friction is initial tooling setup fee and 8-week production turnaround.',
    whatWentWell: [
      'Showcased exceptional technical understanding of Ti-6Al-4V thermal dissipation and milling behavior.',
      'Uncovered client Q3 flight testing milestone which gives high urgency to prototype batch.',
      'Secured firm agreement for native STEP file handover and follow-up commercial review.'
    ],
    whereRepStruggled: [
      'Delayed commercial pricing discussions until the closing minutes of the call.',
      'Did not quantify dollar savings from Apex 99.8% first-pass scrap avoidance.',
      'Stumbled slightly when procurement challenged custom carbide endmill charges.'
    ],
    whatCouldBeBetter: [
      'Introduce the commercial envelope during requirement discovery so budget is established before engineering concessions.',
      'Prepare a 1-page amortized tooling cost table for aerospace procurement officers.'
    ],
    recommendedNextSteps: [
      'Email NDA and tooling feasibility study by 5:00 PM GMT.',
      'Calendar Tuesday 2:00 PM meeting for formal drawing sign-off and commercial proposal.',
      'Sync agreed milestone dates with Salesforce Opportunity deal milestones.'
    ],
    cues: SAMPLE_CUES_MET1,
    objections: [
      {
        id: 'obj_1',
        timestamp: '18:42',
        objection: 'Our flight integration deadline requires first articles in 4 weeks, but standard Apex lead time is 8 weeks.',
        repResponse: 'Offered split shipment: deliver 10 first articles in 3 weeks via priority overtime shift, with remaining 90 units in week 7.',
        status: 'Resolved',
        strongerResponseSuggestion: 'Confirm exact shipping courier tracking and reserve weekend machine slot explicitly in writing.'
      },
      {
        id: 'obj_2',
        timestamp: '29:15',
        objection: 'The $8,500 dedicated tooling surcharge was not in our preliminary prototyping budget estimate.',
        repResponse: 'Explained that custom radius endmills are necessary for internal cavity fillets without chatter.',
        status: 'Partially Resolved',
        strongerResponseSuggestion: 'Offer to amortize the $8,500 tooling fee across the first 100 production units if signed within 10 business days.'
      }
    ],
    transcript: [
      {
        id: 'tr_1',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '00:15',
        text: 'Good morning Thomas, Sarah. Thank you for making the time. Before we review the 5-axis tolerances for the bracket housing, I wanted to share our recent ISO 9001 and AS9100D audit results from last month.'
      },
      {
        id: 'tr_2',
        speaker: 'Dr. Thomas Wright',
        role: 'prospect',
        timestamp: '01:02',
        text: 'Morning Marcus. Good to hear about the certification. As you know, our primary headache right now is structural harmonic resonance on the wing pylon mount. Our previous subcontractor had significant bore ovality.'
      },
      {
        id: 'tr_3',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '02:45',
        text: 'Could you clarify whether the anodizing layer is factored into the 15-micron inner diameter bore tolerance, or if that is applied post-reaming in your specification?'
      },
      {
        id: 'tr_4',
        speaker: 'Dr. Thomas Wright',
        role: 'prospect',
        timestamp: '03:30',
        text: 'That is post-anodize. So the green-machined bore must be held to within 8 microns. That is why the other machine shop failed.'
      },
      {
        id: 'tr_5',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '04:12',
        text: 'Understood. Because Ti-6Al-4V work hardens rapidly under tool deflection, we utilize high-pressure through-spindle coolant at 70 bar with variable-pitch solid carbide endmills on our Hermle C42.'
      },
      {
        id: 'tr_6',
        speaker: 'Sarah Jenkins',
        role: 'prospect',
        timestamp: '18:35',
        text: 'That sounds impressive technically Marcus, but our flight test integration window opens in exactly 5 weeks. 8 weeks delivery will ground the prototype.'
      },
      {
        id: 'tr_7',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '18:50',
        text: 'I understand 8 weeks is tight for your airframe integration. What if we deliver 10 first articles in 3 weeks using an expedited weekend cell, and the remaining 90 units in week 7?'
      },
      {
        id: 'tr_8',
        speaker: 'Sarah Jenkins',
        role: 'prospect',
        timestamp: '19:22',
        text: 'If you can guarantee 10 units in 3 weeks, that keeps our airframe team on schedule. We can live with that split.'
      },
      {
        id: 'tr_9',
        speaker: 'Sarah Jenkins',
        role: 'prospect',
        timestamp: '29:05',
        text: 'What about the $8,500 dedicated tooling surcharge? Our prototyping envelope is capped at $50k total.'
      },
      {
        id: 'tr_10',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '29:20',
        text: 'The specialized tools are custom radius ground specifically for your pocket geometry to prevent stress concentrations. Let us explore how we can balance that in the unit pricing.'
      },
      {
        id: 'tr_11',
        speaker: 'Marcus Vance',
        role: 'rep',
        timestamp: '41:10',
        text: 'Let us lock in Tuesday at 2 PM GMT for the formal engineering drawing sign-off and pricing review. I will send the non-disclosure execution pack and tooling study by end of day today.'
      }
    ]
  },
  {
    id: 'met_2',
    name: 'BioMedix Instruments — Surgical Endoscope Micro-Shaft Assembly',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    uploadDate: '2026-11-06 10:15',
    duration: '34m 10s',
    processingStatus: 'Analysed',
    associatedDealId: 'deal_2',
    associatedDealName: 'BioMedix — Precision Medical Robotic Components',
    overallScorePercent: 86,
    fileFormat: 'MP3',
    fileSize: '68 MB',
    summary: 'Discovery meeting with VP of Hardware Engineering. Discussed Swiss-type turning tolerances for 316L medical stainless steel parts. Strong customer interest in cleanroom packaging capabilities.',
    whatWentWell: [
      'Positioned Apex Class 7 cleanroom packaging as a major time saver for FDA audit prep.',
      'Demonstrated high mastery of Swiss CNC micro-milling.'
    ],
    whereRepStruggled: [
      'Did not pin down target production ramp date.'
    ],
    whatCouldBeBetter: [
      'Prepare ISO 13485 compliance summary sheet in advance.'
    ],
    recommendedNextSteps: [
      'Send sample micro-machined pins from our medical sample kit.'
    ],
    cues: SAMPLE_CUES_MET1.map(c => ({ ...c, score: Math.min(5, c.score + (c.id % 2 === 0 ? 1 : 0)) })),
    objections: [],
    transcript: []
  },
  {
    id: 'met_3',
    name: 'VoltDrive EV — Inverter Heat Sink Billet Extrusion & CNC Milling',
    representativeId: 'usr_rep_2',
    representativeName: 'Elena Rostova',
    uploadDate: '2026-11-07 16:00',
    duration: '28m 45s',
    processingStatus: 'Analysed',
    associatedDealId: 'deal_3',
    associatedDealName: 'VoltDrive — EV Powertrain Inverter Casing',
    overallScorePercent: 71,
    fileFormat: 'MP4',
    fileSize: '310 MB',
    summary: 'Commercial proposal review for aluminum 6061 heat sink enclosures. Client worried about raw material price fluctuations on the London Metal Exchange.',
    whatWentWell: [
      'Elena proposed index-linked raw material price adjustment formula.',
      'Active listening on thermal conduction tests.'
    ],
    whereRepStruggled: [
      'Lost control of timeline when buyer requested 90-day payment terms.'
    ],
    whatCouldBeBetter: [
      'Anchor 30-day payment standard and require 30% upfront tooling deposit.'
    ],
    recommendedNextSteps: [
      'Submit updated commercial contract with 6061-T6 index clause.'
    ],
    cues: SAMPLE_CUES_MET1.map(c => ({ ...c, score: Math.max(1, c.score - 1) })),
    objections: [
      {
        id: 'obj_v1',
        timestamp: '14:20',
        objection: 'Our automotive tier 1 contract mandates Net-90 payment terms.',
        repResponse: 'Stated that Apex normally operates on Net-30 but will consult management.',
        status: 'Unresolved',
        strongerResponseSuggestion: 'Offer 2% early payment discount for Net-15 or propose milestone billing.'
      }
    ],
    transcript: []
  },
  {
    id: 'met_4',
    name: 'Unassociated Call — German Auto Component Supplier Cold Discovery',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    uploadDate: '2026-11-09 11:20',
    duration: '19m 50s',
    processingStatus: 'Analysed',
    associatedDealId: undefined,
    associatedDealName: undefined,
    overallScorePercent: 64,
    fileFormat: 'MP3',
    fileSize: '38 MB',
    summary: 'Initial exploratory call with Hans Keller from Bavaria Gear Systems. Discussed spur gear hobbing and spline broaching. Not yet associated with an active Opportunity.',
    whatWentWell: ['Polite rapport and quick introduction of capabilities.'],
    whereRepStruggled: ['Did not establish next meeting date or clear budget.'],
    whatCouldBeBetter: ['Send follow-up brochure and prompt for active RFQ.'],
    recommendedNextSteps: ['Link to Salesforce Lead once qualification email received.'],
    cues: SAMPLE_CUES_MET1.map(c => ({ ...c, score: 3 })),
    objections: [],
    transcript: []
  },
  {
    id: 'met_5',
    name: 'SatOrbit Propulsion — Thruster Nozzle Inconel Machining',
    representativeId: 'usr_rep_2',
    representativeName: 'Elena Rostova',
    uploadDate: '2026-11-10 09:15',
    duration: '45m 00s',
    processingStatus: 'Processing',
    associatedDealId: undefined,
    associatedDealName: undefined,
    fileFormat: 'MP4',
    fileSize: '540 MB'
  },
  {
    id: 'met_6',
    name: 'Corrupted Recording — Audio Stream Truncated',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    uploadDate: '2026-11-05 13:00',
    duration: '02m 14s',
    processingStatus: 'Failed',
    fileFormat: 'MP3',
    fileSize: '2.1 MB'
  },
  {
    id: 'met_7',
    name: 'HydroMarine Pumps — Bronze Impeller 5-Axis Turning & Dynamic Balance',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    uploadDate: '2026-11-03 15:40',
    duration: '31m 20s',
    processingStatus: 'Analysed',
    associatedDealId: undefined,
    associatedDealName: undefined,
    overallScorePercent: 82,
    fileFormat: 'TXT',
    fileSize: '45 KB',
    summary: 'Transcript analysis of naval bronze machining consultation with HydroMarine naval architects.',
    whatWentWell: ['Good understanding of salt-spray corrosion standards.'],
    whereRepStruggled: ['Delivery date confirmation.'],
    whatCouldBeBetter: ['Follow up with impeller case study.'],
    recommendedNextSteps: ['Schedule plant visit.'],
    cues: SAMPLE_CUES_MET1,
    objections: [],
    transcript: []
  }
];

export const INITIAL_DEALS: DealRecord[] = [
  {
    id: 'deal_1',
    name: 'AeroDynamics — Titanium Aerospace Tooling',
    companyName: 'AeroDynamics UK Ltd',
    stage: 'Technical Review',
    crmId: '006Hs00001AERO1',
    crmSystem: 'salesforce',
    source: 'crm',
    rawStage: 'Technical Validation',
    ownerCrmId: '005Hs000001MV01',
    crmLastSyncedAt: '2026-11-12 09:00',
    amount: 185000,
    ownerId: 'usr_rep_1',
    ownerName: 'Marcus Vance',
    closeDate: '2026-12-15',
    lastMeetingDate: '2026-11-08',
    nextMeetingDate: '2026-11-17 14:00',
    timeInStage: '14 days',
    callCount: 3,
    emailCount: 11,
    risks: [
      'Client flight testing deadline demands first 10 articles in 3 weeks.',
      'Procurement pushing back on $8,500 dedicated carbide tooling surcharge.',
      'Competitor (Vanguard Precision) submitted alternative quotes.'
    ],
    stakeholders: [
      {
        id: 'stk_1',
        name: 'Dr. Thomas Wright',
        role: 'Chief Airframe Engineer',
        company: 'AeroDynamics UK',
        sentiment: 'Champion',
        lastSpoke: 'Nov 8, 2026'
      },
      {
        id: 'stk_2',
        name: 'Sarah Jenkins',
        role: 'Senior Procurement Lead',
        company: 'AeroDynamics UK',
        sentiment: 'Skeptic',
        lastSpoke: 'Nov 8, 2026'
      },
      {
        id: 'stk_3',
        name: 'Peter Macintyre',
        role: 'VP of Manufacturing & Quality',
        company: 'AeroDynamics UK',
        sentiment: 'Decision Maker',
        lastSpoke: 'Oct 28, 2026'
      }
    ],
    timeline: [
      {
        id: 'tl_1',
        date: '2026-11-08',
        type: 'meeting',
        title: 'Drawing Review & Technical Feasibility',
        description: '42m call with Thomas and Sarah. Verified ±0.005mm bore tolerances and proposed 3-week prototype split delivery.',
        meetingId: 'met_1',
        author: 'Marcus Vance'
      },
      {
        id: 'tl_2',
        date: '2026-11-04',
        type: 'email',
        title: 'Updated Aerospace Drawing Rev C Received',
        description: 'Received preliminary PDF drawing showing 5-axis wing pylon bracket geometry.',
        author: 'Dr. Thomas Wright'
      },
      {
        id: 'tl_3',
        date: '2026-10-28',
        type: 'meeting',
        title: 'Initial Discovery & Capabilities Briefing',
        description: 'Introductory discussion on Apex 5-axis DMG MORI cell capacities.',
        author: 'Marcus Vance'
      }
    ]
  },
  {
    id: 'deal_2',
    name: 'BioMedix — Precision Medical Robotic Components',
    companyName: 'BioMedix Surgical Devices',
    stage: 'Commercial Proposal',
    crmId: '006Hs00001BIOM2',
    crmSystem: 'salesforce',
    source: 'crm',
    rawStage: 'Proposal/Price Quote',
    ownerCrmId: '005Hs000001MV01',
    crmLastSyncedAt: '2026-11-12 09:00',
    amount: 320000,
    ownerId: 'usr_rep_1',
    ownerName: 'Marcus Vance',
    closeDate: '2027-01-20',
    lastMeetingDate: '2026-11-06',
    nextMeetingDate: '2026-11-20 11:00',
    timeInStage: '21 days',
    callCount: 4,
    emailCount: 18,
    risks: [
      'Requires strict FDA Class 7 cleanroom packaging verification.',
      'Annual volume commitment needed for volume discount pricing tier.'
    ],
    stakeholders: [
      {
        id: 'stk_b1',
        name: 'Claire Dupont',
        role: 'VP of Hardware Engineering',
        company: 'BioMedix',
        sentiment: 'Champion',
        lastSpoke: 'Nov 6, 2026'
      },
      {
        id: 'stk_b2',
        name: 'Markus Vogel',
        role: 'Director of Global Sourcing',
        company: 'BioMedix',
        sentiment: 'Decision Maker',
        lastSpoke: 'Oct 30, 2026'
      }
    ],
    timeline: [
      {
        id: 'tl_b1',
        date: '2026-11-06',
        type: 'meeting',
        title: 'Swiss-Type Micro Turning Discovery',
        description: '34m meeting covering medical stainless steel micro tolerances and cleanroom packaging.',
        meetingId: 'met_2',
        author: 'Marcus Vance'
      }
    ]
  },
  {
    id: 'deal_3',
    name: 'VoltDrive — EV Powertrain Inverter Casing',
    companyName: 'VoltDrive Mobility AG',
    stage: 'Negotiation',
    crmId: '006Hs00001VOLT3',
    crmSystem: 'salesforce',
    source: 'crm',
    rawStage: 'Negotiation/Review',
    ownerCrmId: '005Hs000001MV02',
    crmLastSyncedAt: '2026-11-12 09:00',
    amount: 540000,
    ownerId: 'usr_rep_2',
    ownerName: 'Elena Rostova',
    closeDate: '2026-11-30',
    lastMeetingDate: '2026-11-07',
    nextMeetingDate: '2026-11-15 15:30',
    timeInStage: '9 days',
    callCount: 6,
    emailCount: 29,
    risks: [
      'Client demanding Net-90 payment terms; finance prefers Net-30.',
      'London Metal Exchange raw aluminum volatility.'
    ],
    stakeholders: [
      {
        id: 'stk_v1',
        name: 'Henrik Larsson',
        role: 'Head of Automotive Supply Chain',
        company: 'VoltDrive AG',
        sentiment: 'Decision Maker',
        lastSpoke: 'Nov 7, 2026'
      }
    ],
    timeline: [
      {
        id: 'tl_v1',
        date: '2026-11-07',
        type: 'meeting',
        title: 'Commercial Terms & Raw Material Hedging',
        description: 'Negotiation on payment terms and aluminum price indexing.',
        meetingId: 'met_3',
        author: 'Elena Rostova'
      }
    ]
  },
  {
    id: 'deal_4',
    name: 'Nordic Defense — Subsea Sonar Transducer Housings',
    companyName: 'Nordic Marine Defense AS',
    stage: 'Discovery',
    crmId: '006Hs00001NORD4',
    crmSystem: 'salesforce',
    source: 'crm',
    rawStage: 'Prospecting',
    ownerCrmId: '005Hs000001MV02',
    crmLastSyncedAt: '2026-11-12 09:00',
    amount: 140000,
    ownerId: 'usr_rep_2',
    ownerName: 'Elena Rostova',
    closeDate: '2027-02-15',
    lastMeetingDate: '2026-10-29',
    timeInStage: '18 days',
    callCount: 1,
    emailCount: 4,
    risks: ['Strict military ITAR clearance verification required.'],
    stakeholders: [
      {
        id: 'stk_d1',
        name: 'Gunnar Lindholm',
        role: 'Naval Weapons Architect',
        company: 'Nordic Marine',
        sentiment: 'Neutral',
        lastSpoke: 'Oct 29, 2026'
      }
    ],
    timeline: []
  },
  {
    id: 'deal_5',
    name: 'Gearwerk — Planetary Gearbox Housings',
    companyName: 'Gearwerk Industrial GmbH',
    stage: 'Closed Lost',
    crmId: '006Hs00001GEAR5',
    crmSystem: 'salesforce',
    source: 'crm',
    rawStage: 'Closed Lost',
    ownerCrmId: '005Hs000001MV01',
    crmLastSyncedAt: '2026-11-12 09:00',
    amount: 210000,
    ownerId: 'usr_rep_1',
    ownerName: 'Marcus Vance',
    closeDate: '2026-10-22',
    lastMeetingDate: '2026-10-20',
    timeInStage: '6 days',
    callCount: 2,
    emailCount: 9,
    risks: [],
    stakeholders: [
      {
        id: 'stk_g1',
        name: 'Anja Brandt',
        role: 'Head of Procurement',
        company: 'Gearwerk Industrial',
        sentiment: 'Decision Maker',
        lastSpoke: 'Oct 20, 2026'
      }
    ],
    timeline: [
      {
        id: 'tl_g1',
        date: '2026-10-22',
        type: 'stage_change',
        title: 'Closed Lost in Salesforce',
        description: 'Customer awarded the contract to a lower-priced regional supplier.',
        author: 'Salesforce'
      }
    ]
  }
];

// A deal cannot exist without at least one meeting. Give every deal a meeting
// history: meetings already referenced by its timeline keep their ids, timeline
// meeting events without a recording get one, and follow-up calls fill the rest
// (up to 3 per deal) so the Deal Workspace always has meetings to show.
const CRM_SOURCE_DETAIL = 'Salesforce — Apex Precision Engineering';
const DRIVE_SOURCE_DETAIL = 'Google Drive / Sales Team / Call Recordings 2026';
const FOLLOW_UP_CALLS = ['Follow-up Call — Open Questions', 'Stakeholder Alignment Call', 'Pricing & Next Steps Call'];
const dateOffset = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

INITIAL_DEALS.forEach(deal => {
  const existing = INITIAL_MEETINGS.filter(m => m.associatedDealId === deal.id);
  const target = Math.min(Math.max(deal.callCount || 1, 1), 3);
  const generated: MeetingRecord[] = [];
  const base = deal.lastMeetingDate || '2026-10-30';

  const makeMeeting = (suffix: string, title: string, date: string, idx: number): MeetingRecord => ({
    id: `met_${deal.id}_${suffix}`,
    name: `${deal.companyName} — ${title}`,
    representativeId: deal.ownerId,
    representativeName: deal.ownerName,
    uploadDate: `${date} ${idx % 2 ? '10:30' : '14:00'}`,
    duration: `${24 + idx * 7}m ${10 + idx * 9}s`,
    processingStatus: 'Analysed',
    associatedDealId: deal.id,
    associatedDealName: deal.name,
    source: 'crm',
    sourceDetail: CRM_SOURCE_DETAIL,
    crmActivityId: `00THs00001${deal.id.replace('deal_', 'D')}${suffix.toUpperCase()}`,
    crmOpportunityId: deal.crmId,
    overallScorePercent: 62 + ((idx * 7) % 24),
    fileFormat: 'MP4',
    fileSize: `${180 + idx * 55} MB`,
    summary: `${title} with ${deal.companyName} for "${deal.name}" (${deal.stage}).`,
    whatWentWell: ['Clear agenda and good discovery questions.'],
    whereRepStruggled: ['Next step was not tied to a firm date.'],
    whatCouldBeBetter: ['Confirm owner and deadline for each action before ending the call.'],
    recommendedNextSteps: ['Send a recap email with agreed actions.'],
    cues: [],
    objections: [],
    transcript: []
  });

  // timeline meeting events that have no recording yet
  (deal.timeline || []).forEach((ev: any, i: number) => {
    if (ev.type === 'meeting' && !ev.meetingId) {
      const m = makeMeeting(`t${i + 1}`, ev.title, ev.date, i + 1);
      ev.meetingId = m.id;
      generated.push(m);
    }
  });

  // follow-up calls to reach the target count
  let n = 0;
  while (existing.length + generated.length < target) {
    const m = makeMeeting(`f${n + 1}`, FOLLOW_UP_CALLS[n % FOLLOW_UP_CALLS.length], dateOffset(base, 7 * (n + 1)), n + 2);
    generated.push(m);
    n++;
  }

  INITIAL_MEETINGS.push(...generated);
});

// Every analysed call carries data for all six report tabs: cues, objections, transcript and the summary lists.
INITIAL_MEETINGS.forEach((meeting, index) => {
  const deal = INITIAL_DEALS.find(d => d.id === meeting.associatedDealId);
  INITIAL_MEETINGS[index] = withMockAnalysis(meeting, {
    accountName: deal?.companyName,
    buyerName: deal?.stakeholders[0]?.name
  });
});

const COACHING_DEAL_1: DealCoachingProgram = {
  dealId: 'deal_1',
  dealName: 'AeroDynamics — Titanium Aerospace Tooling',
  representativeId: 'usr_rep_1',
  representativeName: 'Marcus Vance',
  status: 'In Progress',
  progressPercentage: 50,
  updatedAt: '2026-11-09',
  sourceMeetingIds: ['met_1'],
  lessons: [
    {
      id: 'lsn_1',
      title: 'Neutralizing Aerospace Tooling & Surcharge Objections',
      order: 1,
      objective: 'Overcome Sarah Jenkins’ resistance to the $8,500 dedicated tooling fee by amortizing or framing as zero-scrap insurance.',
      relevanceToDeal: 'Sarah Jenkins explicitly stated in Call 1 (at 29:15) that prototyping funds are capped at $50,000.',
      evidenceSourceCall: 'AeroDynamics UK — Technical Feasibility (Met #1)',
      evidenceMeetingId: 'met_1',
      tailoredExplanation: 'Procurement officers view custom tooling as sunk cost. Reframe the $8,500 as an amortization across the first 100 flight articles ($85/part) that guarantees zero scrap on their $4,200 titanium billets.',
      recommendedTalkTrack: [
        '"Sarah, if we absorb the tooling risk into an amortized $85 per unit over the 100-piece flight qualification batch, does that resolve your Capex budget constraint?"',
        '"A single scrapped titanium forging costs $4,200. This dedicated fixture tool pays for itself if it prevents just two scrap events."'
      ],
      practiceActivity: 'Write your reply to Sarah Jenkins, then check it against the criteria.',
      practiceScenario: 'Sarah Jenkins (Procurement) says: "The $8,500 dedicated tooling fee is above our prototyping budget. Why should we pay it?"',
      expectedOutcome: 'Secure agreement to amortize or bundle the tooling fee into piece price without discounting margin.',
      completed: true,
      managerFeedback: 'Great delivery Marcus. Remember to pause after proposing the amortization instead of defending the price.',
      managerFeedbackBy: 'David Miller',
      managerFeedbackAt: '2026-11-09'
    },
    {
      id: 'lsn_2',
      title: 'Locking Multi-Tier Schedule Commitments (Split Shipment)',
      order: 2,
      objective: 'Formalize the 10-unit expedited delivery in writing to guarantee machine slot reservation without penalty.',
      relevanceToDeal: 'Thomas Wright accepted the 3-week prototype delivery verbally, but procurement contract terms are pending.',
      evidenceSourceCall: 'AeroDynamics UK — Technical Feasibility (Met #1)',
      evidenceMeetingId: 'met_1',
      tailoredExplanation: 'Expedited overtime runs require immediate shop-floor scheduling. Ensure the client commits to drawing freeze within 48 hours in exchange for the 3-week turnaround guarantee.',
      recommendedTalkTrack: [
        '"Thomas, to hold the Hermle C42 machine slot for your 10 prototype units, we need drawing Rev D locked by Thursday noon. Can we confirm that cutoff together?"'
      ],
      practiceActivity: 'Write your reply to Thomas Wright, then check it against the criteria.',
      practiceScenario: 'Thomas Wright (Chief Airframe Engineer) says: "We cannot commit to a drawing freeze date yet. Can you hold the machine slot anyway?"',
      expectedOutcome: 'Signed milestone agreement and prevent late drawing revisions.',
      completed: true,
      managerFeedback: 'Approved. Proceed to Lesson 3 before Tuesday call.',
      managerFeedbackBy: 'David Miller',
      managerFeedbackAt: '2026-11-09'
    },
    {
      id: 'lsn_3',
      title: 'Quantifying First-Pass Yield vs Competitor Vanguard Precision',
      order: 3,
      objective: 'Differentiate Apex on 99.8% CMM first-pass yield to beat Vanguard Precision’s lower initial bid.',
      relevanceToDeal: 'Sarah Jenkins hinted competitor Vanguard submitted a lower quote.',
      evidenceSourceCall: 'AeroDynamics UK — Technical Feasibility (Met #1)',
      evidenceMeetingId: 'met_1',
      tailoredExplanation: 'Low-cost machine shops often have 8-12% scrap rates on 5-axis titanium. Show Thomas that our 99.8% yield saves AeroDynamics 3 weeks of lead time and $42,000 in replacement titanium billets.',
      recommendedTalkTrack: [
        '"When comparing quotes, what scrap allowance has Vanguard factored in? On Grade 5 titanium, an 8% scrap rate adds 3 weeks and $30k in material replacement."'
      ],
      practiceActivity: 'Write your reply to Sarah Jenkins, then check it against the criteria.',
      practiceScenario: 'Sarah Jenkins (Procurement) says: "Vanguard Precision quoted lower. Why should we choose you?"',
      expectedOutcome: 'Position Apex as the lower Total Cost of Acquisition partner.',
      completed: false
    },
    {
      id: 'lsn_4',
      title: 'Closing the Tuesday Engineering & Commercial Review',
      order: 4,
      objective: 'Transition from technical consensus to signed purchase order and initial 30% deposit.',
      relevanceToDeal: 'Scheduled commercial review on Tuesday Nov 17 at 2:00 PM GMT.',
      evidenceSourceCall: 'Upcoming Scheduled Meeting',
      tailoredExplanation: 'Ensure both Thomas (technical champion) and Sarah (procurement) agree on next step: PO issuance to trigger raw material procurement.',
      recommendedTalkTrack: [
        '"Thomas, if the GD&T sign-off is complete on Tuesday, shall we authorize raw billet ordering with Sarah right then so our mill delivery begins Friday?"'
      ],
      practiceActivity: 'Write your reply to Thomas Wright, then check it against the criteria.',
      practiceScenario: 'Thomas Wright (Chief Airframe Engineer) says: "Before Tuesday\'s review, what do you need from us to issue the purchase order?"',
      expectedOutcome: 'Signed purchase authorization.',
      completed: false
    }
  ]
};

/** Coaching programmes are per deal, keyed by deal id. Others are generated from a deal's analysed calls. */
export const INITIAL_COACHING_PROGRAMS: Record<string, DealCoachingProgram> = {
  deal_1: COACHING_DEAL_1
};

export const INITIAL_AUTOMATIONS: AutomationWorkflow[] = [
  {
    id: 'wf_1',
    name: 'Generate Meeting Summary & Action Items',
    description: 'Automatically creates executive summary and cue evaluation upon meeting analysis completion.',
    trigger: 'Meeting Status changes to Analysed',
    condition: 'Duration > 5 minutes',
    action: 'Generate 6-Tab Report & Draft Follow-up Email',
    category: 'Summary',
    status: 'Active',
    runsCount: 48,
    lastRunDate: '2026-11-08'
  },
  {
    id: 'wf_2',
    name: 'Pre-Meeting Deal Brief to Sales Rep',
    description: 'Sends automated briefing 2 hours before scheduled call summarizing prior objections, stakeholder roles, and coaching tips.',
    trigger: 'Scheduled Calendar Event = 2h before',
    condition: 'Associated Deal exists in CRM',
    action: 'Send Briefing Card to Live Assist & Email',
    category: 'Prompt',
    status: 'Active',
    runsCount: 31,
    lastRunDate: '2026-11-08'
  },
  {
    id: 'wf_3',
    name: 'Post-Call Negotiation Follow-Up Email Draft',
    description: 'Drafts tailored commercial follow-up email embedding discussed technical compromises and next milestone confirmation.',
    trigger: 'Meeting analysis completed with Commercial or Objection cues',
    condition: 'Representative approval required before dispatch',
    action: 'Create Gmail / Outlook Draft with CRM context',
    category: 'Email',
    status: 'Active',
    runsCount: 19,
    lastRunDate: '2026-11-07'
  },
  {
    id: 'wf_4',
    name: 'Closed-Lost Re-entry Campaign Trigger',
    description: 'Monitors competitor failure signals and re-engages stalled accounts after 90 days with updated case study.',
    trigger: 'Deal Stage changed to Closed Lost',
    condition: 'Loss reason = Lead time or Technical feasibility',
    action: 'Generate re-entry email draft',
    category: 'Diagnostic',
    status: 'Draft',
    runsCount: 0
  }
];

export const INITIAL_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'ks_1',
    name: 'Apex_5Axis_CNC_Machining_Capabilities_2026.pdf',
    type: 'PDF',
    sizeOrUrl: '4.8 MB',
    dateAdded: '2026-09-12',
    status: 'Indexed',
    qaAssessmentTag: 'Product Knowledge QA',
    consideredForQA: true,
    queriesCount: 142
  },
  {
    id: 'ks_2',
    name: 'AS9100D_and_ISO13485_Quality_Manual_Excerpts.pdf',
    type: 'PDF',
    sizeOrUrl: '12.1 MB',
    dateAdded: '2026-10-01',
    status: 'Indexed',
    qaAssessmentTag: 'Technical Feasibility QA',
    consideredForQA: true,
    queriesCount: 89
  },
  {
    id: 'ks_3',
    name: 'Aerospace_Titanium_Milling_Feasibility_Study.docx',
    type: 'DOCX',
    sizeOrUrl: '1.4 MB',
    dateAdded: '2026-10-15',
    status: 'Indexed',
    qaAssessmentTag: 'Technical Feasibility QA',
    consideredForQA: true,
    queriesCount: 64
  },
  {
    id: 'ks_4',
    name: 'https://apexengineering.com/services/five-axis-milling',
    type: 'Website',
    sizeOrUrl: 'https://apexengineering.com',
    dateAdded: '2026-10-20',
    status: 'Indexed',
    qaAssessmentTag: 'Commercial Awareness QA',
    consideredForQA: false,
    queriesCount: 38
  },
  {
    id: 'ks_5',
    name: 'Standard_Commercial_Terms_and_Tooling_Policy.txt',
    type: 'TXT',
    sizeOrUrl: '45 KB',
    dateAdded: '2026-11-01',
    status: 'Indexed',
    qaAssessmentTag: 'Commercial Awareness QA',
    consideredForQA: true,
    queriesCount: 110
  }
];

export const INITIAL_COMPANY_DOCUMENTS: CompanyDocument[] = [
  {
    id: 'doc_1',
    name: 'Apex_Manufacturing_Handbook_v3.pdf',
    size: '8.4 MB',
    uploadDate: '2026-09-15',
    taggedAssessment: 'Product Knowledge QA',
    considered: true,
    status: 'Ready'
  },
  {
    id: 'doc_2',
    name: 'Pricing_and_Surcharge_Policy_2026.pdf',
    size: '1.2 MB',
    uploadDate: '2026-10-04',
    taggedAssessment: 'Commercial Awareness QA',
    considered: true,
    status: 'Ready'
  },
  {
    id: 'doc_3',
    name: 'Cleanroom_ISO_Class7_SOP.docx',
    size: '2.8 MB',
    uploadDate: '2026-10-22',
    taggedAssessment: 'Technical Feasibility QA',
    considered: true,
    status: 'Ready'
  }
];

export const PRACTICE_LESSONS_CATALOG: PracticeLessonCatalog[] = [
  {
    id: 'pl_1',
    title: 'Explain Engineering Simply',
    category: 'Technical Communication',
    description: 'Transform complex 5-axis CAM strategies and tolerance stacks into accessible business value for procurement officers.',
    recommendedTime: '10 mins',
    level: 'Foundational',
    promptsCountDefault: 5,
    intervalSecondsDefault: 4,
    samplePrompts: [
      'The buyer asks: "Why should we pay extra for 5-axis simultaneous milling when our local shop has a 3-axis mill?" Explain simply.',
      'The client says: "All metal cutting looks the same to me. What does ±0.005mm tolerance actually mean for our airframe assembly?"',
      'The client asks: "How does your in-process laser tool inspection prevent bad batches from reaching us?"',
      'Translate thermal distortion during titanium milling into plain procurement language.',
      'Explain why cleanroom packaging is essential for medical implants without sounding academic.'
    ]
  },
  {
    id: 'pl_2',
    title: 'Beyond the Price Quote',
    category: 'Commercial Discovery',
    description: 'Anchor value before sharing numbers. Discover client budget cycles, cost of downtime, and scrap expense.',
    recommendedTime: '12 mins',
    level: 'Advanced',
    promptsCountDefault: 6,
    intervalSecondsDefault: 5,
    samplePrompts: [
      'The prospect says: "Just send us your rate card per machining hour." How do you steer them toward project scope first?',
      'The prospect asks: "Can you match this 20% cheaper quote from our overseas vendor?" Respond with Total Cost of Acquisition.',
      'Ask three probing questions to uncover what happens to their flight test schedule if parts arrive late.',
      'The buyer refuses to disclose their prototyping budget. How do you anchor a realistic price bracket?',
      'Frame an $8,500 tooling fee as zero-scrap insurance.',
      'How do you propose milestone billing on a $200k aerospace prototype run?'
    ]
  },
  {
    id: 'pl_3',
    title: 'Handle Technical Objections',
    category: 'Objection Handling',
    description: 'Confidently address tolerance tightness, tool wear surcharges, material availability, and tight delivery windows.',
    recommendedTime: '15 mins',
    level: 'Mastery',
    promptsCountDefault: 8,
    intervalSecondsDefault: 6,
    samplePrompts: [
      'The lead engineer says: "Inconel 718 work hardens too fast for your machine speeds. You will break tools and miss deadline."',
      '"We need first articles in 3 weeks, but your standard lead time is 8 weeks. This is a dealbreaker."',
      '"Your competitor Vanguard Precision promises to waive all fixture and tooling charges."',
      '"We had severe bore distortion with our last subcontractor. Why won’t your shop have the same problem?"',
      '"Our QA team mandates 100% CMM report on every single unit. Will that slow down deliveries?"',
      '"Your raw material index clause is too risky for our fixed-price contract."',
      '"What guarantees do we have that your machine operators are AS9100D certified?"',
      '"How do you handle emergency engineering revisions mid-production?"'
    ]
  },
  {
    id: 'pl_4',
    title: 'Win the Manufacturing Project',
    category: 'Closing & Commitments',
    description: 'Drive high-conviction closing actions: securing native CAD models, booking technical review calls, and PO issuance.',
    recommendedTime: '8 mins',
    level: 'Advanced',
    promptsCountDefault: 4,
    intervalSecondsDefault: 4,
    samplePrompts: [
      'The call is ending with generic "we will be in touch". How do you lock in an exact date for drawing sign-off?',
      'Ask the client to release native STEP files under NDA today.',
      'Confirm purchase order release to lock machine slot allocation.',
      'Close the loop on an agreed split shipment proposal.'
    ]
  }
];

export const INITIAL_MOCK_MEETINGS: MockMeetingHistoryItem[] = [
  {
    id: 'mock_1',
    startedAt: '2026-11-09 15:30',
    duration: '14m 20s',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    buyerName: 'David Sterling (AI Simulation)',
    buyerRole: 'VP of Procurement, Global Aerospace Systems',
    roleplayType: 'Warm Commercial Negotiation',
    domain: 'Aerospace CNC Machining',
    score: 84,
    summary: 'Strong rehearsal on defending custom tooling charges. Marcus successfully introduced the concept of amortizing the fixture cost across production batches.',
    talkListenRatio: '46% / 54%',
    fillerWordsPerMin: 1.2,
    talkSpeedWpm: 138,
    longestMonologue: '1m 15s',
    whatWentWell: [
      'Maintained calm composure when buyer threatened to walk to competitor.',
      'Clear articulation of AS9100D audit compliance.',
      'Proposed split delivery terms within 2 minutes of objection.'
    ],
    pointsToImprove: [
      'Reduce use of "basically" and "essentially" when explaining technical setups.',
      'Ask buyer to confirm approval authority before proposing price concessions.'
    ],
    rescoreStatus: 'idle'
  },
  {
    id: 'mock_2',
    startedAt: '2026-11-04 11:00',
    duration: '09m 45s',
    representativeId: 'usr_rep_1',
    representativeName: 'Marcus Vance',
    buyerName: 'Karen Vance (AI Simulation)',
    buyerRole: 'Lead Quality Engineer, MedTech Robotics',
    roleplayType: 'Cold Technical Discovery',
    domain: 'Medical Swiss Micro-Machining',
    score: 72,
    summary: 'Good discovery on Swiss turning tolerances. Stumbled when questioned about Class 7 cleanroom packaging verification certificates.',
    talkListenRatio: '58% / 42%',
    fillerWordsPerMin: 3.4,
    talkSpeedWpm: 154,
    longestMonologue: '2m 10s',
    whatWentWell: ['Excellent rapport in the first 60 seconds.'],
    pointsToImprove: ['Talked too fast (154 WPM). Slow down when explaining inspection protocols.'],
    rescoreStatus: 'idle'
  }
];

export const INITIAL_CREDIT_TRANSACTIONS: CreditTransaction[] = [
  { id: 'ctx_1', activity: 'Meeting Analysis (met_1 AeroDynamics)', date: '2026-11-08', creditsConsumed: 15, remainingBalance: 385 },
  { id: 'ctx_2', activity: 'Live Assist Real-Time Session (42 mins)', date: '2026-11-08', creditsConsumed: 20, remainingBalance: 400 },
  { id: 'ctx_3', activity: 'AI Mock Meeting Roleplay (14 mins)', date: '2026-11-09', creditsConsumed: 25, remainingBalance: 360 },
  { id: 'ctx_4', activity: 'Practice Timed Prompts Session', date: '2026-11-09', creditsConsumed: 5, remainingBalance: 355 },
  { id: 'ctx_5', activity: 'Monthly Plan Subscription Credit Grant', date: '2026-11-01', creditsConsumed: -500, remainingBalance: 500 }
];

export const INITIAL_INVOICES: InvoiceItem[] = [
  { id: 'INV-2026-003', date: '2026-11-01', amount: 249, purpose: 'Growth Plan — Monthly (5 Seats + 500 AI Credits)', status: 'Paid', pdfDownloadUrl: '#' },
  { id: 'INV-2026-002', date: '2026-10-01', amount: 249, purpose: 'Growth Plan — Monthly (5 Seats + 500 AI Credits)', status: 'Paid', pdfDownloadUrl: '#' },
  { id: 'INV-2026-001', date: '2026-09-01', amount: 99, purpose: 'Credit Top-Up (1,000 AI Credits)', status: 'Paid', pdfDownloadUrl: '#' }
];

// Tag the original sample meetings with where they were fetched from.
const SAMPLE_SOURCES: Record<string, 'crm' | 'drive'> = { met_1: 'crm', met_2: 'drive', met_3: 'crm', met_7: 'drive' };
INITIAL_MEETINGS.forEach(meeting => {
  if (meeting.source) return;
  const src = SAMPLE_SOURCES[meeting.id];
  meeting.source = src ?? 'upload';
  if (src === 'crm') meeting.sourceDetail = CRM_SOURCE_DETAIL;
  if (src === 'drive') meeting.sourceDetail = DRIVE_SOURCE_DETAIL;
});
