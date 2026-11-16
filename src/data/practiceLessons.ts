import { SALES_CUES_FRAMEWORK } from './cueFramework';

/**
 * Practice & Lessons. Each lesson is built on sales cues, grouped by cue category, and is practised
 * as a live conversation with an AI buyer. Every rep reply is checked against the lesson's checks,
 * and each check belongs to one cue, so the lesson shows which cues it covers and how the rep did on them.
 *
 * `{rep}` in any text is replaced with the rep's first name when the conversation runs.
 */

export interface PracticeCheck {
  id: string;
  /** The sales cue this check coaches. */
  cueId: number;
  label: string;
  /** What to do when the check is not met. */
  tip: string;
  /** The sentence added to the reply when the check is not met. Empty when it cannot be added. */
  fix: string;
  /** Where the added sentence goes. */
  position: 'start' | 'end';
  /** Receives the reply in lower case. */
  test: (lower: string) => boolean;
}

export interface PracticeTurn {
  /** What the AI buyer says to start this turn. */
  buyer: string;
  /** What a rep might say out loud for this turn: unpunctuated, with fillers. Used by the speech demo. */
  spoken: string;
  /** A strong reply to this turn. */
  model: string;
  /** Ids of the checks that apply to this turn. Every check applies when this is left out. */
  focus?: string[];
}

export interface PracticeLesson {
  id: string;
  title: string;
  /** The cue category the lesson belongs to. */
  group: string;
  cueIds: number[];
  level: 'Foundational' | 'Advanced' | 'Mastery' | 'Targeted';
  duration: string;
  outcome: string;
  concept: string;
  example: string;
  checks: PracticeCheck[];
  turns: PracticeTurn[];
  /** The buyer's last line, after the final reply. */
  closing: string;
}

export const CUE_GROUPS = [
  'Communication',
  'Discovery',
  'Technical Evaluation',
  'Solution & Value',
  'Commercial',
  'Closing & Follow-up'
] as const;

export const cueName = (id: number) => SALES_CUES_FRAMEWORK.find(c => c.id === id)?.name ?? `Cue ${id}`;
export const cueFocus = (id: number) => SALES_CUES_FRAMEWORK.find(c => c.id === id)?.evaluationFocus ?? '';

const make = (
  id: string,
  cueId: number,
  label: string,
  test: (lower: string) => boolean,
  tip: string,
  fix: string,
  position: 'start' | 'end' = 'end'
): PracticeCheck => ({ id, cueId, label, test, tip, fix, position });

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/* ---------- checks shared across lessons ---------- */

const ACKNOWLEDGE = (cueId: number) => make(
  'acknowledge', cueId, 'Acknowledges the concern',
  t => /understand|fair|hear you|appreciate|makes sense|good point|i see|i get that|thank you for/.test(t),
  'Acknowledge the buyer\'s concern in one sentence before you answer it.',
  'I understand the concern.',
  'start'
);

const CONCISE = (cueId: number) => make(
  'concise', cueId, 'Clear and concise (25 to 120 words)',
  t => words(t) >= 25 && words(t) <= 120,
  'Aim for 25 to 120 words: enough to be useful, short enough to stay clear.',
  ''
);

const OPEN_QUESTION = (cueId: number, fix: string) => make(
  'question', cueId, 'Asks an open question',
  t => t.includes('?') && /\b(what|how|why|which|where|walk me|tell me|share)\b/.test(t),
  'Ask an open question that starts with what, how or why.',
  fix
);

const CONCRETE = (cueId: number) => make(
  'concrete', cueId, 'Offers something concrete',
  t => /\d|for example|such as|we can |we could |option|propose|offer|split|spread|reserve|in writing|written/.test(t),
  'Offer a specific option, number or example instead of a general promise.',
  'For example, we can split the delivery so the first batch ships early.'
);

const OUTCOME = (cueId: number) => make(
  'outcome', cueId, 'Ties it to the buyer\'s outcome',
  t => /schedule|deadline|budget|cost|scrap|risk|quality|delivery|timeline|saving|value|capacity|yield/.test(t),
  'Link your answer to what the buyer cares about: schedule, cost, quality or risk.',
  'That protects your schedule and reduces the risk of scrap.'
);

/* ---------- lessons ---------- */

