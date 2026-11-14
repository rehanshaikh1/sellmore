/**
 * Typing practice for deal coaching. The rep reads a situation, types what they would say, and
 * the reply is checked against six things a strong answer to a buyer usually has. This is a
 * rule-based check, not a language model: it looks for the behaviours, so it is a prompt to
 * improve the answer rather than a grade.
 */

export const PRACTICE_PASS_SCORE = 70;

export interface PracticeCheck {
  id: string;
  label: string;
  passed: boolean;
  /** What to do when the check is not met. */
  tip: string;
}

export interface PracticeResult {
  /** 0 to 100: the share of checks that passed. */
  score: number;
  words: number;
  checks: PracticeCheck[];
}

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const evaluatePracticeResponse = (response: string): PracticeResult => {
  const text = response.trim();
  const lower = text.toLowerCase();
  const words = wordCount(text);

  const checks: PracticeCheck[] = [
    {
      id: 'acknowledge',
      label: 'Acknowledges the concern',
      passed: /understand|fair|hear you|appreciate|makes sense|good point|i see|that is a concern|that's a concern|thank you for/.test(lower),
      tip: 'Start by acknowledging the buyer\'s concern in one sentence before you answer it.'
    },
    {
      id: 'question',
      label: 'Asks a question',
      passed: text.includes('?'),
      tip: 'Ask one open question to check the concern and keep the buyer talking.'
    },
    {
      id: 'concrete',
      label: 'Offers something concrete',
      passed: /\d|for example|such as|we can |we could |option|propose|offer|guarantee|split|spread|reserve|in writing|written/.test(lower),
      tip: 'Offer a specific option, number or example instead of a general promise.'
    },
    {
      id: 'outcome',
      label: 'Ties it to the buyer\'s outcome',
      passed: /schedule|deadline|budget|cost|scrap|risk|quality|delivery|timeline|saving|save|value|capacity|yield/.test(lower),
      tip: 'Link your answer to what the buyer cares about: schedule, cost, quality or risk.'
    },
    {
      id: 'next',
      label: 'Proposes a next step',
      passed: /next step|follow up|follow-up|send you|i will send|i'll send|schedule|book |propose a|set up|confirm by|by (monday|tuesday|wednesday|thursday|friday)|this week|tomorrow|next week/.test(lower),
      tip: 'Close with a next step, who does it, and a date.'
    },
    {
      id: 'length',
      label: 'Clear and concise (25 to 120 words)',
      passed: words >= 25 && words <= 120,
      tip: words < 25 ? 'Say a little more: aim for 25 words or more.' : 'Tighten it: aim for 120 words or fewer.'
    }
  ];

  return {
    score: Math.round((checks.filter(c => c.passed).length / checks.length) * 100),
    words,
    checks
  };
};

/** The standard instruction for every lesson's practice. The practice lives in the lesson, not in another module. */
export const PRACTICE_INSTRUCTION = 'Write your reply to the situation below, then check it against the criteria.';

/**
 * The situation a lesson asks the rep to reply to. Lessons carry their own; older saved lessons
 * get one worked out from their title.
 */
export const practiceScenarioFor = (
  lesson: { title: string; practiceScenario?: string },
  dealName: string
): string => {
  if (lesson.practiceScenario) return lesson.practiceScenario;
  const objection = /^Handle the objection:\s*(.+)$/i.exec(lesson.title);
  if (objection) return `The buyer says: "${objection[1]}"`;
  return `You are on a call about ${dealName}. Write what you would say to address this: ${lesson.title}`;
};
