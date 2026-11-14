import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  Clock3, Lightbulb, Lock, MessageSquareText, Play, RotateCcw,
  Target, TrendingUp, Trophy, Users, X
} from 'lucide-react';
import { PRACTICE_LESSONS_CATALOG } from '../../data/mockData';
import { PracticeLessonCatalog } from '../../types';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

type SkillKey = 'discovery' | 'objections' | 'value' | 'listening' | 'closing' | 'clarity';

type LessonContent = {
  skill: SkillKey;
  outcome: string;
  concept: string;
  example: string;
  practice: string[];
  checklist: string[];
  duration: string;
};

const LESSON_CONTENT: Record<string, LessonContent> = {
  lesson_metaphor: {
    skill: 'value',
    outcome: 'Explain a product benefit in language a buyer cares about.',
    concept: 'Connect a feature to a business outcome. Avoid technical detail until you understand what matters to the buyer.',
    example: 'Instead of “Our platform has automated call analysis,” try “Your managers can identify coaching opportunities without listening to every call.”',
    practice: [
      'A prospect says, “We already have a CRM. Why would we need this?” Explain the value without listing features.',
      'A sales manager says, “My team does not have time for another tool.” Connect the product to a measurable workflow improvement.',
      'The buyer asks, “How is this different from call recording?” Explain the difference in plain business language.'
    ],
    checklist: ['Lead with the buyer’s outcome', 'Use one clear example', 'Avoid unnecessary jargon', 'Check that the benefit matters to this buyer'],
    duration: '8–10 min'
  },
  lesson_yarn: {
    skill: 'discovery',
    outcome: 'Tell a concise customer story that makes a business problem relatable.',
    concept: 'A useful sales story has context, a challenge, an action, and an outcome. Keep the customer problem at the centre.',
    example: '“A team was reviewing calls only when a deal was lost. They introduced a regular coaching rhythm, so managers could address missed discovery questions earlier.”',
    practice: [
      'Describe a customer who struggled to coach a growing sales team. Keep the story under one minute.',
      'Explain how a team moved from reactive call reviews to consistent coaching.',
      'Tell a short story that helps a buyer understand why rep practice matters before an important sales call.'
    ],
    checklist: ['Set the context quickly', 'Make the challenge specific', 'Explain the action taken', 'State a credible outcome without exaggeration'],
    duration: '8–10 min'
  },
  lesson_filler: {
    skill: 'clarity',
    outcome: 'Deliver a clear, confident answer without rushing or over-explaining.',
    concept: 'Pause before answering. Use a simple structure: acknowledge, answer, support with one reason, then check understanding.',
    example: '“That’s a fair concern. The goal is not to add another admin task. Reps practise in short sessions, and managers can focus coaching where it is needed. Would that fit your current workflow?”',
    practice: [
      'Answer: “I’m not sure my reps will actually use this.”',
      'Explain the value of a short practice session to a time-poor sales manager.',
      'Respond to: “Can you give me the short version?” in no more than three sentences.'
    ],
    checklist: ['Pause and answer the question directly', 'Keep to one main point', 'Use short, natural sentences', 'End with a relevant check-in question'],
    duration: '6–8 min'
  },
  lesson_story: {
    skill: 'objections',
    outcome: 'Respond to resistance with curiosity instead of immediately defending the product.',
    concept: 'Do not treat an objection as a rejection. Acknowledge it, clarify what is behind it, respond to the real concern, and agree on a next step.',
    example: '“That makes sense. When you say the team is already busy, is the bigger concern the time required to practise or getting reps to adopt a new process?”',
    practice: [
      'Buyer: “We already have sales training.” Respond without criticising their current programme.',
      'Buyer: “This is too expensive.” Acknowledge the concern and ask a useful follow-up question.',
      'Buyer: “Send me information and I’ll review it later.” Explore what information would help them make a decision.'
    ],
    checklist: ['Acknowledge without arguing', 'Ask one clarifying question', 'Respond to the underlying concern', 'Agree on a specific next step'],
    duration: '10–12 min'
  }
};

const SKILL_META: Record<SkillKey, { label: string; description: string; color: string }> = {
  discovery: { label: 'Discovery', description: 'Ask better questions and uncover business needs.', color: 'blue' },
  objections: { label: 'Objection handling', description: 'Respond calmly and move conversations forward.', color: 'amber' },
  value: { label: 'Value communication', description: 'Connect product capabilities to buyer outcomes.', color: 'violet' },
  listening: { label: 'Active listening', description: 'Understand the buyer before presenting a solution.', color: 'emerald' },
  closing: { label: 'Next-step commitment', description: 'Turn a good conversation into a clear action.', color: 'rose' },
  clarity: { label: 'Clear communication', description: 'Be concise, structured, and confident.', color: 'cyan' }
};

