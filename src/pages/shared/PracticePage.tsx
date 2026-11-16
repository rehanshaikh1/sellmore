import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, Lock, Mic, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';
import { CueBadge, LiveConversation, LiveResult } from '../../components/practice/LiveConversation';
import { PracticeLesson, cueFocus } from '../../data/practiceLessons';
import { buildLesson } from '../../lib/lessonBuilder';
import { useAccess } from '../../store/useAccess';
import { cueScoresFromCorrections, fillName } from '../../lib/practiceCorrection';

const STORAGE_KEY = 'sellmore-practice';

interface LessonProgress {
  attempts: number;
  best: number;
  cueScores: Record<number, number>;
}

type Progress = Record<string, LessonProgress>;

const loadProgress = (): Progress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProgress = (p: Progress) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

type View = { kind: 'list' } | { kind: 'brief'; lesson: PracticeLesson } | { kind: 'live'; lesson: PracticeLesson } | { kind: 'summary'; lesson: PracticeLesson; result: LiveResult };

export const PracticePage: React.FC = () => {
  const { currentPlan, currentUser, currentRole, practiceLessons, removePracticeLesson } = useStore();
  const { scope } = useAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';
  const isFree = currentPlan === 'free';
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [runKey, setRunKey] = useState(0);
  const repName = currentUser?.name ?? 'Sam';
  const repFirst = repName.split(' ')[0];

  // Lessons are not pre-made: each one was created from a meeting or a lead, and is built into a conversation here.
  const specs = scope(practiceLessons, l => l.ownerId);
  const lessons = useMemo(() => specs.map(spec => ({ spec, lesson: buildLesson(spec) })), [specs]);

  const practisedCues = useMemo(() => {
    const set = new Set<number>();
    lessons.forEach(({ lesson }) => { if (progress[lesson.id]) lesson.cueIds.forEach(id => set.add(id)); });
    return set;
  }, [progress, lessons]);
  const completed = lessons.filter(({ lesson }) => progress[lesson.id]).length;
  const allScores = lessons.map(({ lesson }) => progress[lesson.id]?.best).filter((v): v is number => typeof v === 'number');
  const average = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  // A link such as /practice?lesson=ID opens that lesson's brief.
  const wanted = searchParams.get('lesson');
  useEffect(() => {
    if (!wanted) return;
    const found = lessons.find(l => l.lesson.id === wanted);
    if (found && !isFree) setView({ kind: 'brief', lesson: found.lesson });
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const open = (lesson: PracticeLesson) => {
    if (isFree) { setUpgradeOpen(true); return; }
    setView({ kind: 'brief', lesson });
  };

  const start = (lesson: PracticeLesson) => { setRunKey(k => k + 1); setView({ kind: 'live', lesson }); };

  const finish = (lesson: PracticeLesson, result: LiveResult) => {
    const overall = Math.round(result.corrections.reduce((s, c) => s + c.score, 0) / Math.max(result.corrections.length, 1));
    const prev = progress[lesson.id];
    const next: Progress = {
      ...progress,
      [lesson.id]: {
        attempts: (prev?.attempts ?? 0) + 1,
        best: Math.max(prev?.best ?? 0, overall),
        cueScores: cueScoresFromCorrections(lesson, result.corrections)
      }
    };
    setProgress(next);
    saveProgress(next);
    setView({ kind: 'summary', lesson, result });
  };

  const modal = (
    <PlanUpgradeModal
      isOpen={upgradeOpen}
      onClose={() => setUpgradeOpen(false)}
      featureTitle="Practice & Lessons"
      featureDescription="Live buyer conversations and cue-based lessons are available on Growth and Enterprise plans."
    />
  );

  /* ---------------- live ---------------- */
  if (view.kind === 'live') {
    return (
      <div className="mx-auto max-w-6xl pb-8">
        <LiveConversation
          key={runKey}
          lesson={view.lesson}
          repName={repName}
          onExit={() => setView({ kind: 'brief', lesson: view.lesson })}
          onFinish={result => finish(view.lesson, result)}
        />
        {modal}
      </div>
    );
  }

  /* ---------------- brief ---------------- */
  if (view.kind === 'brief') {
    const l = view.lesson;
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <button onClick={() => setView({ kind: 'list' })} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> All lessons
        </button>
        <header className="border-b border-slate-200 pb-5">
          <FieldLabel>{l.group} · {l.level} · {l.duration}</FieldLabel>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{l.title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{l.outcome}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div>
              <FieldLabel>The technique</FieldLabel>
              <p className="mt-2 text-sm leading-6 text-slate-700">{l.concept}</p>
            </div>
            <div>
              <FieldLabel>Example</FieldLabel>
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-[13px] leading-6 text-slate-700">{fillName(l.example, repFirst)}</p>
            </div>
            <div>
              <FieldLabel>How the practice works</FieldLabel>
              <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                <li>You talk with Daniel Brooks, an AI buyer, for {l.turns.length} turns.</li>
                <li>Type your reply, or press Speak to try the demo voice input. Both show as live transcripts.</li>
                <li>After each reply it is cleaned up and corrected, with the cue behind every missed point.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <FieldLabel>Cues covered</FieldLabel>
              <ul className="mt-3 space-y-3">
                {l.cueIds.map(id => (
                  <li key={id}>
                    <CueBadge cueId={id} />
                    <p className="mt-1 text-xs leading-5 text-slate-500">{cueFocus(id)}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <FieldLabel>What is checked</FieldLabel>
              <ul className="mt-3 space-y-2">
                {l.checks.map(c => (
                  <li key={c.id} className="text-[13px] text-slate-700">{c.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button onClick={() => start(l)} className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700">
            Start live practice <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {modal}
      </div>
    );
  }

  /* ---------------- summary ---------------- */
  if (view.kind === 'summary') {
    const l = view.lesson;
    const cs = view.result.corrections;
    const overall = Math.round(cs.reduce((s, c) => s + c.score, 0) / Math.max(cs.length, 1));
    const scores = cueScoresFromCorrections(l, cs);
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <header className="border-b border-slate-200 pb-5">
          <FieldLabel>Practice complete · {l.title}</FieldLabel>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums text-slate-900">{overall}</span>
            <span className="text-sm text-slate-500">score across {cs.length} replies</span>
          </div>
        </header>

        <section>
          <FieldLabel>Cue results</FieldLabel>
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {l.cueIds.map(id => (
              <li key={id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <CueBadge cueId={id} tone={scores[id] >= 4 ? 'pass' : scores[id] >= 2 ? 'neutral' : 'miss'} />
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{scores[id]}<span className="font-normal text-slate-400">/5</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <FieldLabel>By turn</FieldLabel>
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {cs.map((c, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-900">Turn {i + 1}</span>
                  <span className="tabular-nums text-slate-600">{c.score}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.results.filter(r => !r.passed).length === 0
                    ? 'Every check met.'
                    : `Missed: ${c.results.filter(r => !r.passed).map(r => r.check.label.toLowerCase()).join(', ')}.`}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
          <button onClick={() => start(l)} className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Practise again
          </button>
          <button onClick={() => setView({ kind: 'list' })} className="flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
            Back to lessons <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {modal}
      </div>
    );
  }

  /* ---------------- list ---------------- */
  const sections: [string, typeof lessons][] = [
    ['From leads', lessons.filter(l => l.spec.origin === 'lead')],
    ['From meetings', lessons.filter(l => l.spec.origin === 'meeting')]
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Practice & Lessons</h1>
          <p className="mt-1 text-sm text-slate-600">Lessons you create from the gaps in your calls, practised as live conversations with an AI buyer.</p>
        </div>
        <dl className="flex divide-x divide-slate-200 rounded-lg border border-slate-200">
          {[
            ['Lessons practised', `${completed}/${lessons.length}`],
            ['Cues practised', `${practisedCues.size}/12`],
            ['Average score', average !== null ? String(average) : '—']
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {isFree && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900">Practice lessons are part of the Growth experience</p>
              <p className="mt-0.5 text-xs text-amber-800">Upgrade to unlock live buyer practice.</p>
            </div>
          </div>
          <button onClick={() => setUpgradeOpen(true)} className="rounded-md bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700">Explore plans</button>
        </div>
      )}

      {lessons.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <h2 className="text-[15px] font-semibold text-slate-900">No lessons yet</h2>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-slate-500">
            Lessons are not pre-made. Open an analysed meeting and go to <strong>Improvement areas</strong>, or open a lead and go to
            <strong> Coaching</strong>. Tick the points you fell short on, or let SellMore suggest a lesson plan.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to={`/${rolePrefix}/meetings`} className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">Open meetings</Link>
            <Link to={`/${rolePrefix}/leads`} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Open leads</Link>
          </div>
        </section>
      ) : (
        <>
          <section>
            <FieldLabel>Cue coverage</FieldLabel>
            <p className="mt-1 text-xs text-slate-500">A cue fills in once you have practised a lesson that covers it.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(id => (
                <CueBadge key={id} cueId={id} tone={practisedCues.has(id) ? 'pass' : 'neutral'} />
              ))}
            </div>
          </section>

          {sections.map(([label, items]) => items.length > 0 && (
            <section key={label}>
              <h2 className="text-[13px] font-semibold text-slate-900">{label}</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {items.map(({ spec, lesson: l }) => {
                  const p = progress[l.id];
                  return (
                    <article key={l.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[15px] font-semibold text-slate-900">{l.title}</h3>
                        {p && <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Best {p.best}</span>}
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{spec.context}</p>
                      {spec.assignedByName && <p className="mt-1 text-xs font-medium text-blue-700">Assigned by {spec.assignedByName}</p>}
                      <div className="mt-3">
                        <FieldLabel>Cues covered</FieldLabel>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {l.cueIds.map(id => <CueBadge key={id} cueId={id} tone={p && p.cueScores[id] >= 4 ? 'pass' : 'neutral'} />)}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                        <span className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{l.duration}</span>
                          <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" />Live</span>
                          <span>{spec.method === 'ai' ? 'AI plan' : 'Chosen points'}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <button onClick={() => removePracticeLesson(spec.id)} aria-label="Delete lesson" className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                          <button onClick={() => open(l)} className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                            {p ? 'Practise again' : 'Start lesson'}
                          </button>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
      {modal}
    </div>
  );
};
