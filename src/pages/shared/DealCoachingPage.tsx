import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { getDealMeetings, isClosedStage } from '../../lib/deals';
import {
  PRACTICE_INSTRUCTION,
  PRACTICE_PASS_SCORE,
  evaluatePracticeResponse,
  practiceScenarioFor,
  wordCount
} from '../../lib/coachingPractice';

/* ------------------------------------------------------------------ */
/* building blocks                                                     */
/* ------------------------------------------------------------------ */

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

const Panel: React.FC<{ title?: string; aside?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, aside, className = '', children }) => (
  <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
    {title && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {aside}
      </header>
    )}
    {children}
  </section>
);

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="px-6 py-5">
    <FieldLabel>{label}</FieldLabel>
    <div className="mt-2">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export const DealCoachingPage: React.FC = () => {
  const {
    coachingPrograms,
    generateCoachingProgram,
    refreshCoachingProgram,
    toggleLessonCompleted,
    addManagerFeedback,
    addPracticeAttempt,
    currentRole,
    deals: allDeals,
    meetings
  } = useStore();
  const { scope } = useAccess();
  const [searchParams] = useSearchParams();

  // Coaching follows the deal, and a deal follows its owning rep: rep = own, manager = assigned reps, admin = all.
  const deals = scope(allDeals, (d: any) => d.ownerId).filter((d: any) => !isClosedStage(d.stage));

  const requestedDealId = searchParams.get('deal') || '';
  const firstWithProgram = deals.find((d: any) => coachingPrograms[d.id]);
  const [selectedDealId, setSelectedDealId] = useState<string>(
    deals.find((d: any) => d.id === requestedDealId)?.id || firstWithProgram?.id || deals[0]?.id || ''
  );
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copiedTrack, setCopiedTrack] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const canGiveFeedback = currentRole === 'manager' || currentRole === 'client_admin';
  const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';

  const selectedDeal = deals.find((d: any) => d.id === selectedDealId);
  const program = selectedDeal ? coachingPrograms[selectedDeal.id] : undefined;
  const lessons = program?.lessons ?? [];
  const lessonIndex = Math.max(0, lessons.findIndex(l => l.id === selectedLessonId));
  const lesson = lessons[lessonIndex];

  // Typing practice for the selected lesson.
  const attempts = lesson?.practiceAttempts ?? [];
  const latestAttempt = attempts[attempts.length - 1];
  const latestResult = latestAttempt ? evaluatePracticeResponse(latestAttempt.response) : null;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => a.score)) : null;
  const draft = lesson ? drafts[lesson.id] ?? '' : '';
  const scenario = lesson ? practiceScenarioFor(lesson, selectedDeal?.name ?? 'this deal') : '';

  const analysedCalls = selectedDeal
    ? getDealMeetings(selectedDeal, meetings).filter(m => m.processingStatus === 'Analysed')
    : [];
  const knownCalls = new Set(program?.sourceMeetingIds ?? []);
  const newCalls = program ? analysedCalls.filter(m => !knownCalls.has(m.id)) : [];
  const completedCount = lessons.filter(l => l.completed).length;

  const chooseDeal = (id: string) => {
    setSelectedDealId(id);
    setSelectedLessonId('');
    setFeedbackInput('');
    setNotice(null);
  };

  const chooseLesson = (id: string) => {
    setSelectedLessonId(id);
    setFeedbackInput('');
  };

  const handleBuild = () => {
    if (!selectedDeal) return;
    const result = generateCoachingProgram(selectedDeal.id);
    setNotice(result.success ? null : { tone: 'error', text: result.error || 'Could not build coaching for this deal.' });
  };

  const handleRefresh = () => {
    if (!selectedDeal) return;
    const result = refreshCoachingProgram(selectedDeal.id);
    if (!result.success) {
      setNotice({ tone: 'error', text: result.error || 'Could not update coaching.' });
      return;
    }
    setNotice({
      tone: 'ok',
      text: result.added
        ? `Added ${result.added} lesson${result.added === 1 ? '' : 's'} from the new calls.`
        : 'The new calls had nothing new to coach on.'
    });
  };

  const checkPractice = () => {
    if (!selectedDeal || !lesson || wordCount(draft) < 5) return;
    const result = evaluatePracticeResponse(draft);
    addPracticeAttempt(selectedDeal.id, lesson.id, draft.trim(), result.score);
  };

  const handleFeedback = () => {
    if (!selectedDeal || !lesson || !feedbackInput.trim()) return;
    addManagerFeedback(selectedDeal.id, lesson.id, feedbackInput.trim());
    setFeedbackInput('');
  };

  const copyTrack = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTrack(index);
    window.setTimeout(() => setCopiedTrack(null), 1800);
  };

  if (deals.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-lg font-semibold text-slate-900">No deals to coach on yet</h1>
        <p className="mt-1 text-sm text-slate-500">
          {currentRole === 'sales_rep'
            ? 'Deal coaching is built from the calls on your Salesforce deals. None of your deals are synced yet.'
            : currentRole === 'manager'
              ? 'None of your assigned sales representatives has a deal yet. Ask your Client Admin if representatives still need to be assigned to you.'
              : 'No deals are synced from Salesforce yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* Title */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deal coaching</div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">Coaching plan</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Lessons built from the calls on each deal. Work through them, practise your replies in writing and get feedback before the next conversation.
          </p>
        </div>
        {selectedDeal && (
          <Link
            to={`/${rolePrefix}/deals/${selectedDeal.id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Open deal workspace <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>

      {/* Deal selector */}
      <Panel className="mt-6">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-md">
            <label htmlFor="coaching-deal" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Deal</label>
            <select
              id="coaching-deal"
              value={selectedDealId}
              onChange={e => chooseDeal(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-hidden"
            >
              {deals.map((deal: any) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}{coachingPrograms[deal.id] ? '' : ' (no coaching yet)'}
                </option>
              ))}
            </select>
          </div>
          {selectedDeal && (
            <dl className="flex flex-wrap gap-x-7 gap-y-2 text-[13px]">
              {[
                ['Stage', selectedDeal.stage],
                ['Owner', selectedDeal.ownerName],
                ['Value', selectedDeal.amount ? `$${Number(selectedDeal.amount).toLocaleString()}` : '—'],
                ['Analysed calls', String(analysedCalls.length)]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Panel>

      {notice && (
        <div className={`mt-4 rounded-md border px-4 py-3 text-[13px] ${
          notice.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
        }`}>
          {notice.text}
        </div>
      )}

      {/* No programme yet */}
      {selectedDeal && !program && (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="text-sm font-semibold text-slate-900">No coaching plan for this deal yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {analysedCalls.length > 0
              ? `A plan is built from the ${analysedCalls.length} analysed call${analysedCalls.length === 1 ? '' : 's'} on this deal: where the rep struggled and the objections that were not resolved.`
              : 'A plan is built from analysed calls, and this deal has none yet. Import or link a call, then come back.'}
          </p>
          <button
            onClick={handleBuild}
            disabled={analysedCalls.length === 0}
            className="mt-5 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Build coaching plan
          </button>
        </section>
      )}

      {selectedDeal && program && lesson && (
        <>
          {/* Summary strip */}
          <section className="mt-6 grid grid-cols-2 divide-slate-200 rounded-lg border border-slate-200 bg-white md:grid-cols-4 md:divide-x">
            <div className="p-5">
              <FieldLabel>Progress</FieldLabel>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
                {program.progressPercentage}<span className="text-lg text-slate-400">%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${program.progressPercentage}%` }} />
              </div>
            </div>
            <div className="p-5">
              <FieldLabel>Lessons completed</FieldLabel>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{completedCount}/{lessons.length}</div>
              <div className="mt-3 text-xs text-slate-500">{program.status}</div>
            </div>
            <div className="border-t border-slate-200 p-5 md:border-t-0">
              <FieldLabel>Coaching for</FieldLabel>
              <div className="mt-2 truncate text-lg font-semibold text-slate-900">{program.representativeName}</div>
              <div className="mt-3 text-xs text-slate-500">Deal owner</div>
            </div>
            <div className="border-t border-slate-200 p-5 md:border-t-0">
              <FieldLabel>Last updated</FieldLabel>
              <div className="mt-2 text-lg font-semibold tabular-nums text-slate-900">{program.updatedAt}</div>
              <div className="mt-3 text-xs text-slate-500">
                Built from {program.sourceMeetingIds?.length ?? 0} call{(program.sourceMeetingIds?.length ?? 0) === 1 ? '' : 's'}
              </div>
            </div>
          </section>

          {/* New calls since the plan was built */}
          {newCalls.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-slate-700">
                <strong className="font-semibold text-slate-900">{newCalls.length} new analysed call{newCalls.length === 1 ? '' : 's'}</strong> on this deal since the plan was built.
              </p>
              <button
                onClick={handleRefresh}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-3.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Add lessons from new calls
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Lesson list */}
            <Panel title="Lessons" className="h-fit lg:col-span-1">
              <ol className="divide-y divide-slate-100">
                {lessons.map((item, index) => {
                  const active = item.id === lesson.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => chooseLesson(item.id)}
                        className={`flex w-full items-start gap-3 border-l-2 px-5 py-3.5 text-left transition-colors ${
                          active ? 'border-blue-600 bg-blue-50/40' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                          item.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : active ? 'border-blue-600 text-blue-700' : 'border-slate-300 text-slate-500'
                        }`}>
                          {item.completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-[13px] leading-5 ${active ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {item.completed ? 'Completed' : 'Not completed'}
                            {item.managerFeedback ? ' · Feedback' : ''}
                            {item.practiceAttempts?.length ? ` · Practised, best ${Math.max(...item.practiceAttempts.map(a => a.score))}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Panel>

            {/* Lesson, practice and feedback are three separate sections */}
            <div className="space-y-6 lg:col-span-2">
              <Panel>
              <header className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Lesson {lessonIndex + 1} of {lessons.length}
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">{lesson.title}</h2>
                </div>
                <button
                  onClick={() => toggleLessonCompleted(selectedDeal.id, lesson.id)}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${
                    lesson.completed
                      ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {lesson.completed && <Check className="h-3.5 w-3.5" />}
                  {lesson.completed ? 'Completed' : 'Mark as complete'}
                </button>
              </header>

                <div className="divide-y divide-slate-100">
                <Section label="Objective">
                  <p className="text-sm leading-6 text-slate-700">{lesson.objective}</p>
                </Section>

                <Section label="Why it matters for this deal">
                  <p className="text-sm leading-6 text-slate-700">{lesson.relevanceToDeal}</p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    Evidence:{' '}
                    {lesson.evidenceMeetingId ? (
                      <Link
                        to={`/${rolePrefix}/meetings/${lesson.evidenceMeetingId}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {lesson.evidenceSourceCall}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-700">{lesson.evidenceSourceCall}</span>
                    )}
                  </p>
                </Section>

                <Section label="Guidance">
                  <p className="text-sm leading-6 text-slate-700">{lesson.tailoredExplanation}</p>
                </Section>

                <Section label="Recommended talk track">
                  <ul className="space-y-2.5">
                    {lesson.recommendedTalkTrack.map((track, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <p className="flex-1 text-[13px] italic leading-6 text-slate-800">{track}</p>
                        <button
                          onClick={() => copyTrack(track, i)}
                          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
                          title="Copy talk track"
                        >
                          {copiedTrack === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedTrack === i ? 'Copied' : 'Copy'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
                </div>
              </Panel>

              <Panel
                title="Practice"
                aside={attempts.length ? <span className="text-xs tabular-nums text-slate-500">Attempt {attempts.length} · Best {bestScore}</span> : undefined}
              >
                <div className="px-6 py-5">
                  <p className="text-sm leading-6 text-slate-700">{PRACTICE_INSTRUCTION}</p>

                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <FieldLabel>Situation</FieldLabel>
                    <p className="mt-1 text-sm leading-6 text-slate-800">{scenario}</p>
                  </div>

                  <label htmlFor="practice-reply" className="sr-only">Your reply</label>
                  <textarea
                    id="practice-reply"
                    value={draft}
                    onChange={e => setDrafts(prev => ({ ...prev, [lesson.id]: e.target.value }))}
                    rows={5}
                    placeholder="Type what you would say to the buyer"
                    className="mt-3 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-900 focus:border-slate-500 focus:outline-hidden"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs tabular-nums text-slate-400">{wordCount(draft)} words</span>
                    <button
                      onClick={checkPractice}
                      disabled={wordCount(draft) < 5}
                      className="rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Check my response
                    </button>
                  </div>

                  {latestResult && latestAttempt && (
                    <div className="mt-4 rounded-md border border-slate-200 bg-white" aria-live="polite">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-semibold tabular-nums text-slate-900">{latestResult.score}</span>
                          <span className="text-sm text-slate-400">/ 100</span>
                          <span className="ml-2 text-[13px] font-medium text-slate-600">Your last reply</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Attempt {attempts.length} · Best {bestScore}
                        </div>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {latestResult.checks.map(check => (
                          <li key={check.id} className="flex items-start gap-3 px-4 py-2.5">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              check.passed ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-slate-400'
                            }`}>
                              {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-slate-900">{check.label}</div>
                              {!check.passed && <div className="text-xs text-slate-500">{check.tip}</div>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-[13px] text-slate-600">
                        {latestResult.score >= PRACTICE_PASS_SCORE
                          ? (lesson.completed ? 'Strong reply. This lesson is complete.' : 'Strong reply. You can mark this lesson as complete.')
                          : 'Revise your reply using the tips above, then check it again. The recommended talk track above shows one strong answer.'}
                      </div>
                    </div>
                  )}

                  {attempts.length > 1 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Earlier scores: {attempts.slice(0, -1).map(a => a.score).join(', ')}
                    </p>
                  )}

                  <p className="mt-3 text-[13px] text-slate-500">
                    <span className="font-medium text-slate-600">Expected outcome:</span> {lesson.expectedOutcome}
                  </p>
                </div>
              </Panel>

              <Panel>
                <div className="divide-y divide-slate-100">
                <Section label="Manager feedback">
                  {lesson.managerFeedback ? (
                    <figure className="rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3">
                      <blockquote className="text-sm leading-6 text-slate-800">{lesson.managerFeedback}</blockquote>
                      <figcaption className="mt-2 text-xs text-slate-500">
                        {lesson.managerFeedbackBy ?? 'Manager'}
                        {lesson.managerFeedbackAt ? `, ${lesson.managerFeedbackAt}` : ''}
                      </figcaption>
                    </figure>
                  ) : (
                    <p className="text-sm text-slate-400">
                      {canGiveFeedback ? 'No feedback on this lesson yet.' : 'Your manager has not left feedback on this lesson yet.'}
                    </p>
                  )}

                  {canGiveFeedback && (
                    <div className="mt-3">
                      <textarea
                        value={feedbackInput}
                        onChange={e => setFeedbackInput(e.target.value)}
                        rows={3}
                        placeholder={`Feedback for ${program.representativeName} on this lesson`}
                        className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-hidden"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={handleFeedback}
                          disabled={!feedbackInput.trim()}
                          className="rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {lesson.managerFeedback ? 'Replace feedback' : 'Save feedback'}
                        </button>
                      </div>
                    </div>
                  )}
                </Section>
                </div>

              <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5">
                <button
                  onClick={() => chooseLesson(lessons[lessonIndex - 1].id)}
                  disabled={lessonIndex === 0}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => chooseLesson(lessons[lessonIndex + 1].id)}
                  disabled={lessonIndex === lessons.length - 1}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </footer>
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
