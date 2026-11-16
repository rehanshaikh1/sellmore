import { DealRecord, DealStage, MeetingRecord } from '../types';

export const DEAL_STAGES: DealStage[] = [
  'Discovery',
  'Technical Review',
  'Commercial Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
];

export const isClosedStage = (stage: DealStage) => stage === 'Closed Won' || stage === 'Closed Lost';

/** Meetings linked to a deal, by the meeting's own link or by the deal timeline. */
export const getDealMeetings = (deal: DealRecord, meetings: MeetingRecord[]): MeetingRecord[] => {
  const linked = new Set((deal.timeline || []).map(t => t.meetingId).filter(Boolean) as string[]);
  return meetings.filter(m => m.associatedDealId === deal.id || linked.has(m.id));
};

const daysInStage = (deal: DealRecord): number => {
  const match = /(\d+)/.exec(deal.timeInStage || '');
  return match ? Number(match[1]) : 0;
};

/**
 * Risks for a deal, computed from the Salesforce record and its linked calls.
 * `deal.risks` holds risks already found by call analysis; this adds the ones that
 * follow from the data itself and removes duplicates. Closed deals carry no risk.
 */
export const computeDealRisks = (deal: DealRecord, meetings: MeetingRecord[], today = new Date()): string[] => {
  if (isClosedStage(deal.stage)) return [];
  const risks = [...(deal.risks || [])];
  const dealMeetings = getDealMeetings(deal, meetings);
  const analysed = dealMeetings.filter(m => m.processingStatus === 'Analysed');

  if (dealMeetings.length === 0) {
    risks.push('No call has been recorded for this lead yet.');
  }
  if (deal.stakeholders.length > 0 && !deal.stakeholders.some(s => s.sentiment === 'Decision Maker')) {
    risks.push('No decision maker is identified on the Opportunity contact roles.');
  }
  if (deal.stakeholders.length === 0) {
    risks.push('No contact roles are set on the Opportunity.');
  }
  const stageDays = daysInStage(deal);
  if (stageDays >= 21) {
    risks.push(`Stalled in ${deal.stage} for ${stageDays} days.`);
  }
  if (deal.closeDate && new Date(`${deal.closeDate}T00:00:00Z`) < today) {
    risks.push(`Close date ${deal.closeDate} has passed and the lead is still open.`);
  }
  analysed.forEach(m => {
    (m.objections || [])
      .filter(o => o.status === 'Unresolved')
      .forEach(o => risks.push(`Unresolved objection: ${o.objection}`));
  });

  return Array.from(new Set(risks));
};
