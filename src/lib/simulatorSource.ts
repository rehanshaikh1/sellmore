import { DealRecord, MeetingRecord } from '../types';
import { cueAverages, findGaps, groupOfCue } from './lessonBuilder';

/**
 * Mock meetings and the Live Assist simulator are not free-standing. Each one is built from an
 * analysed meeting: the buyer, the scenario and the cues to focus on all come from that call,
 * so a rep can only rehearse something SellMore has already seen them do.
 */

export const analysedMeetings = (meetings: MeetingRecord[]) => meetings.filter(m => m.processingStatus === 'Analysed');

export interface SimulatorSetup {
  meetingId: string;
  meetingName: string;
  account: string;
  buyerName: string;
  buyerRole: string;
  roleplayType: string;
  /** The cues this call fell short on, weakest first. */
  focusCueIds: number[];
  score?: number;
}

const ROLEPLAY_BY_GROUP: Record<string, string> = {
  'Closing & Follow-up': 'Final PO Authorization Close',
  Commercial: 'Warm Commercial Negotiation',
  'Technical Evaluation': 'Competitor Pushback Defense',
  'Solution & Value': 'Competitor Pushback Defense',
  Discovery: 'Cold Call',
  Communication: 'Cold Call'
};

export const setupFromMeeting = (meeting: MeetingRecord, deals: DealRecord[]): SimulatorSetup => {
  const deal = deals.find(d => d.id === meeting.associatedDealId);
  const prospect = (meeting.transcript || []).find(t => t.role === 'prospect');
  const buyerName = (prospect?.speaker || deal?.stakeholders[0]?.name || 'the buyer').replace(/\s*\(.*\)\s*$/, '').trim();
  const stakeholder = deal?.stakeholders.find(s => s.name === buyerName);
  const gaps = findGaps([meeting]);
  const ranked = gaps.length ? gaps : cueAverages([meeting]).slice(0, 2);
  const focusCueIds = ranked.slice(0, 3).map(g => g.cueId);
  return {
    meetingId: meeting.id,
    meetingName: meeting.name,
    account: deal?.companyName || meeting.name.split(' — ')[0],
    buyerName,
    buyerRole: stakeholder?.role || 'Buyer',
    roleplayType: ROLEPLAY_BY_GROUP[groupOfCue(focusCueIds[0] ?? 1)] ?? 'Cold Call',
    focusCueIds,
    score: meeting.overallScorePercent
  };
};
