
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { DEAL_STAGES, computeDealRisks, isClosedStage } from '../../lib/deals';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

export const DealsPage: React.FC = () => {
  const { deals: allDeals, meetings, currentRole } = useStore();
  const { scope } = useAccess();
  // Sales rep: own deals. Manager: assigned reps' deals. Client admin: all.
  const deals = scope(allDeals, d => d.ownerId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'won' | 'lost'>('active');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'next_meeting' | 'amount' | 'stage'>('next_meeting');
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rolePrefix =
    currentRole === 'manager'
      ? 'manager'
      : currentRole === 'sales_rep'
        ? 'sales'
        : 'admin';

  const scopedDeals = deals;
  const ownerNames = Array.from(new Set(deals.map(d => d.ownerName))).sort();

  const filteredDeals = scopedDeals
    .filter(d => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        d.name.toLowerCase().includes(query) ||
        d.companyName.toLowerCase().includes(query);

      const matchesStage =
        stageFilter === 'all' || d.stage === stageFilter;

      const matchesOwner =
        ownerFilter === 'all' ||
        d.ownerName.toLowerCase().includes(ownerFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? !isClosedStage(d.stage)
            : statusFilter === 'won'
              ? d.stage === 'Closed Won'
              : d.stage === 'Closed Lost';

      return matchesSearch && matchesStage && matchesOwner && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'stage') return a.stage.localeCompare(b.stage);

      return (a.nextMeetingDate || 'Z').localeCompare(
        b.nextMeetingDate || 'Z'
      );
    });

  // Pipeline risks are computed from each open deal's Salesforce record and its analysed calls.
  const riskItems = scopedDeals
    .filter(d => !isClosedStage(d.stage))
    .map(d => ({ deal: d, risks: computeDealRisks(d, meetings) }))
    .filter(x => x.risks.length > 0)
    .sort((a, b) => b.risks.length - a.risks.length)
    .slice(0, 3)
    .map(({ deal, risks }) => ({
      id: deal.id,
      title: `${deal.name} ($${Math.round(deal.amount / 1000)}k)`,
      stage: `${deal.stage} (${deal.timeInStage})`,
      description: risks.slice(0, 2).join(' '),
      action: 'Prep Call',
      prep: true
    }));

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 600);
  };

  const getStageDotColor = (stage: string) => {
    if (stage.includes('Proposal')) return 'bg-amber-500';
    if (stage.includes('Negotiation')) return 'bg-blue-600';
    if (stage.includes('Discovery')) return 'bg-purple-500';
    if (stage.includes('Technical')) return 'bg-indigo-500';
    if (stage.includes('Won')) return 'bg-emerald-600';
    return 'bg-slate-400';
  };

  const getOwnerInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const dealPath = (dealId: string) =>
    `/${rolePrefix}/deals/${dealId}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Deal Dashboard
            </h1>

            {/* <nav className="flex items-center gap-1">
              <Link
                to={`/${rolePrefix}/meetings`}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Meetings
              </Link>

              <Link
                to={`/${rolePrefix}/deals`}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 border-b-2 border-blue-600"
              >
                Deals
              </Link>

              <Link
                to={`/${rolePrefix}/practice`}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Practice
              </Link>
            </nav> */}
          </div>


        </div>

        <button
          onClick={() => setShowRiskModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Which deals are at risk?
        </button>
      </div>

      {/* AI Risk Analysis */}
      {showRiskModal && (
        <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl border border-indigo-800 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm">
                Ask AI: Pipeline Risk Analysis
              </h3>
              <p className="text-[11px] text-indigo-200">
                Synthesized across call sentiment, stakeholder engagement, and stage stagnation.
              </p>
            </div>

            <button
              onClick={() => setShowRiskModal(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close risk analysis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {riskItems.length === 0 && (
            <p className="text-xs text-indigo-200">No open deals have risks right now.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {riskItems.map(item => (
              <div
                key={item.id}
                className="p-3.5 bg-white/5 rounded-lg border border-white/10 space-y-2"
              >
                <div className="font-bold text-amber-400">
                  {item.title}
                </div>

                <div className="text-[10px] text-slate-300 font-mono">
                  {item.stage}
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {item.description}
                </p>

                <Link
                  to={`${dealPath(item.id)}${item.prep ? '?tab=prep' : ''}`}
                  className="text-[11px] text-blue-300 hover:text-white font-semibold"
                >
                  {item.action} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-900"
            >
              <option value="active">Active deals</option>
              <option value="won">Closed Won</option>
              <option value="lost">Closed Lost</option>
              <option value="all">All deals</option>
            </select>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Stage:</span>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-900"
            >
              <option value="all">All Stages</option>
              {DEAL_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Owner:</span>
            <select
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-900"
            >
              <option value="all">All Reps</option>
              {ownerNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-900"
            >
              <option value="next_meeting">Next Meeting Date</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="stage">Stage</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            title="Refresh pipeline data"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Deal Name</th>
                <th className="py-3 px-4">Deal Stage</th>
                <th className="py-3 px-4">Last Meeting</th>
                <th className="py-3 px-4">Next Meeting</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Close Date</th>
                <th className="py-3 px-4">Deal Owner</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map(deal => (
                <tr
                  key={deal.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                    <Link
                      to={dealPath(deal.id)}
                      className="hover:text-blue-600 transition-colors block truncate"
                    >
                      {deal.name}
                    </Link>

                    <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                      {deal.companyName}
                      {deal.source === 'draft' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-semibold">
                          Draft · not in Salesforce yet
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStageDotColor(deal.stage)}`} />
                      <span className="font-medium text-slate-800">
                        {deal.stage}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono">
                    {deal.lastMeetingDate || '—'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                    {deal.nextMeetingDate || '—'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                    ${deal.amount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                    {deal.closeDate || '—'}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                        {getOwnerInitials(deal.ownerName)}
                      </span>
                      <span className="text-slate-700 font-medium">
                        {deal.ownerName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`${dealPath(deal.id)}?tab=prep`}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-lg text-[11px] transition-all border border-blue-200"
                      >
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Prep Call
                      </Link>

                      <Link
                        to={dealPath(deal.id)}
                        className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded"
                        title="View Full Workspace"
                        aria-label={`Open ${deal.name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No deals match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
