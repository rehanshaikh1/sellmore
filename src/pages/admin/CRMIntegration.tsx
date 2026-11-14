import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, SYNC_INTERVAL_OPTIONS, SyncInterval, syncIntervalLabel } from '../../store/useStore';
import {
  Database,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Clock,
  ExternalLink,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const CRMIntegration: React.FC = () => {
  const {
    currentPlan,
    deals,
    crmConnected,
    crmOrgName,
    crmSyncStatus,
    crmLastSync,
    crmLastSyncResult,
    connectSalesforce,
    disconnectSalesforce,
    crmSyncInterval,
    setSyncInterval,
    triggerCRMSync
  } = useStore();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isFree = currentPlan === 'free';

  return (
    <div className="space-y-6">
      {/* Next step once Salesforce is connected */}
      {crmConnected && !isFree && !bannerDismissed && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Salesforce is connected</div>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {deals.length > 0
                  ? `${deals.length} deal${deals.length === 1 ? ' is' : 's are'} ready. Open the Deal Workspace to see your pipeline.`
                  : 'Run "Sync now" below to bring in your deals, then open the Deal Workspace.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/admin/deals"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800"
            >
              Open Deal Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
              className="rounded-md p-2 text-slate-400 hover:bg-blue-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Integration</h1>

      </div>

      {/* Free Plan Restriction Guardrail */}
      {isFree && (
        <div className="p-4.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-900 shrink-0 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900 text-sm tracking-tight">
                CRM Integration is Locked on Free Plan
              </div>
              <div className="text-amber-800 mt-1 leading-relaxed">
                Free Plan CRM is disabled and cannot initiate OAuth authorization. Upgrade to Growth to enable Salesforce V1 sync.
              </div>
            </div>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg whitespace-nowrap transition-colors shadow-2xs shrink-0 text-center active:scale-[0.98]"
          >
            Upgrade to Connect CRM
          </button>
        </div>
      )}

      {/* Primary Integration: Salesforce V1 Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 font-bold text-lg shadow-2xs">
                SF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Salesforce V1 (Confirmed Baseline)</h3>
                  {crmConnected && !isFree ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {isFree ? 'Disabled on Free' : 'Not Connected'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                  Initial baseline access is strictly <strong>read-only</strong> for Accounts, Contacts, Opportunities, Opportunity Contact Roles, and the Activities (Tasks and Events) that carry call recordings. Write-back permissions await Product Owner approval.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isFree ? (
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" /> Unlock with Paid Plan
                </button>
              ) : crmConnected ? (
                <>
                  <button
                    onClick={triggerCRMSync}
                    disabled={crmSyncStatus === 'syncing'}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${crmSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    {crmSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={disconnectSalesforce}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs active:scale-[0.98]"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectSalesforce}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  Connect Salesforce
                </button>
              )}
            </div>
          </div>

          {/* Connected Details */}
          {crmConnected && !isFree && (
            <>
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Connected Salesforce Org</div>
                <div className="font-semibold text-slate-900 mt-1 truncate tracking-tight">{crmOrgName}</div>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Sync Health & Frequency</div>
                <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-fetch: {syncIntervalLabel(crmSyncInterval)}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Last Successful Sync</div>
                <div className="font-mono font-bold text-slate-900 mt-1">{crmLastSync}</div>
              </div>
            </div>
            {crmLastSyncResult && (
              <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900">
                {crmLastSyncResult}
              </div>
            )}
            </>
          )}
        </div>

        {crmConnected && !isFree && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">Recording auto-fetch</div>
              <p className="text-slate-500 mt-0.5">How often SellMore checks Salesforce for new call recordings. They appear in the Meeting Library with source "Salesforce CRM".</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={crmSyncInterval}
                onChange={e => setSyncInterval('crm', e.target.value as SyncInterval)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                aria-label="CRM auto-fetch frequency"
              >
                {SYNC_INTERVAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={triggerCRMSync}
                disabled={crmSyncStatus === 'syncing'}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${crmSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {crmSyncStatus === 'syncing' ? 'Syncing...' : 'Sync now'}
              </button>
            </div>
          </div>
        )}

        {/* Conceptual Data Relationship Safeguard Notice (PRD Section 13.2) */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Opportunity Association Rule (PRD §13.2):</strong> A contact may participate in multiple Opportunities. SellMore inspects Salesforce Opportunity Contact Roles and active activity references; it does not merge separate purchases simply because the contact email matches.
          </span>
        </div>
      </div>



      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Salesforce CRM Sync Locked"
        featureDescription="CRM integration is disabled on the Free Plan. Upgrade to Growth to sync Opportunities, Contacts, and call recordings."
      />
    </div>
  );
};
