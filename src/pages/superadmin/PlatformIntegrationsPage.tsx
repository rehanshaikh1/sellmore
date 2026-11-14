import React, { useState } from 'react';
import { Database, Save, CheckCircle2 } from 'lucide-react';

export const PlatformIntegrationsPage: React.FC = () => {
  const [formats, setFormats] = useState('MP4, MP3, TXT');
  const [maxFileSize, setMaxFileSize] = useState('2048'); // 2GB
  const [maxDuration, setMaxDuration] = useState('240'); // 4 hours
  const [inviteExpiryHours, setInviteExpiryHours] = useState('48');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Configuration & Limits</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configurable global limits and integration settings. (PRD Section 14.1)
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Platform configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Supported Meeting File Formats</label>
          <input
            type="text"
            value={formats}
            onChange={e => setFormats(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">Comma-separated extension list. V1 baseline: MP4, MP3, TXT.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Upload File Size (MB)</label>
            <input
              type="number"
              value={maxFileSize}
              onChange={e => setMaxFileSize(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Call Duration (Minutes)</label>
            <input
              type="number"
              value={maxDuration}
              onChange={e => setMaxDuration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Team Invitation Link Expiration (Hours)</label>
          <input
            type="number"
            value={inviteExpiryHours}
            onChange={e => setInviteExpiryHours(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">Mandatory PRD Section 7.3 requirement: 48 hours.</p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-xs"
          >
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};
