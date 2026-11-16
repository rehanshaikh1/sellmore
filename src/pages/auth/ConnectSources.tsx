import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FolderSync, Loader2, Lock, Cloud } from 'lucide-react';
import { useStore } from '../../store/useStore';

const DRIVE_FOLDERS = [
  'Google Drive / Sales Team / Call Recordings 2026',
  'Google Drive / Customer Calls',
  'Google Drive / Demos & Discovery'
];

type Pending = 'crm' | 'drive' | null;

export const ConnectSources: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    currentRole,
    currentPlan,
    crmConnected,
    crmOrgName,
    driveConnected,
    driveSelectedFolder,
    connectSalesforce,
    connectDrive,
    completeOnboarding
  } = useStore();

  const [pending, setPending] = useState<Pending>(null);
  const [folder, setFolder] = useState(DRIVE_FOLDERS[0]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const crmLocked = currentPlan === 'free';
  const driveLocked = currentPlan === 'free';

  const simulate = (which: Exclude<Pending, null>, action: () => void) => {
    setPending(which);
    setTimeout(() => {
      action();
      setPending(null);
    }, 900);
  };

  const finish = () => {
    completeOnboarding();
    navigate('/admin/dashboard', { replace: true });
  };

  const anyConnected = crmConnected || driveConnected;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold mb-4">
            SM
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Where do your sales calls live?
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Connect a source so SellMore has something to work with. Connect Salesforce to bring in
            leads from your Opportunities, Google Drive to import recordings, or both. Leads and coaching
            work without either: you can skip this, upload meetings manually and create leads from them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* CRM */}
          <div className={`bg-white border rounded-2xl p-6 ${crmConnected ? 'border-emerald-300' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              {crmConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <h2 className="font-bold text-slate-900 mt-4">Connect CRM (Salesforce)</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Brings in leads from your Opportunities and unlocks Company Intelligence.
              Read-only access.
            </p>
            {crmConnected && <p className="text-[11px] text-slate-400 mt-3 truncate">{crmOrgName}</p>}
            <div className="mt-5">
              {crmLocked ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Lock className="w-3.5 h-3.5" /> CRM is not available on the Free plan.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={crmConnected || pending !== null}
                  onClick={() => simulate('crm', connectSalesforce)}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white flex items-center justify-center gap-2"
                >
                  {pending === 'crm' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Authorizing…</>
                  ) : crmConnected ? 'Connected' : 'Connect Salesforce'}
                </button>
              )}
            </div>
          </div>

          {/* Drive */}
          <div className={`bg-white border rounded-2xl p-6 ${driveConnected ? 'border-emerald-300' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FolderSync className="w-5 h-5" />
              </div>
              {driveConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <h2 className="font-bold text-slate-900 mt-4">Connect Google Drive</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Automatically import call recordings from one folder you choose. Manual upload still works.
            </p>
            {driveConnected ? (
              <p className="text-[11px] text-slate-400 mt-3 truncate">{driveSelectedFolder}</p>
            ) : (
              !driveLocked && (
                <select
                  value={folder}
                  onChange={e => setFolder(e.target.value)}
                  className="mt-3 w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700"
                >
                  {DRIVE_FOLDERS.map(f => <option key={f}>{f}</option>)}
                </select>
              )
            )}
            <div className="mt-5">
              {driveLocked ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Lock className="w-3.5 h-3.5" /> Google Drive is not available on the Free plan.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={driveConnected || pending !== null}
                  onClick={() => simulate('drive', () => connectDrive(folder))}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white flex items-center justify-center gap-2"
                >
                  {pending === 'drive' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Authorizing…</>
                  ) : driveConnected ? 'Connected' : 'Connect Google Drive'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={finish}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            {anyConnected ? 'Continue to dashboard' : 'Skip for now'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {!anyConnected && (
          <p className="text-center text-[11px] text-slate-400 mt-3">
            Without Salesforce you can still create leads from your meetings. Connect later from Integrations.
          </p>
        )}
        {currentRole !== 'client_admin' && (
          <p className="text-center text-[11px] text-slate-400 mt-1">Integrations are managed by your Client Admin.</p>
        )}
      </div>
    </div>
  );
};
