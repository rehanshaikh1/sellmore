import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TeamMember } from '../../types';
import { getRepCoaching, getRepStats } from '../../lib/repCoaching';
import { isClosedStage } from '../../lib/deals';

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

/**
 * A side panel with one rep's details for their manager: calls analysed with scores, where they are
 * strong and weak across those calls, and their deals with the state of their coaching.
 */
export const RepDetailsDrawer: React.FC<{ rep: TeamMember; onClose: () => void }> = ({ rep, onClose }) => {
  const { meetings, deals, practiceLessons, crmConnected } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { repMeetings, analysedCount, averageScore, strongest, weakest } = getRepStats(rep.id, meetings);
  const { repDeals } = getRepCoaching(rep.id, deals, practiceLessons, meetings);
  const openDeals = repDeals.filter(d => !isClosedStage(d.stage));
  const pipeline = openDeals.reduce((sum, d) => sum + d.amount, 0);
  const initials = rep.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const dealName = (id?: string) => deals.find(d => d.id === id)?.name;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${rep.name} details`}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">{initials}</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{rep.name}</h2>
              <p className="text-[13px] text-slate-500">{rep.email}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {rep.status === 'active' ? 'Active seat' : 'Invitation pending'} · Joined {rep.dateJoined}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* Summary */}
          <section className="grid grid-cols-2 divide-slate-200 rounded-lg border border-slate-200 sm:grid-cols-4 sm:divide-x">
            {[
              ['Calls analysed', String(analysedCount), `${repMeetings.length} recorded`],
              ['Average score', averageScore !== null ? `${averageScore}%` : '—', 'Across analysed calls'],
              ['Open leads', String(openDeals.length), `$${Math.round(pipeline / 1000)}k pipeline`],
              ['Coaching lessons', String(practiceLessons.filter(l => repDeals.some(d => d.id === l.leadId)).length), `on ${repDeals.length} leads`]
            ].map(([label, value, hint], i) => (
              <div key={label} className={`p-4 ${i >= 2 ? 'border-t border-slate-200 sm:border-t-0' : ''}`}>
                <FieldLabel>{label}</FieldLabel>
                <div className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
                <div className="mt-0.5 text-xs text-slate-400">{hint}</div>
              </div>
            ))}
          </section>

          {/* Strong and weak cues */}
          {strongest.length > 0 && (
            <section>
              <h3 className="text-[13px] font-semibold text-slate-900">Strengths and gaps</h3>
              <p className="mt-0.5 text-xs text-slate-500">Average cue score across this rep's analysed calls.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {[
                  ['Strongest', strongest, 'bg-emerald-600'],
                  ['Needs work', weakest, 'bg-amber-500']
                ].map(([label, list, bar]) => (
                  <div key={label as string} className="rounded-lg border border-slate-200 p-4">
                    <FieldLabel>{label as string}</FieldLabel>
                    <ul className="mt-2.5 space-y-2.5">
                      {(list as typeof strongest).map(c => (
                        <li key={c.id}>
                          <div className="flex items-center justify-between gap-3 text-[13px]">
                            <span className="truncate text-slate-800">{c.name}</span>
                            <span className="shrink-0 font-semibold tabular-nums text-slate-900">{c.average.toFixed(1)}/5</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${bar as string}`} style={{ width: `${(c.average / 5) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Meetings */}
          <section>
            <h3 className="text-[13px] font-semibold text-slate-900">Meetings</h3>
            {repMeetings.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No meetings recorded for {rep.name.split(' ')[0]} yet.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 pl-4 pr-3 font-semibold">Meeting</th>
                      <th className="px-3 py-2.5 font-semibold">Date</th>
                      <th className="px-3 py-2.5 font-semibold">Score</th>
                      <th className="py-2.5 pl-3 pr-4 font-semibold">Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {repMeetings.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pl-4 pr-3 align-top">
                          {m.processingStatus === 'Analysed' ? (
                            <Link to={`/manager/meetings/${m.id}`} className="text-[13px] font-medium text-slate-900 hover:text-blue-700 hover:underline">
                              {m.name}
                            </Link>
                          ) : (
                            <span className="text-[13px] font-medium text-slate-900">{m.name}</span>
                          )}
                          <div className="text-xs text-slate-400">{m.duration}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top text-[13px] text-slate-600">{m.uploadDate}</td>
                        <td className="whitespace-nowrap px-3 py-3 align-top text-[13px] tabular-nums">
                          {m.processingStatus === 'Analysed' && typeof m.overallScorePercent === 'number'
                            ? <span className="font-semibold text-slate-900">{m.overallScorePercent}%</span>
                            : <span className="text-xs text-slate-400">{m.processingStatus}</span>}
                        </td>
                        <td className="py-3 pl-3 pr-4 align-top text-[13px] text-slate-600">
                          {dealName(m.associatedDealId) ?? <span className="text-slate-400">No lead linked</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Deals and coaching */}
          <section>
            <h3 className="text-[13px] font-semibold text-slate-900">Leads and coaching</h3>
            {repDeals.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                {crmConnected ? `${rep.name.split(' ')[0]} has no leads yet.` : 'Connect Salesforce to see leads.'}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {repDeals.map(d => {
                  const lessonCount = practiceLessons.filter(l => l.leadId === d.id).length;
                  return (
                    <li key={d.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link to={`/manager/leads/${d.id}`} className="block truncate text-[13px] font-medium text-slate-900 hover:text-blue-700 hover:underline">
                          {d.name}
                        </Link>
                        <div className="text-xs text-slate-400">{d.stage} · ${Math.round(d.amount / 1000)}k</div>
                      </div>
                      <Link
                        to={`/manager/leads/${d.id}?tab=coaching`}
                        className="shrink-0 text-[13px] font-medium text-blue-700 hover:underline"
                      >
                        {lessonCount > 0 ? `${lessonCount} coaching ${lessonCount === 1 ? 'lesson' : 'lessons'} →` : isClosedStage(d.stage) ? 'Closed' : 'Create coaching lessons →'}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};
