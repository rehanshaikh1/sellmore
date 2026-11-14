import React from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { Link } from 'react-router-dom';
import { isClosedStage } from '../../lib/deals';
import { 
  Users, 
  Briefcase, 
  Video, 
  GraduationCap, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { deals, meetings, crmConnected } = useStore();
  const { assignedReps, scope } = useAccess();

  // Manager scope: records owned by the reps currently assigned to this manager.
  const assignedRepIds = assignedReps.map(r => r.id);
  const assignedDeals = scope(deals, d => d.ownerId).filter(d => !isClosedStage(d.stage));
  const assignedMeetings = scope(meetings, m => m.representativeId);

  const totalAssignedPipeline = assignedDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Manager Workspace</h1>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase">
              Assigned Team Scope
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervising {assignedReps.length} assigned representatives · Total team pipeline: ${(totalAssignedPipeline / 1000).toFixed(0)}k USD
          </p>
        </div>

        <div className="flex items-center gap-2">
          {crmConnected && (
            <Link
              to="/manager/deal-coaching"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Deal Coaching Mode
            </Link>
          )}
        </div>
      </div>

      {/* Permission Boundary Guardrail (PRD Section 8) */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Manager Permission Boundary (PRD §8):</strong> Your access is strictly scoped to your assigned sales representatives ({assignedReps.map(r => r.name).join(', ')}). Company billing, platform settings, and unassigned reps are isolated.
        </span>
      </div>

      {/* KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/manager/team"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Assigned Sales Reps</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            {assignedReps.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span className="truncate">{assignedReps.map(r => r.name).join(' & ') || 'No reps assigned yet'}</span>
            <span className="text-blue-600 group-hover:underline flex items-center">View <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        {crmConnected && (
          <Link
            to="/manager/deals"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Assigned Team Pipeline</span>
              <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
              ${(totalAssignedPipeline / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
              <span>{assignedDeals.length} active opportunities</span>
              <span className="text-blue-600 group-hover:underline flex items-center">Deals <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
            </div>
          </Link>
        )}

        <Link
          to="/manager/meetings"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Recent Calls Scored</span>
            <Video className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            {assignedMeetings.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>All 12 sales cues evaluated</span>
            <span className="text-blue-600 group-hover:underline flex items-center">Review <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

      </div>

      {/* Assigned Representatives Performance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Assigned Representatives Performance</h2>
          <Link to="/manager/team" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View Team Details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sales Representative</th>
                {crmConnected && <th className="py-3 px-4">Active Deals</th>}
                {crmConnected && <th className="py-3 px-4">Pipeline Value</th>}
                <th className="py-3 px-4">Recorded Meetings</th>
                <th className="py-3 px-4">Average Cue Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedReps.map(rep => {
                const repDeals = deals.filter(d => d.ownerId === rep.id);
                const repMeetings = meetings.filter(m => m.representativeId === rep.id);
                const repPipeline = repDeals.reduce((sum, d) => sum + d.amount, 0);

                return (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{rep.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal font-mono">{rep.email}</div>
                    </td>
                    {crmConnected && (
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {repDeals.length} deals
                      </td>
                    )}
                    {crmConnected && (
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ${(repPipeline / 1000).toFixed(0)}k USD
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {repMeetings.length} calls
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        79.5% Average
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to="/manager/deal-coaching"
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold rounded text-[11px] transition-colors"
                      >
                        Coach Rep
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
