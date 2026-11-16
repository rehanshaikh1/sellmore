import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Video,
  Clock,
  PlayCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Radio,
  Dumbbell,
  Headphones,
  Plus
} from 'lucide-react';
import { isClosedStage } from '../../lib/deals';
import { MeetingUploadModal } from '../../components/common/MeetingUploadModal';

export const SalesDashboard: React.FC = () => {
  const { deals, meetings, currentUser, currentPlan, crmConnected } = useStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Scoped to personal records only
  const myDeals = deals.filter(d => d.ownerId === currentUser.id && !isClosedStage(d.stage));
  const myMeetings = meetings.filter(m => m.representativeId === currentUser.id);
  const scoredMeetings = myMeetings.filter(m => typeof m.overallScorePercent === 'number');
  const averageScore = scoredMeetings.length
    ? Math.round(scoredMeetings.reduce((sum, m) => sum + (m.overallScorePercent as number), 0) / scoredMeetings.length)
    : null;

  const scheduledDeal = myDeals.find(d => d.nextMeetingDate);
  const upcomingMeeting = scheduledDeal || myDeals[0];
  const hasScheduledCall = Boolean(scheduledDeal?.nextMeetingDate);
  const totalPipeline = myDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Representative Workspace</h1>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase">
              Personal Sales Home
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {currentUser.name}{crmConnected ? ` · Assigned pipeline: $${(totalPipeline / 1000).toFixed(0)}k across ${myDeals.length} opportunities.` : '.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Upload Call Recording
          </button>
        </div>
      </div>

      {/* Hero Scheduled Meeting Callout (Prep Call Shortcut) */}
      {crmConnected && upcomingMeeting && (
        <div className="p-5 bg-blue-900 text-white rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-blue-200 uppercase tracking-wider">
                {hasScheduledCall ? 'Next Scheduled Customer Call' : 'Prepare for a Customer Call'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {upcomingMeeting.name || upcomingMeeting.companyName || 'Selected Opportunity'}
            </h2>
            <div className="text-xs text-blue-200 flex items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {hasScheduledCall
                ? upcomingMeeting.nextMeetingDate
                : 'No call date scheduled · You can still prepare for this lead'}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={`/sales/leads/${upcomingMeeting.id}?tab=prep`}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 fill-current" />
              <span>{hasScheduledCall ? 'Launch Prep Call Module' : 'Prepare for This Lead'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {crmConnected && (
          <Link
            to="/sales/leads"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">My Active Leads</span>
              <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
              {myDeals.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Pipeline: ${(totalPipeline / 1000).toFixed(0)}k USD
            </div>
          </Link>
        )}

        <Link
          to="/sales/meetings"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">My Scored Meetings</span>
            <Video className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            {myMeetings.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {averageScore !== null ? `Average score: ${averageScore}% on 12 cues` : 'No scored calls yet'}
          </div>
        </Link>


        <Link
          to="/sales/practice"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Skill Practice Rehearsals</span>
            <Dumbbell className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-3">
            88% Fluency
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Timed prompt drills ready
          </div>
        </Link>
      </div>

      {/* Quick Launchpad Strip (Live Assist, Roleplay, Coaching) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/sales/live-assist"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-3 shadow-2xs group"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
              Launch Live Assist Simulator
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              In-meeting Chrome extension copilot for live transcripts and objection cues.
            </p>
          </div>
        </Link>

        <Link
          to="/sales/mock-meetings"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-3 shadow-2xs group"
        >
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition-colors">
              Start AI Mock Roleplay
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Rehearse high-friction commercial conversations with realistic AI buyer personas.
            </p>
          </div>
        </Link>

        {crmConnected && (
          <Link
            to="/sales/leads"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-3 shadow-2xs group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                Tailored Lead Coaching
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Step through a coaching curriculum for your selected sales opportunity.
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Personal Meeting Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">My Recent Scored Sales Calls</h2>
          <Link to="/sales/meetings" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            All Calls <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Meeting Title</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myMeetings.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">
                    <Link to={`/sales/meetings/${m.id}`} className="hover:text-blue-600 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.duration}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.uploadDate}</td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {m.overallScorePercent ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {m.overallScorePercent}%
                      </span>
                    ) : (
                      <span className="text-slate-400">Processing</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/sales/meetings/${m.id}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded font-semibold text-[11px] transition-colors"
                    >
                      View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MeetingUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};
