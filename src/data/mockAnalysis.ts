import { MeetingObjection, MeetingRecord, SalesCue, TranscriptSnippet } from '../types';
import { SALES_CUES_FRAMEWORK } from './cueFramework';

/**
 * Mock call analysis. The real analysis service will return the same shape; until then every
 * analysed call gets a complete, consistent result so that all six report tabs have data:
 * Overview, Scorecard, Cue analysis, Objections, Transcript and Improvement areas.
 *
 * The output depends only on the input, so the same call always shows the same report.
 */

export interface MockAnalysis {
  overallScorePercent: number;
  summary: string;
  whatWentWell: string[];
  whereRepStruggled: string[];
  whatCouldBeBetter: string[];
  recommendedNextSteps: string[];
  cues: SalesCue[];
  objections: MeetingObjection[];
  transcript: TranscriptSnippet[];
}

export interface MockAnalysisInput {
  /** Anything stable for the call (its id or name). It decides the scores and wording. */
  seed: string;
  repName: string;
  accountName: string;
  buyerName?: string;
  durationSeconds: number;
  /** Keep the call's existing overall score when it already has one. */
  targetPercent?: number;
}

const hash = (text: string) => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const clock = (total: number) => {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const BUYERS = ['Daniel Brooks', 'Priya Nair', 'Marco Bianchi', 'Hannah Weber', 'Carlos Mendes', 'Elena Petrova'];
const MATERIALS = ['titanium and aluminium', 'stainless steel', 'Inconel and bronze'];
const VOLUMES = ['200', '500', '1,200'];
const WEEKS = ['six', 'eight', 'four'];

/** What each cue looks like when it goes well, when it does not, and how to improve it. */
const CUE_TEXT: Record<number, { well: string; gap: string; improve: string; turn: number }> = {
  1: {
    well: 'Warm, professional opening with a clear purpose for the call.',
    gap: 'Opened without agreeing an agenda or establishing credibility.',
    improve: 'State your name, company and a one-line agenda in the first 30 seconds, then ask for the buyer\'s goals.',
    turn: 0
  },
  2: {
    well: 'Established volumes, materials and the tolerances that matter most.',
    gap: 'Did not pin down volumes, materials or critical tolerances.',
    improve: 'Ask for volume, material and tolerance requirements before proposing anything.',
    turn: 2
  },
  3: {
    well: 'Open, probing questions uncovered the problems behind the project.',
    gap: 'Mostly closed questions, so the real driver behind the project stayed hidden.',
    improve: 'Use open questions such as "What happens when a part fails inspection?" and follow each answer with a why.',
    turn: 4
  },
  4: {
    well: 'Acknowledged the buyer\'s concern before answering it.',
    gap: 'Moved to a solution before acknowledging the buyer\'s concern.',
    improve: 'Paraphrase the concern in one sentence before you respond.',
    turn: 6
  },
  5: {
    well: 'Showed command of tolerances, capacity and inspection requirements.',
    gap: 'Answers on tolerances and inspection were generic.',
    improve: 'Prepare two or three specific technical proof points for the buyer\'s materials and tolerances.',
    turn: 6
  },
  6: {
    well: 'Linked the proposed split delivery directly to the buyer\'s schedule.',
    gap: 'Described capabilities without tying them to this buyer\'s schedule.',
    improve: 'Present the solution as the answer to one stated requirement at a time.',
    turn: 6
  },
  7: {
    well: 'Framed the tooling cost against the buyer\'s first production batch.',
    gap: 'Value was stated as features, not as the buyer\'s outcome.',
    improve: 'Quantify the outcome: scrap avoided, schedule protected or cost per part.',
    turn: 8
  },
  8: {
    well: 'Raised commercial terms and offered a structure that fits the budget.',
    gap: 'Pricing came up late and the response was reactive.',
    improve: 'Raise budget and pricing early so surcharges do not surprise the buyer.',
    turn: 8
  },
  9: {
    well: 'Acknowledged each objection and answered it with a concrete option.',
    gap: 'Objections were acknowledged but left without a firm answer.',
    improve: 'Check each answer with "Does that address your concern?" before moving on.',
    turn: 6
  },
  10: {
    well: 'Calm, confident delivery with credible commitments.',
    gap: 'Hesitant on commitments, which weakened credibility.',
    improve: 'Commit only to what you can deliver, and say exactly when and how.',
    turn: 0
  },
  11: {
    well: 'Ended with a specific next step and a proposed time.',
    gap: 'The call ended without a dated next step.',
    improve: 'Close every call with an agreed action, an owner and a date.',
    turn: 10
  },
  12: {
    well: 'Agreed who sends what and by when.',
    gap: 'Follow-up owners and deadlines were not agreed.',
    improve: 'Repeat the commitments back before hanging up: who, what and by when.',
    turn: 10
  }
};

const trim = (text: string, max = 150) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

export const buildMockAnalysis = (input: MockAnalysisInput): MockAnalysis => {
  const h = hash(input.seed);
  const rep = input.repName || 'The rep';
  const account = input.accountName || 'the customer';
  const buyer = input.buyerName || BUYERS[h % BUYERS.length];
  const material = MATERIALS[h % MATERIALS.length];
  const volume = VOLUMES[(h >> 3) % VOLUMES.length];
  const weeks = WEEKS[(h >> 5) % WEEKS.length];
  const duration = Math.max(600, input.durationSeconds || 1500);

  /* ---- transcript ---- */
  const turns: { role: 'rep' | 'prospect'; text: string }[] = [
    { role: 'rep', text: `Good morning ${buyer}, thank you for making the time. Before we start, I would like to confirm what you want to get out of today's call.` },
    { role: 'prospect', text: `Thanks, ${rep.split(' ')[0]}. We are choosing a supplier for ${account}'s next production run and we need a partner that can hold tight tolerances and delivery dates.` },
    { role: 'rep', text: 'Understood. Could you walk me through the requirements: the volumes, the materials and the tolerances that matter most?' },
    { role: 'prospect', text: `Around ${volume} parts a quarter, mostly ${material}. The tolerances are tight, and a failed inspection stops our line.` },
    { role: 'rep', text: 'That helps. What happened with your current supplier when parts failed inspection or arrived late?' },
    { role: 'prospect', text: `Our schedule slips whenever lead time goes past ${weeks} weeks, and that is our biggest concern with any new supplier.` },
    { role: 'rep', text: 'That is a fair concern. Once the drawings are frozen we can reserve machine capacity and deliver the first batch early. Would a split delivery help your schedule?' },
    { role: 'prospect', text: 'Possibly. But the tooling and setup fees in the quote are above what we budgeted for this project.' },
    { role: 'rep', text: 'I hear you. We can spread the tooling cost across the first production batch, so it does not come out of your prototype budget.' },
    { role: 'prospect', text: 'That could work. I would need our procurement team to review the numbers before I can agree.' },
    { role: 'rep', text: 'Of course. I will send a written summary today and propose a short technical review with your team next week.' },
    { role: 'prospect', text: 'Good. Send it over and I will arrange a time with the team.' }
  ];
  const transcript: TranscriptSnippet[] = turns.map((t, i) => ({
    id: `tr_${input.seed}_${i + 1}`,
    speaker: t.role === 'rep' ? rep : buyer,
    role: t.role,
    timestamp: clock(Math.round(((i + 0.4) / turns.length) * duration)),
    text: t.text
  }));

  /* ---- cue scores: around the call's overall score, adjusted so they add up to it ---- */
  const average = (input.targetPercent ?? 58 + (h % 31)) / 20;
  const scores = SALES_CUES_FRAMEWORK.map(cue =>
    clamp(Math.round(average + ((hash(`${input.seed}:${cue.id}`) % 7) - 3) / 3), 1, 5)
  );
  const desiredSum = Math.round(average * scores.length);
  let sum = scores.reduce((a, b) => a + b, 0);
  for (let step = 0; sum !== desiredSum && step < 200; step++) {
    const i = (step * 5) % scores.length;
    if (sum < desiredSum && scores[i] < 5) { scores[i]++; sum++; }
    else if (sum > desiredSum && scores[i] > 1) { scores[i]--; sum--; }
  }

  const cues: SalesCue[] = SALES_CUES_FRAMEWORK.map((cue, i) => {
    const text = CUE_TEXT[cue.id];
    const score = scores[i];
    return {
      id: cue.id,
      name: cue.name,
      evaluationFocus: cue.evaluationFocus,
      score,
      percentage: score * 20,
      observation: score >= 4
        ? text.well
        : score === 3
          ? `${text.well.replace(/\.$/, '')}, though there is room to be more specific.`
          : text.gap,
      improvement: text.improve,
      evidence: `"${trim(turns[text.turn].text)}"`,
      severity: score >= 4 ? 'positive' : score === 3 ? 'warning' : 'critical',
      isAssessable: true
    };
  });

  const overallScorePercent = input.targetPercent ?? Math.round((sum / (5 * scores.length)) * 100);

  /* ---- objections, tied to the transcript turns that carry them ---- */
  const statuses: MeetingObjection['status'][] = ['Resolved', 'Partially Resolved', 'Unresolved'];
  const objections: MeetingObjection[] = [
    {
      id: `obj_${input.seed}_1`,
      timestamp: transcript[5].timestamp,
      objection: `Our schedule slips whenever lead time goes past ${weeks} weeks.`,
      repResponse: 'Offered to reserve machine capacity after the drawing freeze, with a split delivery.',
      status: statuses[h % 2],
      strongerResponseSuggestion: 'Confirm the delivery dates in writing and name the machine slot before the call ends.'
    },
    {
      id: `obj_${input.seed}_2`,
      timestamp: transcript[7].timestamp,
      objection: 'The tooling and setup fees are above what we budgeted for this project.',
      repResponse: 'Offered to spread the tooling cost across the first production batch.',
      status: statuses[(h >> 2) % 3],
      strongerResponseSuggestion: 'Show the cost per part at production volume, not only the tooling fee.'
    }
  ];

  /* ---- summary and coaching lists, taken from the scores ---- */
  const byScore = [...cues].sort((a, b) => b.score - a.score || a.id - b.id);
  const best = byScore[0];
  const worst = byScore[byScore.length - 1];
  const weak = [...byScore].reverse().slice(0, 3).filter(c => c.score <= 3);

  return {
    overallScorePercent,
    summary:
      `${rep} spoke with ${buyer} at ${account} about their next production run. ` +
      `${best.name} was the strongest area (${best.score}/5) and ${worst.name} needs the most work (${worst.score}/5). ` +
      'The buyer raised two objections, on delivery lead time and on tooling and setup cost.',
    whatWentWell: byScore.slice(0, 3).map(c => CUE_TEXT[c.id].well),
    whereRepStruggled: (weak.length ? weak.slice(0, 2) : [worst]).map(c => CUE_TEXT[c.id].gap),
    whatCouldBeBetter: (weak.length ? weak : [worst]).map(c => CUE_TEXT[c.id].improve),
    recommendedNextSteps: [
      `Send ${buyer} a written summary of the delivery and tooling options today.`,
      `Propose a short technical review with ${account}'s team next week.`,
      `Confirm who else at ${account} signs off on the commercial terms.`
    ],
    cues,
    objections,
    transcript
  };
};

/* ------------------------------------------------------------------ */

const filled = <T,>(list: T[] | undefined) => (list && list.length > 0 ? list : undefined);

/** '24m 12s' or '1h 5m' -> seconds. */
export const durationToSeconds = (duration?: string) => {
  if (!duration) return 0;
  const h = /(\d+)\s*h/.exec(duration)?.[1];
  const m = /(\d+)\s*m/.exec(duration)?.[1];
  const s = /(\d+)\s*s/.exec(duration)?.[1];
  return Number(h || 0) * 3600 + Number(m || 0) * 60 + Number(s || 0);
};

/**
 * Make sure an analysed call has data for every report tab. A call that already has cues keeps
 * everything it has and only gets what is missing. A call without cues is a placeholder, so its
 * summary, lists, objections and transcript are replaced by one consistent analysis.
 * Calls that are still processing, or that failed, are returned as they are.
 */
export const withMockAnalysis = (
  meeting: MeetingRecord,
  extra: { accountName?: string; buyerName?: string } = {}
): MeetingRecord => {
  if (meeting.processingStatus !== 'Analysed') return meeting;

  const hasCues = !!filled(meeting.cues);
  const complete =
    hasCues &&
    !!filled(meeting.objections) &&
    !!filled(meeting.transcript) &&
    !!meeting.summary &&
    !!filled(meeting.whatWentWell) &&
    !!filled(meeting.whereRepStruggled) &&
    !!filled(meeting.whatCouldBeBetter) &&
    !!filled(meeting.recommendedNextSteps) &&
    meeting.overallScorePercent !== undefined;
  if (complete) return meeting;

  const analysis = buildMockAnalysis({
    seed: meeting.id || meeting.name,
    repName: meeting.representativeName,
    accountName: extra.accountName ?? meeting.name.split(' — ')[0].trim(),
    buyerName: extra.buyerName,
    durationSeconds: durationToSeconds(meeting.duration),
    targetPercent: meeting.overallScorePercent
  });

  // Placeholder data is replaced as a whole; real data is only topped up.
  const keep = hasCues;
  return {
    ...meeting,
    overallScorePercent: meeting.overallScorePercent ?? analysis.overallScorePercent,
    cues: filled(meeting.cues) ?? analysis.cues,
    summary: keep && meeting.summary ? meeting.summary : analysis.summary,
    whatWentWell: (keep && filled(meeting.whatWentWell)) || analysis.whatWentWell,
    whereRepStruggled: (keep && filled(meeting.whereRepStruggled)) || analysis.whereRepStruggled,
    whatCouldBeBetter: (keep && filled(meeting.whatCouldBeBetter)) || analysis.whatCouldBeBetter,
    recommendedNextSteps: (keep && filled(meeting.recommendedNextSteps)) || analysis.recommendedNextSteps,
    objections: (keep && filled(meeting.objections)) || analysis.objections,
    transcript: (keep && filled(meeting.transcript)) || analysis.transcript
  };
};
