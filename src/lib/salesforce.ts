import { DealStage, TeamMember } from '../types';

/**
 * Salesforce is the only CRM SellMore supports for now, and V1 is read-only.
 *
 * This module is the single Salesforce client boundary. Today it serves mock data;
 * a real backend replaces the exports below with OAuth + REST calls without the
 * rest of the app changing:
 *   - Opportunities      -> deals
 *   - Contact Roles      -> stakeholders
 *   - Activities (Task / Event with a recording link) -> meetings
 */

export const SALESFORCE_ORG_NAME = 'Apex Precision Engineering (Salesforce Org 00D5g000004L)';
export const SALESFORCE_SOURCE_DETAIL = 'Salesforce — Apex Precision Engineering';

/**
 * Per-company mapping from Salesforce Opportunity stage names to SellMore stages.
 * Every Salesforce org names stages differently, so in production the admin edits
 * this at connect time. Anything unmapped falls back to Discovery and the original
 * name is kept on the deal as `rawStage`.
 */
export const SALESFORCE_STAGE_MAP: Record<string, DealStage> = {
  'Prospecting': 'Discovery',
  'Qualification': 'Discovery',
  'Needs Analysis': 'Discovery',
  'Technical Validation': 'Technical Review',
  'Value Proposition': 'Technical Review',
  'Proposal/Price Quote': 'Commercial Proposal',
  'Negotiation/Review': 'Negotiation',
  'Closed Won': 'Closed Won',
  'Closed Lost': 'Closed Lost'
};

export const mapSalesforceStage = (rawStage: string): DealStage =>
  SALESFORCE_STAGE_MAP[rawStage] ?? 'Discovery';

/** Salesforce users, matched to SellMore users by email so deal owners resolve to reps. */
export const SALESFORCE_USERS = [
  { id: '005Hs000001MV01', email: 'marcus.vance@apexengineering.com' },
  { id: '005Hs000001MV02', email: 'elena.rostova@apexengineering.com' },
  { id: '005Hs000001MV03', email: 'julian.hayes@apexengineering.com' }
];

export const resolveSalesforceOwner = (
  ownerCrmId: string | undefined,
  teamMembers: TeamMember[]
): TeamMember | undefined => {
  const sfUser = SALESFORCE_USERS.find(u => u.id === ownerCrmId);
  if (!sfUser) return undefined;
  return teamMembers.find(m => m.email.toLowerCase() === sfUser.email.toLowerCase());
};

export interface SalesforceContactRole {
  name: string;
  role: string;
  sentiment: 'Champion' | 'Neutral' | 'Skeptic' | 'Decision Maker';
}

export interface SalesforceOpportunity {
  id: string;
  name: string;
  accountName: string;
  rawStage: string;
  amount: number;
  closeDate: string;
  ownerCrmId: string;
  daysInStage: number;
  /** Opportunity Contact Roles. They become the deal's stakeholders. */
  contactRoles: SalesforceContactRole[];
  /** Id of the matching sample deal, so loading the sample data replaces it instead of duplicating it. */
  dealId?: string;
}

/**
 * Opportunities in the connected Salesforce org. SellMore only creates a deal for an Opportunity
 * once one of its call recordings is imported, because a deal cannot exist without meeting history.
 */
