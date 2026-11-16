import { PracticeCheck, PracticeLesson } from '../data/practiceLessons';

/**
 * Live correction for practice conversations. Every reply, typed or spoken, is:
 *   1. cleaned up (filler words, repeats, capitals, punctuation), as a speech-to-text tool would;
 *   2. checked against the lesson's checks, each of which belongs to one sales cue;
 *   3. corrected: a sentence is added for every check the reply missed.
 * It is rule-based, so it is a prompt to improve the reply rather than a grade.
 */

export const fillName = (text: string, repFirstName: string) => text.replace(/\{rep\}/g, repFirstName);

const FILLERS = /\b(?:um+|uh+|er+|erm|you know|i mean)\b,?\s*/gi;
const QUESTION_START = /\b(?:can i ask|could i ask|may i ask|what|how|why|which|where|when|do you|did you|are you|would you|could you|can you)\b/i;

const capitalise = (text: string) =>
  text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());

export interface CleanedTranscript {
  cleaned: string;
  changes: string[];
}

/** What a speech-to-text tool does to a spoken reply. Typed replies go through it too. */
export const cleanTranscript = (raw: string): CleanedTranscript => {
  const changes: string[] = [];
  let text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return { cleaned: '', changes };

  const withoutFillers = text.replace(FILLERS, '').replace(/\s+/g, ' ').trim();
  if (withoutFillers !== text) {
    changes.push('Removed filler words');
    text = withoutFillers;
  }

  const withoutRepeats = text.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
  if (withoutRepeats !== text) {
    changes.push('Removed repeated words');
    text = withoutRepeats;
  }

  const before = text;
  text = capitalise(text.replace(/\bi\b/g, 'I'))
    .replace(/\b(daniel|brooks|brightline|apex precision)\b/gi, m => m.replace(/\b\w/g, c => c.toUpperCase()))
    .replace(/^(Hi|Hello|Hey) (Daniel)\b(?!,)/, '$1 $2,');
  if (!/[.!?]$/.test(text)) {
    // Spoken text has no punctuation: a final clause that is a question gets a question mark.
    const tail = text.split(' ').slice(-10).join(' ');
    text += QUESTION_START.test(tail) ? '?' : '.';
  }
  if (text !== before) changes.push('Fixed capitalisation and punctuation');

  return { cleaned: text, changes };
};

export interface CheckResult {
  check: PracticeCheck;
  passed: boolean;
}

/** The checks that apply to one turn of a lesson. */
export const checksForTurn = (lesson: PracticeLesson, turnIndex: number): PracticeCheck[] => {
  const focus = lesson.turns[turnIndex]?.focus;
  return focus ? lesson.checks.filter(c => focus.includes(c.id)) : lesson.checks;
};

export const evaluateChecks = (text: string, checks: PracticeCheck[]): CheckResult[] => {
  const lower = text.toLowerCase();
  return checks.map(check => ({ check, passed: text.trim() ? check.test(lower) : false }));
};

export interface CorrectionSegment {
  text: string;
  /** True for a sentence the correction added. */
  added: boolean;
}

export interface Correction {
  original: string;
  cleaned: string;
  /** What the clean-up changed. */
  changes: string[];
  results: CheckResult[];
  /** 0 to 100: the share of checks the cleaned reply passed. */
  score: number;
  /** The cleaned reply with a sentence added for each missed check. */
  segments: CorrectionSegment[];
  corrected: string;
  addedCount: number;
}

export const correctReply = (raw: string, lesson: PracticeLesson, repFirstName: string, turnIndex: number): Correction => {
  const { cleaned, changes } = cleanTranscript(raw);
  const results = evaluateChecks(cleaned, checksForTurn(lesson, turnIndex));
  const missing = results.filter(r => !r.passed && r.check.fix);

  const toSegment = (r: CheckResult): CorrectionSegment => ({ text: fillName(r.check.fix, repFirstName), added: true });
  const segments: CorrectionSegment[] = [
    ...missing.filter(r => r.check.position === 'start').map(toSegment),
    { text: cleaned, added: false },
    ...missing.filter(r => r.check.position !== 'start').map(toSegment)
  ];

  return {
    original: raw,
    cleaned,
    changes,
    results,
    score: Math.round((results.filter(r => r.passed).length / Math.max(results.length, 1)) * 100),
    segments,
    corrected: segments.map(s => s.text).join(' '),
    addedCount: missing.length
  };
};

/** Each covered cue scored 0 to 5 from the share of its checks that passed across the conversation. */
export const cueScoresFromCorrections = (lesson: PracticeLesson, corrections: Correction[]): Record<number, number> => {
  const scores: Record<number, number> = {};
  lesson.cueIds.forEach(cueId => {
    let passed = 0;
    let total = 0;
    corrections.forEach(c => c.results.forEach(r => {
      if (r.check.cueId !== cueId) return;
      total += 1;
      if (r.passed) passed += 1;
    }));
    scores[cueId] = total ? Math.round((passed / total) * 5) : 0;
  });
  return scores;
};
