import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DealRecord, LessonSpec, MeetingRecord } from '../../types';
import { cueName } from '../../data/practiceLessons';
import {
  GAP_THRESHOLD, LessonPlan, PlannedLesson, cueAverages, newSpecId, recommendPlans
} from '../../lib/lessonBuilder';
import { CueBadge } from './LiveConversation';

interface Props {
  /** The analysed calls the gaps come from: one call, or every call on a lead. */
  meetings: MeetingRecord[];
  origin: 'meeting' | 'lead';
  meeting?: MeetingRecord;
  lead?: DealRecord;
  rolePrefix: string;
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

/**
 * Lets a user turn what they fell short on into practice lessons, two ways: tick the points
 * themselves, or take an AI-suggested plan that groups the gaps into lessons.
 */
export const LessonBuilderPanel: React.FC<Props> = ({ meetings, origin, meeting, lead, rolePrefix }) => {
  const { practiceLessons, addPracticeLessons, removePracticeLesson, currentUser, currentRole } = useStore();
  const [method, setMethod] = useState<'checklist' | 'ai'>('checklist');
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [planId, setPlanId] = useState<LessonPlan['id']>('focused');
  const [notice, setNotice] = useState('');

  const analysed = meetings.filter(m => m.processingStatus === 'Analysed');
  const averages = useMemo(() => cueAverages(analysed), [analysed]);
  const gaps = averages.filter(c => c.average < GAP_THRESHOLD);
  const listed = showAll ? averages : gaps;
  const plans = useMemo(() => recommendPlans(gaps), [gaps]);
  const plan = plans.find(p => p.id === planId) ?? plans[0];

  const ownerId = lead?.ownerId ?? meeting?.representativeId ?? currentUser.id;
  const mine = practiceLessons.filter(l => origin === 'lead' ? l.leadId === lead?.id : l.meetingId === meeting?.id);

  const context = (cueIds: number[]) => {
    const parts = cueIds.map(id => {
      const g = averages.find(a => a.cueId === id);
      return g ? `${cueName(id)} ${g.average.toFixed(1)}/5` : cueName(id);
    }).join(', ');
    return origin === 'lead'
      ? `Built from ${analysed.length} analysed ${analysed.length === 1 ? 'call' : 'calls'} on ${lead?.name}: ${parts}.`
      : `Built from "${meeting?.name}": ${parts}.`;
  };

  const toSpec = (p: PlannedLesson, method: LessonSpec['method']): LessonSpec => ({
    id: newSpecId(),
    title: origin === 'lead' && lead ? `${lead.companyName}: ${p.title}` : p.title,
    cueIds: p.cueIds,
    origin,
    method,
    meetingId: meeting?.id,
    meetingName: meeting?.name,
    leadId: lead?.id,
    leadName: lead?.name,
    context: context(p.cueIds),
    ownerId,
    assignedByName: currentUser.id !== ownerId && currentRole === 'manager' ? currentUser.name : undefined,
    createdAt: new Date().toISOString().slice(0, 10)
  });

  const createFromChecklist = () => {
    if (picked.length === 0) return;
    const sorted = [...picked].sort((a, b) => a - b);
    const title = sorted.length <= 2 ? sorted.map(cueName).join(' & ') : `${cueName(sorted[0])}, ${cueName(sorted[1])} and ${sorted.length - 2} more`;
    addPracticeLessons([toSpec({ title, cueIds: sorted }, 'checklist')]);
    setPicked([]);
    setNotice('Lesson created from the points you chose.');
  };

  const createFromPlan = () => {
    if (!plan) return;
    addPracticeLessons(plan.lessons.map(l => toSpec(l, 'ai')));
    setPlanned(false);
    setNotice(`${plan.lessons.length} ${plan.lessons.length === 1 ? 'lesson' : 'lessons'} created from the suggested plan.`);
  };

  const toggle = (id: number) => setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  if (analysed.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
        Lessons are built from analysed calls. {origin === 'lead' ? 'Link an analysed call to this lead first.' : 'This call has not been analysed yet.'}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold text-slate-900">
          {origin === 'lead' ? 'Create coaching lessons for this lead' : 'Create practice lessons from this call'}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {origin === 'lead'
            ? `Based on the performance across all ${analysed.length} analysed ${analysed.length === 1 ? 'call' : 'calls'} on this lead, so the lessons target what keeps coming up.${currentRole === 'manager' && lead && lead.ownerId !== currentUser.id ? ` Lessons you create go to ${lead.ownerName}'s Practice & Lessons.` : ''}`
            : 'Based on the cues that scored low in this call.'}
          {' '}A cue below {GAP_THRESHOLD}/5 counts as a gap.
        </p>
      </div>

      {/* Gaps */}
      <div className="rounded-lg border border-slate-200">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
          <FieldLabel>{showAll ? 'All cues' : `Where you fell short · ${gaps.length} of ${averages.length}`}</FieldLabel>
          <button onClick={() => setShowAll(v => !v)} className="text-xs font-medium text-blue-700 hover:underline">
            {showAll ? 'Show gaps only' : 'Show all cues'}
          </button>
        </div>
        {listed.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No cue scored below {GAP_THRESHOLD}/5. Use "Show all cues" to practise one anyway.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {listed.map(g => (
              <li key={g.cueId} className="flex items-center gap-3 px-4 py-2.5">
                {method === 'checklist' && (
                  <input
                    type="checkbox"
                    checked={picked.includes(g.cueId)}
                    onChange={() => toggle(g.cueId)}
                    aria-label={`Include ${g.name}`}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <CueBadge cueId={g.cueId} tone={g.average < GAP_THRESHOLD ? 'miss' : 'pass'} />
                </div>
                <div className="w-28 shrink-0">
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${g.average < GAP_THRESHOLD ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${(g.average / 5) * 100}%` }} />
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">{g.average.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Two ways to create */}
      <div>
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-semibold">
          {([['checklist', 'Choose the points'], ['ai', 'AI-recommended plan']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setNotice(''); }}
              className={`rounded px-3 py-1.5 ${method === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {id === 'ai' && <Sparkles className="mr-1 inline h-3 w-3" />}{label}
            </button>
          ))}
        </div>

        {method === 'checklist' ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Tick the points above that you want to practise, then create one lesson.</p>
            <button
              onClick={createFromChecklist}
              disabled={picked.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Create lesson{picked.length ? ` from ${picked.length} ${picked.length === 1 ? 'point' : 'points'}` : ''}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {gaps.length === 0 ? (
              <p className="text-xs text-slate-500">There are no gaps to plan around.</p>
            ) : !planned ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {gaps.length} of {averages.length} cues are low. The plan groups them into lessons, keeping related cues together.
                </p>
                <button onClick={() => setPlanned(true)} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                  <Sparkles className="h-3.5 w-3.5" /> Suggest a lesson plan
                </button>
              </div>
            ) : (
              <>
                {plans.length > 1 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {plans.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPlanId(p.id)}
                        className={`rounded-lg border p-3 text-left ${plan?.id === p.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div className="text-[13px] font-semibold text-slate-900">{p.label} <span className="font-normal text-slate-400">· {p.lessons.length}</span></div>
                        <div className="mt-0.5 text-xs text-slate-500">{p.description}</div>
                      </button>
                    ))}
                  </div>
                )}
                {plan && (
                  <ol className="space-y-2">
                    {plan.lessons.map((l, i) => (
                      <li key={i} className="rounded-lg border border-slate-200 p-3">
                        <div className="text-[13px] font-semibold text-slate-900">Lesson {i + 1}: {l.title}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">{l.cueIds.map(id => <CueBadge key={id} cueId={id} />)}</div>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setPlanned(false)} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={createFromPlan} className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                    Create {plan?.lessons.length} {plan?.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {notice && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" /> {notice}{' '}
            <Link to={`/${rolePrefix}/practice`} className="underline">Open Practice & Lessons</Link>
          </p>
        )}
      </div>

      {/* Lessons already created here */}
      {mine.length > 0 && (
        <div>
          <FieldLabel>Lessons created {origin === 'lead' ? 'for this lead' : 'from this call'}</FieldLabel>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {mine.map(l => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-slate-900">{l.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">{l.cueIds.map(id => <CueBadge key={id} cueId={id} />)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link to={`/${rolePrefix}/practice?lesson=${l.id}`} className="text-[13px] font-semibold text-blue-700 hover:underline">Practise →</Link>
                  <button onClick={() => removePracticeLesson(l.id)} aria-label="Delete lesson" className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
