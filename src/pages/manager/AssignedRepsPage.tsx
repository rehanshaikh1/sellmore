import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { Users, Briefcase, Video, GraduationCap, ChevronRight, CheckCircle2, UserPlus, X, AlertCircle, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RepDetailsDrawer } from '../../components/common/RepDetailsDrawer';
import { getRepCoaching } from '../../lib/repCoaching';

export const AssignedRepsPage: React.FC = () => {
  const { deals, meetings, inviteTeamMember, practiceLessons } = useStore();
  const { assignedReps } = useAccess();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewRepId, setViewRepId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const closeInvite = () => { setInviteOpen(false); setName(''); setEmail(''); setError(''); setSuccess(''); };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) { setError('Name and business email are required.'); return; }
    // The new rep is assigned to the signed-in manager by the store.
    const result = inviteTeamMember(name.trim(), email.trim(), 'sales_rep');
    if (!result.success) { setError(result.error || 'Failed to send invite.'); return; }
    setSuccess(`Invitation sent to ${email.trim()}. They will appear under your team.`);
    setTimeout(closeInvite, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
       <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Sales Representatives</h1>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase">
            Manager Scope
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review individual representative performance across 12 sales cues, lead pipelines, and assigned coaching curricula.
        </p>
       </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite Sales Rep
        </button>
      </div>

      {assignedReps.length === 0 && (
        <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
          No sales representatives are assigned to you yet. Invite one, or ask your Client Admin to assign existing reps.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignedReps.map(rep => {
          const repDeals = deals.filter(d => d.ownerId === rep.id);
          const repMeetings = meetings.filter(m => m.representativeId === rep.id);
          const pipeline = repDeals.reduce((sum, d) => sum + d.amount, 0);
          const coaching = getRepCoaching(rep.id, deals, practiceLessons, meetings);

          return (
            <div key={rep.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                    {rep.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rep.name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">{rep.email}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Seat
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Leads</span>
                  <span className="font-bold text-slate-900 text-sm">{repDeals.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Pipeline</span>
                  <span className="font-bold text-slate-900 text-sm">${(pipeline / 1000).toFixed(0)}k</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Calls Scored</span>
                  <span className="font-bold text-slate-900 text-sm">{repMeetings.length}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Active Assigned Opportunities:</span>
                <ul className="space-y-1 text-slate-600">
                  {repDeals.map(d => (
                    <li key={d.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="font-medium text-slate-900 truncate max-w-[200px]">{d.name}</span>
                      <span className="font-mono text-slate-500">${(d.amount / 1000).toFixed(0)}k · {d.stage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-slate-400 text-[11px]">Joined: {rep.dateJoined}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewRepId(rep.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                    >
                      View
                    </button>
                    {coaching.hasPlan ? (
                      <Link
                        to={`/manager/leads/${coaching.firstDealId}?tab=coaching`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <GraduationCap className="w-3.5 h-3.5" /> Coach {rep.name.split(' ')[0]}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        title={coaching.reason}
                        className="px-3 py-1.5 bg-slate-100 text-slate-400 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" /> Coach {rep.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                </div>
                {!coaching.hasPlan && (
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 shrink-0" /> Locked: {coaching.reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewRepId && (() => {
        const viewRep = assignedReps.find(r => r.id === viewRepId);
        return viewRep ? <RepDetailsDrawer rep={viewRep} onClose={() => setViewRepId(null)} /> : null;
      })()}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Invite Sales Representative</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">They will report to you.</p>
              </div>
              <button onClick={closeInvite} className="text-slate-400 hover:text-slate-700 p-1 rounded-md" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{success}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Liam Anderson" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Email <span className="text-rose-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="liam.anderson@apexengineering.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>The invitation link expires after <strong>48 hours</strong>. It uses one seat on your plan.</span>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={closeInvite} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Send Invitation Email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
