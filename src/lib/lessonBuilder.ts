import { LessonSpec, MeetingRecord } from '../types';
import { CUE_GROUPS, PRACTICE_LESSONS, PracticeCheck, PracticeLesson, PracticeTurn, cueName } from '../data/practiceLessons';
import { checksForTurn } from './practiceCorrection';

/**
 * Practice lessons are not pre-made. They are built from the cues a rep fell short on, either in one
 * meeting or across every analysed call on a lead. A lesson is stored as a small spec (which cues,
 * where it came from) and turned into a playable conversation here, from the practice templates.
 */

/** A cue scoring below this, out of 5, counts as a gap. */
export const GAP_THRESHOLD = 3.5;

const GROUP_OF_CUE: Record<number, string> = {
  1: 'Communication', 2: 'Discovery', 3: 'Discovery', 4: 'Communication', 5: 'Technical Evaluation',
  6: 'Solution & Value', 7: 'Solution & Value', 8: 'Commercial', 9: 'Commercial', 10: 'Communication',
  11: 'Closing & Follow-up', 12: 'Closing & Follow-up'
};

export const groupOfCue = (cueId: number) => GROUP_OF_CUE[cueId] ?? 'Communication';

export interface CueGap {
  cueId: number;
  name: string;
  /** Average score out of 5 across the analysed calls. */
  average: number;
  /** How many analysed calls scored this cue. */
  calls: number;
}

/** Cue averages across the given calls, weakest first. Only cues that were scored are included. */
export const cueAverages = (meetings: MeetingRecord[]): CueGap[] => {
  const totals = new Map<number, { sum: number; calls: number }>();
  meetings
    .filter(m => m.processingStatus === 'Analysed')
    .forEach(m => (m.cues || []).forEach(c => {
      if (!c.isAssessable) return;
      const t = totals.get(c.id) ?? { sum: 0, calls: 0 };
      t.sum += c.score;
      t.calls += 1;
      totals.set(c.id, t);
    }));
  return Array.from(totals.entries())
    .map(([cueId, t]) => ({ cueId, name: cueName(cueId), average: t.sum / t.calls, calls: t.calls }))
    .sort((a, b) => a.average - b.average || a.cueId - b.cueId);
};

export const findGaps = (meetings: MeetingRecord[]): CueGap[] => cueAverages(meetings).filter(c => c.average < GAP_THRESHOLD);

/** Orders cues so the ones in the same category sit next to each other. */
const byCategory = (cueIds: number[]) =>
  [...cueIds].sort((a, b) => CUE_GROUPS.indexOf(groupOfCue(a) as typeof CUE_GROUPS[number]) - CUE_GROUPS.indexOf(groupOfCue(b) as typeof CUE_GROUPS[number]) || a - b);

export interface PlannedLesson {
  title: string;
  cueIds: number[];
}

export interface LessonPlan {
  id: 'focused' | 'compact';
  label: string;
  description: string;
  lessons: PlannedLesson[];
}

const titleFor = (cueIds: number[]) => {
  const names = cueIds.map(cueName);
  return names.length <= 2 ? names.join(' & ') : `${names[0]}, ${names[1]} and ${names.length - 2} more`;
};

const chunk = (cueIds: number[], size: number): number[][] => {
  const out: number[][] = [];
  for (let i = 0; i < cueIds.length; i += size) out.push(cueIds.slice(i, i + size));
  // A single cue left over joins the previous lesson rather than standing alone.
  if (out.length > 1 && out[out.length - 1].length === 1 && size === 2) {
    const lone = out.pop() as number[];
    out[out.length - 1].push(...lone);
  }
  return out;
};

/** Cues from the same category are grouped first; what is left over is packed together. */
const groupCues = (ordered: number[], size: number): number[][] => {
  const lessons: number[][] = [];
  const leftovers: number[] = [];
  CUE_GROUPS.forEach(group => {
    const ids = ordered.filter(id => groupOfCue(id) === group);
    for (let i = 0; i < ids.length; i += size) {
      const part = ids.slice(i, i + size);
      if (part.length >= 2) lessons.push(part);
      else leftovers.push(...part);
    }
  });
  const packed = [...lessons, ...chunk(leftovers, size)];
  if (size <= 2) return packed;
  // Bigger lessons: join neighbouring small lessons while they still fit.
  const merged: number[][] = [];
  packed.forEach(l => {
    const last = merged[merged.length - 1];
    if (last && last.length + l.length <= size) last.push(...l);
    else merged.push([...l]);
  });
  return merged;
};