const FALLBACK_CONTENT: LessonContent = {
  skill: 'discovery',
  outcome: 'Practise a useful sales conversation skill.',
  concept: 'Understand the buyer’s situation before recommending a solution. Ask open questions and listen for the business impact.',
  example: '“Could you walk me through how your team handles this today, and where the process becomes difficult?”',
  practice: [
    'A prospect is interested but has not explained their current process. Start a discovery conversation.',
    'The buyer gives a vague answer. Ask a follow-up question to understand the impact.',
    'Summarise what you heard and confirm whether you understood the buyer correctly.'
  ],
  checklist: ['Ask an open-ended question', 'Explore the business impact', 'Avoid jumping into a product pitch', 'Summarise and confirm what you heard'],
  duration: '8–10 min'
};

export const PracticePage: React.FC = () => {
  const { currentPlan } = useStore();
  const isFree = currentPlan === 'free';
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<PracticeLessonCatalog>(PRACTICE_LESSONS_CATALOG[0]);
  const [activeLesson, setActiveLesson] = useState<PracticeLessonCatalog | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const content = useMemo(
    () => activeLesson ? (LESSON_CONTENT[activeLesson.id] || FALLBACK_CONTENT) : FALLBACK_CONTENT,
    [activeLesson]
  );

  const startLesson = (lesson: PracticeLessonCatalog) => {
    if (isFree) {
      setUpgradeModalOpen(true);
      return;
    }
    setSelectedLesson(lesson);
    setActiveLesson(lesson);
    setStepIndex(0);
    setResponse('');
    setCheckedItems([]);
    setShowExample(false);
    setShowChecklist(false);
    setShowCompletion(false);
  };

  const resetStep = () => {
    setResponse('');
    setCheckedItems([]);
    setShowExample(false);
    setShowChecklist(false);
  };

  const finishLesson = () => {
    if (activeLesson && !completedLessons.includes(activeLesson.id)) {
      setCompletedLessons(prev => [...prev, activeLesson.id]);
    }
    setShowCompletion(true);
  };

  const nextStep = () => {
    if (stepIndex < content.practice.length - 1) {
      setStepIndex(prev => prev + 1);
      resetStep();
    } else {
      finishLesson();
    }
  };

  const toggleChecklist = (item: string) => {
    setCheckedItems(prev => prev.includes(item) ? prev.filter(value => value !== item) : [...prev, item]);
  };

  const closeLesson = () => {
    setActiveLesson(null);
    setShowCompletion(false);
  };

  const skillCount = completedLessons.length;
  const progressPercent = Math.round((skillCount / Math.max(PRACTICE_LESSONS_CATALOG.length, 1)) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {!activeLesson && !showCompletion && (
        <>
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">SellMore Academy</span>
                <span className="text-xs text-slate-400">Rep development</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Practice & Lessons</h1>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Lessons completed</p>
                <p className="text-lg font-bold leading-tight text-slate-900">{skillCount}<span className="text-sm font-medium text-slate-400"> / {PRACTICE_LESSONS_CATALOG.length}</span></p>
              </div>
            </div>
          </header>

          {isFree && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-amber-700" />
                <div><p className="font-semibold text-amber-900">Practice lessons are part of the Growth experience</p><p className="mt-0.5 text-xs text-amber-800">Upgrade to unlock guided lessons and sales scenario practice.</p></div>
              </div>
              <button onClick={() => setUpgradeModalOpen(true)} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">Explore plans</button>
            </div>
          )}

          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl bg-slate-900 p-6 text-white sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Your training path</span>
                  <h2 className="mt-2 text-xl font-bold">From product knowledge to confident conversations</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Learn a technique, practise it against a buyer situation, and reflect on what to improve before your next real call.</p>
                </div>
                <div className="hidden rounded-xl bg-white/10 p-3 text-blue-200 sm:block"><Target className="h-6 w-6" /></div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">Learning path progress</span><span className="font-semibold text-white">{progressPercent}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${progressPercent}%` }} /></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Short lessons</span>
                <span className="flex items-center gap-1.5"><MessageSquareText className="h-3.5 w-3.5" /> Buyer scenarios</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Self-review</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-slate-700"><Users className="h-4 w-4" /><h3 className="text-sm font-bold">The SellMore practice loop</h3></div>
              <ol className="mt-5 space-y-4">
                {[
                  ['01', 'Learn', 'Understand one sales technique.'],
                  ['02', 'Practise', 'Apply it to a realistic buyer situation.'],
                  ['03', 'Review', 'Check your response against the coaching points.'],
                  ['04', 'Repeat', 'Build consistency across conversations.']
                ].map(([number, title, description]) => (
                  <li key={number} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-700">{number}</span>
                    <div><p className="text-xs font-bold text-slate-800">{title}</p><p className="mt-0.5 text-xs text-slate-500">{description}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div><h2 className="text-lg font-bold text-slate-900">Sales skill lessons</h2><p className="mt-1 text-xs text-slate-500">Choose a skill to learn and practise. Complete lessons in any order.</p></div>
              <span className="text-xs text-slate-400">{PRACTICE_LESSONS_CATALOG.length} lessons available</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {PRACTICE_LESSONS_CATALOG.map((lesson, index) => {
                const lessonContent = LESSON_CONTENT[lesson.id] || FALLBACK_CONTENT;
                const meta = SKILL_META[lessonContent.skill];
                const done = completedLessons.includes(lesson.id);
                return (
                  <article key={lesson.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5" /></div>
                      {done ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"><Check className="h-3 w-3" /> Completed</span> : <span className="text-[10px] font-semibold text-slate-400">LESSON {index + 1}</span>}
                    </div>
                    <div className="mt-4 flex-1">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{meta.label}</span>
                      <h3 className="mt-3 text-base font-bold text-slate-900">{lesson.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{lessonContent.outcome}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{lessonContent.duration}</span>
                      <span>{lesson.level}</span>
                    </div>
                    <button onClick={() => startLesson(lesson)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">
                      {done ? 'Practise again' : 'Start lesson'} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /><h3 className="text-sm font-bold text-slate-900">A useful habit between calls</h3></div>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Pick one skill before your next customer conversation. Practise one scenario, then use that technique on the call. The goal is consistent improvement—not memorising a script.</p>
          </section>
        </>
      )}

      {activeLesson && !showCompletion && (
        <section className="mx-auto max-w-4xl space-y-5">
          <button onClick={closeLesson} className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to lessons</button>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">SellMore lesson · {SKILL_META[content.skill].label}</span><h1 className="mt-1 text-xl font-bold text-slate-900">{activeLesson.title}</h1><p className="mt-1 text-xs text-slate-500">{content.outcome}</p></div>
              <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Practice {stepIndex + 1} of {content.practice.length}</span>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((stepIndex + 1) / content.practice.length) * 100}%` }} /></div>
          </div>

          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center gap-2 text-blue-800"><Lightbulb className="h-4 w-4" /><h2 className="text-sm font-bold">Learn the technique</h2></div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{content.concept}</p>
                <button onClick={() => setShowExample(prev => !prev)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900">{showExample ? 'Hide example' : 'Show a sales example'} <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showExample ? 'rotate-90' : ''}`} /></button>
                {showExample && <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-xs leading-5 text-slate-700">{content.example}</div>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-bold text-slate-900">What good looks like</h3>
                <p className="mt-1 text-[11px] text-slate-500">Use these points to review your response.</p>
                <button onClick={() => setShowChecklist(prev => !prev)} className="mt-3 text-xs font-semibold text-blue-700">{showChecklist ? 'Hide coaching checklist' : 'View coaching checklist'}</button>
                {showChecklist && <ul className="mt-3 space-y-2">{content.checklist.map(item => <li key={item} className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{item}</li>)}</ul>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-bold text-slate-900">Your practice scenario</h2></div><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Buyer situation</span></div>
              <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Prospect says</p>
                <p className="mt-2 text-sm leading-6">{content.practice[stepIndex]}</p>
              </div>
              <label className="mt-5 block text-xs font-bold text-slate-800" htmlFor="practice-response">How would you respond?</label>
              <p className="mt-1 text-[11px] text-slate-500">Write your response or say it aloud first, then note the key points you would use.</p>
              <textarea id="practice-response" value={response} onChange={event => setResponse(event.target.value)} rows={6} placeholder="Start with how you would respond to the buyer..." className="mt-3 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-800">Self-review</p>
                <p className="mt-1 text-[11px] text-slate-500">Tick the points you included in your response.</p>
                <div className="mt-3 space-y-2">
                  {content.checklist.map(item => (
                    <label key={item} className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={checkedItems.includes(item)} onChange={() => toggleChecklist(item)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
                <button onClick={resetStep} className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"><RotateCcw className="h-3.5 w-3.5" /> Reset response</button>
                <button onClick={nextStep} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700">{stepIndex === content.practice.length - 1 ? 'Complete lesson' : 'Next practice'} <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeLesson && showCompletion && (
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Trophy className="h-7 w-7" /></div>
          <span className="mt-5 inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-700">Lesson completed</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Good work. Keep building the habit.</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">You finished the practice scenarios for <strong className="text-slate-700">{activeLesson.title}</strong>. Review your notes and apply one improvement in your next customer conversation.</p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-bold text-slate-800">Your reflection</p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{response.trim() || 'No written response saved for the final scenario.'}</p>
            <p className="mt-3 text-[11px] text-slate-500">{checkedItems.length} of {content.checklist.length} coaching points selected in the final practice.</p>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => startLesson(activeLesson)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Practise again</button>
            <button onClick={closeLesson} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Back to learning path <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      )}

      <PlanUpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} featureTitle="Practice & Lessons" featureDescription="Guided sales lessons and buyer scenario practice are available on Growth and Enterprise plans." />
    </div>
  );
};
