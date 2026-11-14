import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Lock, PlugZap, Sparkles } from 'lucide-react';
import { DataKey, useStore } from '../../store/useStore';

const KEY_LABELS: Record<DataKey, string> = {
  team: 'team members',
  meetings: 'meetings & analyses',
  deals: 'deals & pipeline',
  automations: 'workflows',
  knowledge: 'knowledge sources',
  documents: 'company documents',
  mockMeetings: 'mock meeting history',
  coaching: 'coaching programme',
  billing: 'credit usage history'
};

interface DataGateProps {
  /** Data groups this page needs before it can render. */
  keys?: DataKey[];
  /** Extra data groups needed only when a CRM is connected (e.g. deals on a dashboard). */
  crmKeys?: DataKey[];
  /** Page is a CRM feature: hidden entirely until a CRM is connected. */
  requiresCrm?: boolean;
  title?: string;
  children: React.ReactNode;
}

/**
 * Wraps a route. Shows a "connect CRM" card for CRM features when no CRM is
 * connected, and an empty state with a Populate button while the page's mock
 * data has not been loaded yet.
 */
export const DataGate: React.FC<DataGateProps> = ({
  keys = [],
  crmKeys = [],
  requiresCrm = false,
  title,
  children
}) => {
  const { crmConnected, populated, populate, currentRole, meetings, deals, coachingPrograms } = useStore();
  // Data that arrived another way (a Salesforce sync, an upload) counts as loaded.
  const hasData: Partial<Record<DataKey, boolean>> = {
    meetings: meetings.length > 0,
    deals: deals.length > 0,
    coaching: Object.keys(coachingPrograms).length > 0
  };

  if (requiresCrm && !crmConnected) {
    const canConnect = currentRole === 'client_admin';
    return (
      <div className="max-w-xl mx-auto mt-16 text-center bg-white border border-slate-200 rounded-2xl p-10 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {title ? `${title} needs a Salesforce connection` : 'This feature needs a Salesforce connection'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Deals and the features built on them only appear once Salesforce is connected.
          {canConnect
            ? ' Connect Salesforce to unlock them.'
            : ' Ask your Client Admin to connect Salesforce.'}
        </p>
        {canConnect && (
          <Link
            to="/admin/crm"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
          >
            <PlugZap className="w-4 h-4" />
            Connect Salesforce
          </Link>
        )}
      </div>
    );
  }

  const needed = Array.from(new Set([...keys, ...(crmConnected ? crmKeys : [])]));
  const missing = needed.filter(key => !populated[key]);
  // Records that arrived another way (a Salesforce sync, an upload) are already on screen.
  const alreadyHasRecords = missing.length > 0 && missing.every(key => hasData[key]);

  if (missing.length > 0) {
    return (
      <>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3 text-xs text-blue-900">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {alreadyHasRecords
                ? `Showing only records imported or uploaded so far. Load the sample ${missing.map(k => KEY_LABELS[k]).join(', ')} to see a fuller picture.`
                : `No ${missing.map(k => KEY_LABELS[k]).join(', ')} loaded yet. Tables below are empty.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => populate(missing)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Populate sample data
          </button>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
};