export const SALESFORCE_OPPORTUNITIES: SalesforceOpportunity[] = [
  {
    id: '006Hs00001AERO1', dealId: 'deal_1',
    name: 'AeroDynamics — Titanium Aerospace Tooling', accountName: 'AeroDynamics UK Ltd',
    rawStage: 'Technical Validation', amount: 185000, closeDate: '2026-12-15', ownerCrmId: '005Hs000001MV01', daysInStage: 14,
    contactRoles: [
      { name: 'Dr. Thomas Wright', role: 'Chief Airframe Engineer', sentiment: 'Champion' },
      { name: 'Sarah Jenkins', role: 'Senior Procurement Lead', sentiment: 'Skeptic' },
      { name: 'Peter Macintyre', role: 'VP of Manufacturing & Quality', sentiment: 'Decision Maker' }
    ]
  },
  {
    id: '006Hs00001BIOM2', dealId: 'deal_2',
    name: 'BioMedix — Precision Medical Robotic Components', accountName: 'BioMedix Surgical Devices',
    rawStage: 'Proposal/Price Quote', amount: 320000, closeDate: '2027-01-20', ownerCrmId: '005Hs000001MV01', daysInStage: 21,
    contactRoles: [
      { name: 'Claire Dupont', role: 'VP of Hardware Engineering', sentiment: 'Champion' },
      { name: 'Markus Vogel', role: 'Director of Global Sourcing', sentiment: 'Decision Maker' }
    ]
  },
  {
    id: '006Hs00001VOLT3', dealId: 'deal_3',
    name: 'VoltDrive — EV Powertrain Inverter Casing', accountName: 'VoltDrive Mobility AG',
    rawStage: 'Negotiation/Review', amount: 540000, closeDate: '2026-11-30', ownerCrmId: '005Hs000001MV02', daysInStage: 9,
    contactRoles: [
      { name: 'Henrik Larsson', role: 'Head of Automotive Supply Chain', sentiment: 'Decision Maker' }
    ]
  },
  {
    id: '006Hs00001NORD4', dealId: 'deal_4',
    name: 'Nordic Defense — Subsea Sonar Transducer Housings', accountName: 'Nordic Marine Defense AS',
    rawStage: 'Prospecting', amount: 140000, closeDate: '2027-02-15', ownerCrmId: '005Hs000001MV02', daysInStage: 18,
    contactRoles: [
      { name: 'Gunnar Lindholm', role: 'Naval Weapons Architect', sentiment: 'Neutral' }
    ]
  },
  {
    id: '006Hs00001GEAR5', dealId: 'deal_5',
    name: 'Gearwerk — Planetary Gearbox Housings', accountName: 'Gearwerk Industrial GmbH',
    rawStage: 'Closed Lost', amount: 210000, closeDate: '2026-10-22', ownerCrmId: '005Hs000001MV01', daysInStage: 6,
    contactRoles: [
      { name: 'Anja Brandt', role: 'Head of Procurement', sentiment: 'Decision Maker' }
    ]
  },
  {
    id: '006Hs00001HELX1',
    name: 'Helix Robotics — Gearbox Housing Machining', accountName: 'Helix Robotics GmbH',
    rawStage: 'Qualification', amount: 96000, closeDate: '2027-02-28', ownerCrmId: '005Hs000001MV01', daysInStage: 3,
    contactRoles: [
      { name: 'Lena Hoffmann', role: 'Head of Operations', sentiment: 'Champion' }
    ]
  },
  {
    id: '006Hs00001KESS1',
    name: 'Kessler Automotive — Transmission Shaft Machining', accountName: 'Kessler Automotive GmbH',
    rawStage: 'Needs Analysis', amount: 128000, closeDate: '2027-03-15', ownerCrmId: '005Hs000001MV02', daysInStage: 5,
    contactRoles: [
      { name: 'Jonas Kessler', role: 'Procurement Director', sentiment: 'Decision Maker' },
      { name: 'Mara Vogt', role: 'Manufacturing Engineer', sentiment: 'Neutral' }
    ]
  },
  {
    id: '006Hs00001MERI1',
    name: 'Meridian Aero — Wing Rib Machining', accountName: 'Meridian Aero Systems',
    rawStage: 'Value Proposition', amount: 250000, closeDate: '2027-04-10', ownerCrmId: '005Hs000001MV03', daysInStage: 7,
    contactRoles: [
      { name: 'Priya Menon', role: 'Chief Engineer', sentiment: 'Champion' },
      { name: 'Oliver Grant', role: 'Supply Chain Director', sentiment: 'Neutral' }
    ]
  }
];

export interface SalesforceActivity {
  id: string;
  name: string;
  /** The Opportunity the Activity is attached to (WhatId). Null when no Opportunity exists yet. */
  opportunityId: string | null;
  accountName: string;
  ownerCrmId: string;
  durationMinutes: number;
}

/**
 * Call recordings logged to Salesforce as Activities, in the order a sync brings them in
 * (two per sync). Importing a recording also creates the deal of its Opportunity when SellMore
 * does not have it yet, so every deal arrives with meeting history.
 *
 * The feed covers every case the sync has to handle: a first call on a new Opportunity, further
 * calls on a deal SellMore already has, a call with no Opportunity at all, and a later Opportunity
 * that matches a draft deal.
 */
export const SALESFORCE_ACTIVITIES: SalesforceActivity[] = [
  { id: '00THs00002ACT01', name: 'Pricing Review Call', opportunityId: '006Hs00001VOLT3', accountName: 'VoltDrive Mobility AG', ownerCrmId: '005Hs000001MV02', durationMinutes: 27 },
  { id: '00THs00002ACT02', name: 'Procurement Check-in', opportunityId: '006Hs00001BIOM2', accountName: 'BioMedix Surgical Devices', ownerCrmId: '005Hs000001MV01', durationMinutes: 21 },
  { id: '00THs00002ACT03', name: 'Technical Feasibility Review', opportunityId: '006Hs00001AERO1', accountName: 'AeroDynamics UK Ltd', ownerCrmId: '005Hs000001MV01', durationMinutes: 42 },
  { id: '00THs00002ACT04', name: 'Kickoff Call', opportunityId: '006Hs00001HELX1', accountName: 'Helix Robotics GmbH', ownerCrmId: '005Hs000001MV01', durationMinutes: 33 },
  { id: '00THs00002ACT05', name: 'Cold Discovery Call', opportunityId: null, accountName: 'Kessler Automotive GmbH', ownerCrmId: '005Hs000001MV02', durationMinutes: 24 },
  { id: '00THs00002ACT06', name: 'Capabilities Discovery', opportunityId: '006Hs00001NORD4', accountName: 'Nordic Marine Defense AS', ownerCrmId: '005Hs000001MV02', durationMinutes: 29 },
  { id: '00THs00002ACT07', name: 'Requirements Workshop', opportunityId: '006Hs00001MERI1', accountName: 'Meridian Aero Systems', ownerCrmId: '005Hs000001MV03', durationMinutes: 36 },
  { id: '00THs00002ACT08', name: 'Contract Redline Walkthrough', opportunityId: '006Hs00001VOLT3', accountName: 'VoltDrive Mobility AG', ownerCrmId: '005Hs000001MV02', durationMinutes: 31 },
  { id: '00THs00002ACT09', name: 'Technical Review', opportunityId: '006Hs00001KESS1', accountName: 'Kessler Automotive GmbH', ownerCrmId: '005Hs000001MV02', durationMinutes: 38 },
  { id: '00THs00002ACT10', name: 'Loss Review Call', opportunityId: '006Hs00001GEAR5', accountName: 'Gearwerk Industrial GmbH', ownerCrmId: '005Hs000001MV01', durationMinutes: 18 }
];
