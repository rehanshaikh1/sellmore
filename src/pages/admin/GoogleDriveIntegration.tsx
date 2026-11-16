import React, { useState } from 'react';
import { useStore, SYNC_INTERVAL_OPTIONS, SyncInterval, syncIntervalLabel } from '../../store/useStore';
import {
  FolderSync,
  CheckCircle2,
  Folder,
  Lock,
  RefreshCw,
  AlertCircle,
  UploadCloud,
  ExternalLink
} from 'lucide-react';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const GoogleDriveIntegration: React.FC = () => {
  const {
    currentPlan,
    driveConnected,
    driveSelectedFolder,
    driveSyncStatus,
    driveLastSync,
    driveSyncInterval,
    setSyncInterval,
    syncSource,
    connectDrive,
    disconnectDrive
  } = useStore();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedFolderName, setSelectedFolderName] = useState(driveSelectedFolder || 'Google Drive / Sales Team / Call Recordings 2026');
  const [isChangingFolder, setIsChangingFolder] = useState(false);

  const isFree = currentPlan === 'free';

  const availableFolders = [
    'Google Drive / Sales Team / Call Recordings 2026',
    'Google Drive / Executive Calls / Customer Conversations',
    'Google Drive / Zoom Cloud Backup / Audio MP3s',
    'Google Drive / Engineering Consultations'
  ];

  const handleSaveFolder = () => {
    connectDrive(selectedFolderName);
    setIsChangingFolder(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Google Drive Integration</h1>

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
                Google Drive Automated Retrieval is Locked on Free Plan
              </div>
              <div className="text-amber-800 mt-1 leading-relaxed">
                On the Free Plan, meeting recordings can be uploaded manually via file selector. Upgrade to Growth to enable automatic Google Drive folder polling.
              </div>
            </div>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg whitespace-nowrap transition-colors shadow-2xs shrink-0 text-center active:scale-[0.98]"
          >
            Upgrade to Connect Drive
          </button>
        </div>
      )}

      {/* Google Drive Connection Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <FolderSync className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Google Drive Workspace Connection</h3>
                {driveConnected && !isFree ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Sync
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {isFree ? 'Locked on Free' : 'Disconnected'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Authorizes SellMore to monitor a single specified directory. New MP4/MP3 recordings are queued for speech-to-text analysis automatically.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isFree ? (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> Unlock with Paid Plan
              </button>
            ) : driveConnected ? (
              <button
                onClick={disconnectDrive}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs active:scale-[0.98]"
              >
                Disconnect Drive
              </button>
            ) : (
              <button
                onClick={() => connectDrive(selectedFolderName)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all active:scale-[0.98]"
              >
                Connect Google Drive
              </button>
            )}
          </div>
        </div>

        {/* Selected Folder Picker */}
        {driveConnected && !isFree && (
          <div className="p-4.5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <Folder className="w-4 h-4 text-blue-600" />
                Monitored Source Folder
              </span>
              {!isChangingFolder && (
                <button
                  onClick={() => setIsChangingFolder(true)}
                  className="text-blue-600 hover:underline font-semibold text-[11px]"
                >
                  Change Selected Folder
                </button>
              )}
            </div>

            {isChangingFolder ? (
              <div className="space-y-2 pt-1">
                <select
                  value={selectedFolderName}
                  onChange={e => setSelectedFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  {availableFolders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsChangingFolder(false)}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFolder}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                  >
                    Save Selection
                  </button>
                </div>
              </div>
            ) : (
              <div className="font-mono text-slate-800 font-semibold bg-white px-3 py-2 rounded-lg border border-slate-200">
                {driveSelectedFolder}
              </div>
            )}
          </div>
        )}

        {/* Auto-fetch schedule + manual sync */}
        {driveConnected && !isFree && (
          <div className="p-4.5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                Auto-fetch Schedule
              </span>
              <span className="text-[11px] text-slate-500">
                Last sync: <span className="font-mono font-semibold text-slate-800">{driveLastSync || 'Never'}</span>
              </span>
            </div>
            <p className="text-slate-500">
              How often SellMore checks the folder for new recordings. They appear in the Meeting Library with source "Google Drive".
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={driveSyncInterval}
                onChange={e => setSyncInterval('drive', e.target.value as SyncInterval)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                aria-label="Google Drive auto-fetch frequency"
              >
                {SYNC_INTERVAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => syncSource('drive')}
                disabled={driveSyncStatus === 'retrieving'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${driveSyncStatus === 'retrieving' ? 'animate-spin' : ''}`} />
                {driveSyncStatus === 'retrieving' ? 'Syncing...' : 'Sync now'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Currently: {syncIntervalLabel(driveSyncInterval)}.</p>
          </div>
        )}

        {/* Manual Upload Reminder Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
          <UploadCloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Manual Upload Always Available</div>
            <p className="text-blue-800 text-[11px] mt-0.5">
              Regardless of Google Drive or CRM connectivity, all authorized users can upload MP4, MP3, and text transcript files directly from their browser at any time in the Global Meeting Library.
            </p>
          </div>
        </div>
      </div>

      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Google Drive Automation Locked"
        featureDescription="Automated Google Drive folder synchronization is available on Growth and Enterprise plans."
      />
    </div>
  );
};
