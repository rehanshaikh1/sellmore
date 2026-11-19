import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Users,
  Video,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Lock,
  Database,
  Briefcase,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { MeetingUploadModal } from '../../components/common/MeetingUploadModal';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    currentPlan,
    freeMeetingQuota,
    meetings,
    teamMembers,
    deals,
    crmConnected
  } = useStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    title: '',
    desc: ''
  });

  const activeMembers = teamMembers.filter(member => member.status === 'active').length;
  const pendingInvites = teamMembers.filter(member => member.invitationStatus === 'pending').length;
  const recentMeetings = meetings.slice(0, 5);

  const meetingUsage = currentPlan === 'free'
    ? Math.min(100, (meetings.length / Math.max(freeMeetingQuota, 1)) * 100)
    : Math.min(100, (meetings.length / 50) * 100);

  const openUpgradeModal = (title: string, desc: string) => {
    setUpgradeModal({ isOpen: true, title, desc });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Company Administration
            </h1>
            <span
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${currentPlan === 'free'
                ? 'bg-amber-100/80 text-amber-900 border border-amber-300'
                : 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                }`}
            >
              {currentPlan} plan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {currentUser.companyName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Meeting
          </button>

          {currentPlan === 'free' ? (
            <Link
              to="/pricing"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs hover:shadow active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Upgrade Plan
            </Link>
          ) : (
            <Link
              to="/admin/billing"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              Manage Billing
            </Link>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Analyse Usage Meter */}
        <Link
          to="/admin/meetings"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
              Meeting Analyse Quota
            </span>
            <Video className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {meetings.length}
              {currentPlan === 'free' && (
                <span className="text-slate-400 text-sm font-normal">
                  {' '}/ {freeMeetingQuota}
                </span>
              )}
            </div>

            {currentPlan === 'free' && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                {Math.max(0, freeMeetingQuota - meetings.length)} remaining
              </span>
            )}
          </div>

          <div className="mt-3.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentPlan === 'free' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              style={{ width: `${meetingUsage}%` }}
            />
          </div>

          <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{currentPlan === 'free' ? '10-record free cap' : 'Meeting usage overview'}</span>
            <span className="text-blue-600 group-hover:underline font-semibold">
              View meetings
            </span>
          </div>
        </Link>

        {/* Team Members */}
        <Link
          to="/admin/team"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
              Team Management
            </span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {teamMembers.length}
            </div>
            {pendingInvites > 0 && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                {pendingInvites} invite pending
              </span>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{activeMembers} active seats</span>
            <span className="text-blue-600 group-hover:underline font-semibold flex items-center">
              Manage <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* CRM Context Status */}
        <Link
          to="/admin/crm"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
              Salesforce CRM V1
            </span>
            <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-lg font-bold text-slate-900 truncate tracking-tight">
              {crmConnected ? 'Connected' : 'Disconnected'}
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${crmConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
            >
              {crmConnected ? 'Read-Only V1' : 'Action Needed'}
            </span>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{crmConnected ? 'Syncs Leads & Leads' : 'Connect for Lead Context'}</span>
            <span className="text-blue-600 group-hover:underline font-semibold flex items-center">
              Configure <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* Active Deals Pipeline */}
        {crmConnected && (
          <Link
            to="/admin/leads"
            className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                Assigned Leads Pipeline
              </span>
              <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                ${(deals.reduce((total, deal) => total + deal.amount, 0) / 1000).toFixed(0)}k
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {deals.length} active deals
              </span>
            </div>

            <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-between">
              <span>GD&T Aerospace & Medical</span>
              <span className="text-blue-600 group-hover:underline font-semibold flex items-center">
                Workspace <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Free Plan Upgrade Banner */}
      {currentPlan === 'free' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900 text-sm">
                You are on the Free Evaluation Plan
              </div>
              <div className="text-amber-800 mt-0.5">
                Capped at 10 meeting analyses. Salesforce CRM, Google Drive sync, Live Assist Chrome extension, and Practice roleplays are locked.
              </div>
            </div>
          </div>

          <Link
            to="/pricing"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg whitespace-nowrap transition-colors shadow-2xs shrink-0 text-center"
          >
            Upgrade to Growth
          </Link>
        </div>
      )}

      {/* Latest Meeting Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Latest Company Sales Meetings
            </h2>

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Meeting / Call Name</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Representative</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Date & Time</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Duration</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Processing Status</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Score</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentMeetings.length > 0 ? (
                recentMeetings.map(meeting => {
                  const reportPath = `/admin/meetings/${meeting.id}`;
                  const isAnalysed = meeting.processingStatus === 'Analysed';
                  const isProcessing = meeting.processingStatus === 'Processing';
                  const isFailed = meeting.processingStatus === 'Failed';

                  return (
                    <tr key={meeting.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {isAnalysed ? (
                          <Link to={reportPath} className="hover:text-blue-600 hover:underline tracking-tight">
                            {meeting.name}
                          </Link>
                        ) : (
                          <span className="tracking-tight">{meeting.name}</span>
                        )}

                        {meeting.associatedDealName && (
                          <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                            Lead: {meeting.associatedDealName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                        {meeting.representativeName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {meeting.uploadDate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {meeting.duration}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isAnalysed ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Analysed
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-800 font-semibold bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md text-[11px]">
                            <Clock className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Speech Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-800 font-semibold bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Failed (Corrupted)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                        {meeting.overallScorePercent ? (
                          <span className={`text-xs ${meeting.overallScorePercent >= 75 ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                            {meeting.overallScorePercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isAnalysed ? (
                          <Link
                            to={reportPath}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white text-[11px]"
                          >
                            View Report <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ) : isFailed ? (
                          <button
                            type="button"
                            onClick={() => useStore.getState().retryMeetingAnalysis(meeting.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-md text-[11px] transition-colors"
                          >
                            Retry Analysis
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Processing...</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Video className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">No meetings yet</p>
                    <p className="mt-1 text-xs text-slate-500">Upload a meeting recording to see its analysis here.</p>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Upload Meeting
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/company-docs"
          className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 transition-all flex items-start gap-3.5 shadow-2xs hover:shadow-xs group"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors tracking-tight">
              Company Documents
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Upload company engineering handbooks and tag them to Product Knowledge or Feasibility QA assessments.
            </p>
          </div>
        </Link>
      </div>

      <MeetingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <PlanUpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal(previous => ({ ...previous, isOpen: false }))}
        featureTitle={upgradeModal.title}
        featureDescription={upgradeModal.desc}
      />
    </div>
  );
};
