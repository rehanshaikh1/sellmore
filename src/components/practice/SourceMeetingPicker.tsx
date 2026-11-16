import React from 'react';
import { Link } from 'react-router-dom';
import { MeetingRecord } from '../../types';
import { SimulatorSetup } from '../../lib/simulatorSource';
import { CueBadge } from './LiveConversation';

interface Props {
  meetings: MeetingRecord[];
  value: string;
  onChange: (id: string) => void;
  setup?: SimulatorSetup;
  rolePrefix: string;
  /** What gets built from the meeting, e.g. "mock meeting". */
  builds: string;
}

/** Picks the analysed meeting a simulator session is built from, and shows what it takes from it. */
export const SourceMeetingPicker: React.FC<Props> = ({ meetings, value, onChange, setup, rolePrefix, builds }) => {
  if (meetings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No analysed meeting yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          A {builds} is built from a meeting SellMore has analysed, so it practises what actually happened on your calls.
          Upload or import a meeting and wait for its analysis first.
        </p>
        <Link to={`/${rolePrefix}/meetings`} className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Open Meeting Library</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="source-meeting" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Based on this analysed meeting</label>
        <select
          id="source-meeting"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="">Choose a meeting</option>
          {meetings.map(m => (
            <option key={m.id} value={m.id}>{m.name}{typeof m.overallScorePercent === 'number' ? ` (${m.overallScorePercent}%)` : ''}</option>
          ))}
        </select>
      </div>
      {setup && (
        <dl className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xs sm:grid-cols-2">
          <div><dt className="font-semibold uppercase tracking-wider text-slate-500">Buyer</dt><dd className="mt-1 text-[13px] text-slate-900">{setup.buyerName}<span className="text-slate-500"> · {setup.buyerRole}</span></dd></div>
          <div><dt className="font-semibold uppercase tracking-wider text-slate-500">Scenario</dt><dd className="mt-1 text-[13px] text-slate-900">{setup.roleplayType}</dd></div>
          <div className="sm:col-span-2">
            <dt className="font-semibold uppercase tracking-wider text-slate-500">Focus cues from this call</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">{setup.focusCueIds.map(id => <CueBadge key={id} cueId={id} tone="miss" />)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
};
