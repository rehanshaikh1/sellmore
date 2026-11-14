
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { Link } from 'react-router-dom';
import {
  Video,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Sparkles,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { SourceBadge } from '../../components/common/SourceBadge';
import { MeetingUploadModal } from '../../components/common/MeetingUploadModal';
import { LinkDealControl } from '../../components/common/LinkDealControl';
import { computeDealRisks, isClosedStage } from '../../lib/deals';

export const MeetingLibrary: React.FC = () => {
  const {
    meetings,
    deals,
    crmConnected,
    currentPlan,
    freeMeetingQuota,
    deleteMeeting,
    retryMeetingAnalysis,
    currentRole,
    currentUser
  } = useStore();

  const { scope } = useAccess();
  const [activeTab, setActiveTab] = useState<'my' | 'team'>(currentRole === 'sales_rep' ? 'my' : 'team');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [aiSearchInsight, setAiSearchInsight] = useState<string | null>(null);

  // Match the role-based routes used by Sidebar and AppRoutes.
  const rolePrefix =
    currentRole === 'manager'
      ? 'manager'
      : currentRole === 'sales_rep'
        ? 'sales'
        : 'admin';

  // Every meeting belongs to a rep (representativeId). Rep = own, manager = assigned
  // reps' meetings, client admin = all. "My" narrows to meetings the signed-in user owns.
  const visibleMeetings = scope(meetings, meeting => meeting.representativeId);
  const tabScopedMeetings =
    activeTab === 'my'
      ? visibleMeetings.filter(meeting => meeting.representativeId === currentUser.id)
      : visibleMeetings;

  // Search and status filters.
  const filteredMeetings = tabScopedMeetings.filter(meeting => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      meeting.name.toLowerCase().includes(query) ||
      (meeting.associatedDealName &&
        meeting.associatedDealName.toLowerCase().includes(query)) ||
      meeting.representativeName.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      meeting.processingStatus === statusFilter;

    const matchesSource =
      sourceFilter === 'all' || (meeting.source ?? 'upload') === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleDeleteConfirm = () => {
    if (!meetingToDelete) return;

    deleteMeeting(meetingToDelete.id);
    setMeetingToDelete(null);
  };

  const handlePromptChipClick = (promptText: string) => {
    setSearchQuery('');

    if (promptText.includes('better calls')) {
      setAiSearchInsight(
        'AI Call Coaching Analysis: Across your last 5 meetings, reps who opened with a clear permission-based question had a 44% higher conversion to next stage. Your greatest opportunity is addressing titanium custom tooling surcharges before the client asks.'
      );
    } else if (promptText.includes('customers saying')) {
      setAiSearchInsight(
        'Key Voice-of-Customer Signals: 1. AeroDynamics UK: 8-week lead time is too slow for flight test; split delivery in 3 weeks required. 2. BioMedix: Price sensitive, requesting 15% discount benchmarked against Swiss vendors.'
      );
    } else {
      const open = scope(deals, d => d.ownerId).filter(d => !isClosedStage(d.stage));
      const ranked = open
        .map(d => ({ deal: d, risks: computeDealRisks(d, meetings) }))
        .filter(x => x.risks.length > 0)
        .sort((a, b) => b.risks.length - a.risks.length)
        .slice(0, 3);
      setAiSearchInsight(
        !crmConnected
          ? 'Connect Salesforce to see which deals need attention.'
          : ranked.length === 0
            ? 'No open deals have risks right now.'
            : 'Deals needing attention: ' + ranked.map((x, i) => `${i + 1}. ${x.deal.name}: ${x.risks[0]}`).join(' ')
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Meeting Analyse & Global Library
            </h1>

            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {meetings.length} Total Records
            </span>
          </div>


        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Meeting (MP4 / MP3 / TXT)</span>
        </button>
      </div>

      {/* FREE PLAN NOTICE */}
      {currentPlan === 'free' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-amber-900">
              Free Plan Allowance:
            </span>

            <span className="font-mono font-bold text-amber-800">
              {meetings.length} / {freeMeetingQuota} meeting slots used
            </span>

            <span className="text-slate-400">·</span>

            <span className="text-amber-700">
              Deleting a meeting immediately frees up a slot for a new conversation.
            </span>
          </div>

          <Link
            to="/pricing"
            className="text-blue-700 font-semibold hover:underline shrink-0"
          >
            Remove Quota with Upgrade →
          </Link>
        </div>
      )}

      {/* SEARCH AND SELLMore INTELLIGENCE */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a meeting or Ask SellMore about your meetings..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />

          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

          <Bookmark className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        {/* SUGGESTED PROMPTS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Suggested:
          </span>

          <button
            onClick={() =>
              handlePromptChipClick('How can I lead better calls?')
            }
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-[11px] flex items-center gap-1 border border-blue-100"
          >
            <Sparkles className="w-3 h-3" />
            How can I lead better calls?
          </button>

          <button
            onClick={() =>
              handlePromptChipClick('What are our customers saying?')
            }
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-[11px]"
          >
            What are our customers saying?
          </button>

          <button
            onClick={() =>
              handlePromptChipClick('Which deals need attention?')
            }
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-[11px] flex items-center gap-1"
          >
            Which deals need attention?
          </button>
        </div>

        {/* AI INSIGHT */}
        {aiSearchInsight && (
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-xs text-slate-800 space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                SellMore Meeting Intelligence
              </span>

              <button
                onClick={() => setAiSearchInsight(null)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-700 leading-relaxed">
              {aiSearchInsight}
            </p>
          </div>
        )}
      </div>

      {/* MY / TEAM MEETINGS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3 text-xs">
        <div className="flex gap-4 font-semibold">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-1 transition-colors ${activeTab === 'my'
              ? 'border-b-2 border-slate-900 text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            My Meetings
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`pb-1 transition-colors ${activeTab === 'team'
              ? 'border-b-2 border-slate-900 text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Team Meetings
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 bg-white text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="Analysed">Analysed</option>
          <option value="Processing">Processing</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={sourceFilter}
          onChange={event => setSourceFilter(event.target.value)}
          className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 bg-white text-xs"
        >
          <option value="all">All Sources</option>
          <option value="upload">Manual upload</option>
          {crmConnected && <option value="crm">Salesforce CRM</option>}
          <option value="drive">Google Drive</option>
        </select>
      </div>

      {/* MEETINGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meeting Title & Participants</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source</th>
                {crmConnected && <th className="py-3 px-4">Deal</th>}
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map(meeting => {
                  const reportPath = `/${rolePrefix}/meetings/${meeting.id}`;
                  const dealPath = meeting.associatedDealId
                    ? `/${rolePrefix}/deals/${meeting.associatedDealId}`
                    : null;

                  const isAnalysed =
                    meeting.processingStatus === 'Analysed';

                  const isProcessing =
                    meeting.processingStatus === 'Processing';

                  const isFailed =
                    meeting.processingStatus === 'Failed';

                  return (
                    <tr
                      key={meeting.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* DATE */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        <div className="font-semibold text-slate-800">
                          {meeting.uploadDate}
                        </div>

                        <div className="text-[10px] text-slate-400">
                          {meeting.duration}
                        </div>
                      </td>

                      {/* MEETING TITLE */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-start gap-2">
                          <div className="mt-1">
                            {isAnalysed && (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                                title="Analysed"
                              />
                            )}

                            {isProcessing && (
                              <span
                                className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"
                                title="Processing"
                              />
                            )}

                            {isFailed && (
                              <span
                                className="w-2 h-2 rounded-full bg-rose-500 inline-block"
                                title="Failed"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            {isAnalysed ? (
                              <Link
                                to={reportPath}
                                className="font-semibold text-slate-900 hover:text-blue-600 block truncate"
                              >
                                {meeting.name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-900 block truncate">
                                {meeting.name}
                              </span>
                            )}

                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {meeting.representativeName}{crmConnected ? ` · ${meeting.associatedDealName || 'No deal linked'}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {meeting.fileFormat || 'Call Recording'}
                        </span>
                      </td>

                      {/* SOURCE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SourceBadge source={meeting.source} />
                      </td>

                      {/* ASSOCIATED DEAL (only with Salesforce connected) */}
                      {crmConnected && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {meeting.associatedDealName && dealPath ? (
                            <Link
                              to={dealPath}
                              className="text-blue-600 hover:underline font-medium text-[11px]"
                            >
                              {meeting.associatedDealName}
                            </Link>
                          ) : (
                            <LinkDealControl meeting={meeting} />
                          )}
                        </td>
                      )}

                      {/* SCORE */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {meeting.overallScorePercent !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${meeting.overallScorePercent >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                              }`}
                          >
                            {meeting.overallScorePercent}/100
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">
                            Processing...
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAnalysed ? (
                            <Link
                              to={reportPath}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold rounded text-[11px] transition-colors"
                            >
                              View Report
                            </Link>
                          ) : isFailed ? (
                            <button
                              type="button"
                              onClick={() => retryMeetingAnalysis(meeting.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] transition-colors"
                            >
                              Retry Analysis
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Processing...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setMeetingToDelete({
                                id: meeting.id,
                                name: meeting.name
                              })
                            }
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete meeting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={crmConnected ? 7 : 6} className="py-12 text-center">
                    <Video className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No meetings found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Try changing your search or filters, or upload a new meeting.
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Meeting
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-base">
              Confirm Deletion
            </h3>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong>{meetingToDelete.name}</strong>?
              On the Free Plan, deleting this meeting will immediately free up
              1 meeting analysis slot.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEETING UPLOAD MODAL */}
      <MeetingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
