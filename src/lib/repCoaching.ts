import { DealRecord, LessonSpec, MeetingRecord } from '../types';
import { getDealMeetings } from './deals';

/**
 * Can a manager coach this rep yet? A manager creates coaching lessons for a rep's lead from that
 * lead's analysed calls, so a rep is ready once one of their leads has an analysed call. Otherwise the
 * Coach button is locked and `reason` says why.
 */
export const getRepCoaching = (
  repId: string,
  deals: DealRecord[],
  lessons: LessonSpec[],
  meetings: MeetingRecord[]
) => {
  const repDeals = deals.filter(d => d.ownerId === repId);
  const coachable = repDeals.filter(d => getDealMeetings(d, meetings).some(m => m.processingStatus === 'Analysed'));
  const withLessons = repDeals.filter(d => lessons.some(l => l.leadId === d.id));
  // Lead to open first: one that already has lessons, otherwise the first that can be coached.
  const first = withLessons.find(d => coachable.includes(d)) ?? coachable[0];

  let reason = '';
  if (coachable.length === 0) {
    reason = repDeals.length === 0
      ? 'This rep has no leads yet.'
      : "None of this rep's leads has an analysed call yet.";
  }

  return { repDeals, withPlan: coachable, hasPlan: coachable.length > 0, firstDealId: first?.id, lessonCount: lessons.filter(l => repDeals.some(d => d.id === l.leadId)).length, reason };
};

/** Call and score figures for one rep, taken from their analysed meetings. */
export const getRepStats = (repId: string, meetings: MeetingRecord[]) => {
  const repMeetings = meetings.filter(m => m.representativeId === repId);
  const analysed = repMeetings.filter(m => m.processingStatus === 'Analysed');
  const scored = analysed.filter(m => typeof m.overallScorePercent === 'number');
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, m) => sum + (m.overallScorePercent as number), 0) / scored.length)
    : null;

  // Average score per cue across the rep's analysed calls.
  const totals = new Map<number, { name: string; sum: number; count: number }>();
  analysed.forEach(m => (m.cues || []).forEach(c => {
    const entry = totals.get(c.id) ?? { name: c.name, sum: 0, count: 0 };
    entry.sum += c.score;
    entry.count += 1;
    totals.set(c.id, entry);
  }));
  const cueAverages = Array.from(totals.entries())
    .map(([id, e]) => ({ id, name: e.name, average: e.sum / e.count }))
    .sort((a, b) => b.average - a.average || a.id - b.id);

  return {
    repMeetings,
    analysedCount: analysed.length,
    averageScore,
    strongest: cueAverages.slice(0, 3),
    weakest: [...cueAverages].reverse().slice(0, 3)
  };
};
