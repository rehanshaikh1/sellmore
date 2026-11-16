import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { DealRecord, MeetingRecord } from '../../types';
import { LessonBuilderPanel } from '../practice/LessonBuilderPanel';
import { getDealMeetings } from '../../lib/deals';
import { useStore } from '../../store/useStore';

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

/**
 * Coaching for one lead. Lessons are created from the cue gaps across every analysed call on the lead,
 * so they reflect how the rep is doing on this lead overall, not on a single call.
 */
export const LeadCoachingPanel: React.FC<{ deal: DealRecord; rolePrefix: string }> = ({ deal, rolePrefix }) => {
  const { meetings } = useStore();
  const leadCalls = getDealMeetings(deal, meetings);
  const analysed = leadCalls.filter(m => m.processingStatus === 'Analysed');
  const scored = analysed.filter(m => typeof m.overallScorePercent === 'number') as (MeetingRecord & { overallScorePercent: number })[];
  const average = scored.length ? Math.round(scored.reduce((s, m) => s + m.overallScorePercent, 0) / scored.length) : null;
  const unresolved = analysed.flatMap(m => (m.objections || []).filter(o => o.status === 'Unresolved').map(o => ({ m, o })));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {[
          ['Calls analysed', `${analysed.length}/${leadCalls.length}`],
          ['Average score', average !== null ? `${average}%` : '—'],
          ['Unresolved objections', String(unresolved.length)]
        ].map(([label, value]) => (
          <div key={label} className="p-4">
            <FieldLabel>{label}</FieldLabel>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
          </div>
        ))}
      </section>

      {unresolved.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-900"><AlertCircle className="h-4 w-4" /> Objections still open on this lead</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {unresolved.slice(0, 4).map(({ m, o }, i) => (
              <li key={i}>• {o.objection} <Link to={`/${rolePrefix}/meetings/${m.id}`} className="underline">{m.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <LessonBuilderPanel meetings={leadCalls} origin="lead" lead={deal} rolePrefix={rolePrefix} />
      </section>
    </div>
  );
};