/**
 * The AI-suggested plan: the gaps grouped into lessons. Two shapes are offered, many small lessons
 * of two cues, or fewer bigger lessons of up to four, with cues from the same category kept together.
 */
export const recommendPlans = (gaps: CueGap[]): LessonPlan[] => {
  const ordered = byCategory(gaps.map(g => g.cueId));
  if (ordered.length === 0) return [];
  const toPlan = (id: LessonPlan['id'], label: string, description: string, size: number): LessonPlan => ({
    id, label, description,
    lessons: groupCues(ordered, size).map(ids => ({ title: titleFor(ids), cueIds: ids }))
  });
  const plans = [toPlan('focused', 'Focused lessons', 'Two cues per lesson. Shorter sessions, one idea at a time.', 2)];
  const compact = toPlan('compact', 'Compact lessons', 'Up to four cues per lesson. Fewer sessions, more in each.', 4);
  if (compact.lessons.length < plans[0].lessons.length) plans.push(compact);
  return plans;
};

/* ---------------- turning a spec into a playable lesson ---------------- */

interface Candidate {
  templateId: string;
  turn: PracticeTurn;
  checks: PracticeCheck[];
}

const namespaced = (templateId: string, check: PracticeCheck): PracticeCheck => ({ ...check, id: `${templateId}:${check.id}` });

export const buildLesson = (spec: LessonSpec): PracticeLesson => {
  const cueIds = byCategory(spec.cueIds);
  const wanted = new Set(cueIds);
  const templates = PRACTICE_LESSONS.filter(t => t.cueIds.some(id => wanted.has(id)));

  const candidates: Candidate[] = [];
  templates.forEach(t => t.turns.forEach((turn, i) => {
    const checks = checksForTurn(t, i).filter(c => wanted.has(c.cueId));
    if (checks.length) candidates.push({ templateId: t.id, turn, checks });
  }));

  // Every cue gets a turn that checks it first; remaining turns are shared out between templates.
  const cap = Math.min(5, Math.max(3, cueIds.length + 1));
  const chosen: Candidate[] = [];
  const coverage = new Set<number>();
  cueIds.forEach(id => {
    if (chosen.length >= cap || coverage.has(id)) return;
    const pick = candidates.find(c => !chosen.includes(c) && c.checks.some(k => k.cueId === id));
    if (!pick) return;
    chosen.push(pick);
    pick.checks.forEach(k => coverage.add(k.cueId));
  });
  for (let round = 0; chosen.length < cap && round < 3; round++) {
    templates.forEach(t => {
      if (chosen.length >= cap) return;
      const pick = candidates.find(c => c.templateId === t.id && !chosen.includes(c));
      if (pick) chosen.push(pick);
    });
  }

  const checks = chosen
    .flatMap(c => c.checks.map(k => namespaced(c.templateId, k)))
    .filter((c, i, all) => all.findIndex(x => x.id === c.id) === i);
  const turns: PracticeTurn[] = chosen.map(c => ({
    ...c.turn,
    focus: c.checks.map(k => `${c.templateId}:${k.id}`)
  }));

  const lead = templates[0];
  return {
    id: spec.id,
    title: spec.title,
    group: groupOfCue(cueIds[0]),
    cueIds,
    level: 'Targeted',
    duration: `${Math.max(6, turns.length * 3)} to ${Math.max(8, turns.length * 3 + 2)} min`,
    outcome: `Strengthen ${cueIds.map(cueName).join(', ')}.`,
    concept: Array.from(new Set(templates.map(t => t.concept))).slice(0, 2).join(' '),
    example: lead.example,
    checks,
    turns,
    closing: lead.closing
  };
};

export const newSpecId = () => `lsn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