export const PRACTICE_LESSONS: PracticeLesson[] = [
  {
    id: 'open-with-confidence',
    title: 'Open with confidence',
    group: 'Communication',
    cueIds: [1, 4, 10],
    level: 'Foundational',
    duration: '8 to 10 min',
    outcome: 'Start a call with a clear purpose, acknowledge what the buyer says, and answer concisely.',
    concept: 'Introduce yourself and the purpose in one breath, acknowledge the buyer\'s concern before you answer it, and keep each reply short enough to stay clear.',
    example: '"Hello Daniel, this is Sam from Apex Precision. I am calling about your upcoming machining work. Do you have two minutes?"',
    checks: [
      make('intro', 1, 'Introduces you and the purpose',
        t => /(my name|this is|i am|i'm)/.test(t) && /(today|agenda|purpose|reason|call|meeting|discuss|cover|talk about)/.test(t),
        'Say who you are, your company and why you are calling.',
        'This is {rep} from Apex Precision, and I am calling about your machining work today.',
        'start'),
      ACKNOWLEDGE(4),
      CONCISE(10)
    ],
    turns: [
      {
        buyer: 'Hello, this is Daniel Brooks at Brightline Aerospace. Who am I speaking with, and what is this about?',
        spoken: 'um hi daniel this is {rep} from apex precision uh thanks for taking my call I wanted to talk to you about your upcoming machining work today',
        model: 'Hello Daniel, this is {rep} from Apex Precision. Thank you for taking my call. I am calling about your upcoming machining work. Do you have two minutes so I can explain why, and then you can tell me whether it is relevant?',
        focus: ['intro', 'concise']
      },
      {
        buyer: 'We already work with two machining suppliers. Why should I give you my time?',
        spoken: 'yeah so we mostly help teams when their five axis titanium work gets hard to schedule or the tolerances are really tight and um that is where we come in',
        model: 'I understand, and I am not asking you to replace anyone. We help aerospace teams when five axis titanium work becomes hard to schedule or the tolerances get tight. How are your current suppliers handling that today?',
        focus: ['acknowledge', 'concise']
      },
      {
        buyer: 'Delivery has been our biggest problem lately. Why would you be any different?',
        spoken: 'um that is a fair concern honestly late parts are the number one complaint we hear so before I say anything about us can I ask what usually causes the delays for you',
        model: 'That is a fair concern, and late parts are the most common complaint we hear. Before I say anything about us, where do delays usually start for you: capacity, material or quality approval?',
        focus: ['acknowledge', 'concise']
      }
    ],
    closing: 'Mostly capacity and quality approval. Okay, you have my attention. Go ahead.'
  },
  {
    id: 'discover-the-real-need',
    title: 'Discover the real need',
    group: 'Discovery',
    cueIds: [2, 3],
    level: 'Foundational',
    duration: '8 to 10 min',
    outcome: 'Ask open questions that uncover requirements, and explore why they matter.',
    concept: 'Understand the project before you pitch it: the material, the volume, the tolerances and the timeline. Then ask what happens when things go wrong, because that is where the real need sits.',
    example: '"Could you walk me through the bracket program: the material, the yearly volume and the tolerances that matter most? And what happens to your line if a batch arrives late?"',
    checks: [
      make('requirements', 2, 'Asks about volume, material, tolerances or timeline',
        t => /volume|quantity|per quarter|a quarter|a year|per year|material|titanium|aluminium|steel|inconel|tolerance|timeline|drawing|spec|requirement|lead time|certif/.test(t),
        'Ask about the requirements: material, volume, tolerances and timeline.',
        'Could you share the volumes, materials and tolerances involved?'),
      OPEN_QUESTION(3, 'What matters most to your team on this program?'),
      make('impact', 3, 'Explores why it matters',
        t => /what happens|impact|why|how does that affect|what would it mean|consequence|cost of|what did it cost/.test(t),
        'Ask what happens when it goes wrong, to understand the impact.',
        'What happens to your schedule when that goes wrong?')
    ],
    turns: [
      {
        buyer: 'We are looking at a new supplier for a bracket program. What do you need to know from me?',
        spoken: 'um so tell me about the bracket program what is it made of and how many do you need',
        model: 'Thanks. Could you walk me through the bracket program: the material, the yearly volume and the tolerances that matter most? And what happens to your line if a batch arrives late?'
      },
      {
        buyer: 'Titanium, around 500 a quarter, and tight tolerances. Honestly, the last supplier let us down.',
        spoken: 'okay five hundred a quarter in titanium got it um what happened with the last supplier',
        model: 'Understood: roughly 500 titanium parts a quarter with tight tolerances. What exactly went wrong with the last supplier, and what did it cost you in schedule or scrap?'
      },
      {
        buyer: 'Parts failed inspection twice and we lost three weeks. We cannot afford that again.',
        spoken: 'that sounds really painful um so inspection is the big thing for you',
        model: 'That sounds costly. When you say parts failed inspection, which characteristics failed, and what did it cost you in lost weeks?'
      }
    ],
    closing: 'Bore concentricity, mostly. We check it on a CMM after machining.'
  },
  {
    id: 'show-technical-command',
    title: 'Show technical command',
    group: 'Technical Evaluation',
    cueIds: [5],
    level: 'Advanced',
    duration: '8 to 10 min',
    outcome: 'Answer technical challenges with specific capability and evidence, not promises.',
    concept: 'Buyers test whether you really understand the work. Name the specific capability, then back it with a number or a standard they can check.',
    example: '"Yes. We hold ±0.005 mm on titanium bores on our 5-axis cells and verify every part on a CMM, under AS9100D."',
    checks: [
      make('capability', 5, 'Names a specific capability or process',
        t => /tolerance|5-axis|five.?axis|titanium|cmm|inspection|gd&t|machining|fixture|first.?article|surface finish|tooling/.test(t),
        'Name the specific capability: the machine, process or inspection method.',
        'We hold the tolerance on 5-axis machines and inspect every part on a CMM.'),
      make('evidence', 5, 'Backs it with a number or a standard',
        t => /\d|iso|as9100|gd&t|±/.test(t),
        'Add a number or a standard the buyer can check, such as a tolerance or AS9100D.',
        'We work to AS9100D and supply a full GD&T inspection report.'),
      CONCISE(5)
    ],
    turns: [
      {
        buyer: 'Can you actually hold ±0.005 mm on a titanium bore, or is that a sales promise?',
        spoken: 'yes we can hold that um we run five axis machines and we inspect every part on the cmm',
        model: 'Yes. We hold ±0.005 mm on titanium bores on our 5-axis cells and verify every part on a CMM with a full GD&T report, under AS9100D. Would a sample inspection report help?'
      },
      {
        buyer: 'What about tool chatter on the thin walls?',
        spoken: 'we use dedicated fixtures and we adjust the cutting parameters so chatter is not really an issue for us',
        model: 'We use dedicated fixtures and tune the cutting parameters for thin walls, and we have held 0.8 mm walls at ±0.01 mm. I can show you the first-article data from a similar part.'
      },
      {
        buyer: 'How do you prove first-article quality before full production?',
        spoken: 'um we do a first article inspection and send you the report before we start the production run',
        model: 'We machine a first article, inspect it on the CMM against your drawing, and send you the full report before any production starts. For a similar bracket that took 5 working days.'
      }
    ],
    closing: 'Good. A sample report would help me take this to my engineers.'
  },
  {
    id: 'present-value-not-features',
    title: 'Present value, not features',
    group: 'Solution & Value',
    cueIds: [6, 7],
    level: 'Advanced',
    duration: '8 to 10 min',
    outcome: 'Tie your solution to what the buyer said they need, and state the outcome they get.',
    concept: 'Start from the buyer\'s own words, offer one concrete option, then say what it means for them in schedule, cost or risk.',
    example: '"Since you need ten prototypes in three weeks, we can reserve a weekend cell and ship the first batch early, which protects your flight test date."',
    checks: [
      make('link', 6, 'Ties the solution to what the buyer said',
        t => /you (said|mentioned|need|told)|your (schedule|requirement|deadline|line|program|test)|because you|since you/.test(t),
        'Start from what the buyer told you, for example "Since you need…".',
        'Since you need this on your schedule, here is what we can do.',
        'start'),
      { ...CONCRETE(6) },
      OUTCOME(7)
    ],
    turns: [
      {
        buyer: 'We need ten prototypes in three weeks for a flight test. What can you do?',
        spoken: 'um we can reserve a machine for the weekend and ship the first batch early',
        model: 'Since you need ten prototypes in three weeks, we can reserve a weekend cell and ship the first batch early. That protects your delivery schedule for the flight test.'
      },
      {
        buyer: 'Our budget is tight. Why is your tooling more expensive than a standard setup?',
        spoken: 'it is a dedicated fixture so the parts come out right the first time',
        model: 'Because you cannot afford a failed batch, we use a dedicated fixture. It costs more up front, but it avoids scrap and rework, which is cheaper over the first 100 parts.'
      },
      {
        buyer: 'Okay. What does that mean for our total cost?',
        spoken: 'um it should work out cheaper overall because you scrap less',
        model: 'On your 100-part batch, spreading the tooling gives about $85 a part, and a single scrapped titanium blank costs around $4,200. So it lowers your total cost and your schedule risk.'
      }
    ],
    closing: 'That makes the numbers easier to defend. Send me the breakdown.'
  },
  {
    id: 'handle-price-and-pushback',
    title: 'Handle price and pushback',
    group: 'Commercial',
    cueIds: [8, 9],
    level: 'Mastery',
    duration: '10 to 12 min',
    outcome: 'Respond to price and objections with curiosity, then a concrete option.',
    concept: 'Do not defend. Acknowledge the objection, ask what is behind it, address price or terms directly, and offer a concrete way forward.',
    example: '"That makes sense. Is the concern the total cost or the upfront tooling fee? We can spread the tooling over the first batch."',
    checks: [
      make('commercial', 8, 'Addresses price, budget or terms directly',
        t => /budget|price|pricing|cost|quote|terms|payment|volume|surcharge|discount|fee/.test(t),
        'Talk about the price, budget or terms directly instead of avoiding them.',
        'On price, I can walk you through the cost per part at your volume.'),
      ACKNOWLEDGE(9),
      make('behind', 9, 'Asks what is behind the objection',
        t => t.includes('?'),
        'Ask a question to find out what is behind the objection.',
        'Is the main concern the total cost or the upfront tooling fee?'),
      { ...CONCRETE(9) }
    ],
    turns: [
      {
        buyer: 'Your tooling fee is $8,500. That is above our prototype budget.',
        spoken: 'um we need the fixture to hold the tolerance so it is not something we can really drop',
        model: 'I understand, the fee is above what you planned. Is the concern the total cost or the upfront tooling fee? We can spread the $8,500 across the first 100 parts, about $85 a part.'
      },
      {
        buyer: 'Another supplier quoted us 15% less.',
        spoken: 'yeah well they might not include inspection or the first article report which we do',
        model: 'That is fair, and I would compare them line by line. What does their quote include for inspection and the first-article report? We include both, so we can put a side-by-side comparison in writing.'
      },
      {
        buyer: 'I cannot approve this without a discount.',
        spoken: 'um I cannot really go lower on the price but we could look at the payment terms',
        model: 'I hear you. Rather than lower the price, we could offer a split delivery with staged payment terms. Would a 30% deposit and the balance on delivery fit your budget?'
      }
    ],
    closing: 'Staged payments might work. Put it in writing and I will take it to finance.'
  },
  {
    id: 'close-with-a-commitment',
    title: 'Close with a commitment',
    group: 'Closing & Follow-up',
    cueIds: [11, 12],
    level: 'Mastery',
    duration: '8 to 10 min',
    outcome: 'End every call with a next step, a date and a clear owner.',
    concept: 'A good call ends with an agreed action. Name the next step, give a date, and say who does what.',
    example: '"As a next step I will send the written summary by Friday. Could you confirm who on your team will review it?"',
    checks: [
      make('next-step', 11, 'Proposes a next step',
        t => /next step|follow up|follow-up|send you|i will send|i'll send|schedule|book|propose|set up|arrange|call/.test(t),
        'Propose a specific next step.',
        'As a next step, I will send you a written summary.'),
      make('date', 11, 'Gives a date or timeframe',
        t => /monday|tuesday|wednesday|thursday|friday|today|tomorrow|this week|next week|within \d|by (end|the end)/.test(t),
        'Give a date or timeframe, such as "by Friday".',
        'I will send it by Friday.'),
      make('owner', 12, 'Says who does what',
        t => /i will|i'll|we will|you will|your team|could you|can you/.test(t),
        'Say who does what: what you will do and what the buyer will do.',
        'Could you confirm who on your team will review it?')
    ],
    turns: [
      {
        buyer: 'This all sounds reasonable. Where do we go from here?',
        spoken: 'um great so I could send you a summary of what we discussed',
        model: 'Thank you. As a next step, I will send you a written summary and the delivery options by tomorrow. Could you confirm who on your team will review it?'
      },
      {
        buyer: 'I will need our procurement team to see the numbers.',
        spoken: 'sure that makes sense so we can set up a call with them',
        model: 'That makes sense. I will send the cost breakdown to your procurement team by Wednesday, and propose a 30-minute call next week. Who should I include?'
      },
      {
        buyer: 'Fine. Can you recap what we agreed?',
        spoken: 'okay so um I will send the summary and you will let me know who reviews it',
        model: 'Of course. I will send the summary and cost breakdown by Wednesday, you will confirm the reviewer from procurement by Thursday, and we will hold a review call next Tuesday.'
      }
    ],
    closing: 'Good, that is clear. Talk Tuesday.'
  }
];
