import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const PlatformIntegrationsPage: React.FC = () => {
  const { platformLimits, updatePlatformLimits } = useStore();
  const [formats, setFormats] = useState(platformLimits.formats);
  const [maxFileSize, setMaxFileSize] = useState(String(platformLimits.maxFileSizeMb));
  const [maxDuration, setMaxDuration] = useState(String(platformLimits.maxDurationMin));
  const [inviteExpiryHours, setInviteExpiryHours] = useState(String(platformLimits.inviteExpiryHours));
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty =
    formats !== platformLimits.formats ||
    Number(maxFileSize) !== platformLimits.maxFileSizeMb ||
    Number(maxDuration) !== platformLimits.maxDurationMin ||
    Number(inviteExpiryHours) !== platformLimits.inviteExpiryHours;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const r = updatePlatformLimits({
      formats,
      maxFileSizeMb: Number(maxFileSize),
      maxDurationMin: Number(maxDuration),
      inviteExpiryHours: Number(inviteExpiryHours)
    });
    if (r.success) {
      setNotice({ ok: true, text: 'Platform limits saved. New uploads follow them straight away.' });
      setFormats(useStore.getState().platformLimits.formats);
    } else {
      setNotice({ ok: false, text: r.error || 'Could not save.' });
    }
  };

  const reset = () => {
    setFormats(platformLimits.formats);
    setMaxFileSize(String(platformLimits.maxFileSizeMb));
    setMaxDuration(String(platformLimits.maxDurationMin));
    setInviteExpiryHours(String(platformLimits.inviteExpiryHours));
    setNotice(null);
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Configuration & Limits</h1>
        <p className="text-xs text-slate-500 mt-1">
          Global upload rules for every business. The meeting upload window reads these.
        </p>
      </div>

      {notice && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${notice.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {notice.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Supported meeting file formats</label>
          <input type="text" value={formats} onChange={e => setFormats(e.target.value)} className={inputCls} />
          <p className="text-[11px] text-slate-400 mt-1">Comma-separated. SellMore can process MP4, MP3 and TXT.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max upload file size (MB)</label>
            <input type="number" min="1" value={maxFileSize} onChange={e => setMaxFileSize(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max call duration (minutes)</label>
            <input type="number" min="1" value={maxDuration} onChange={e => setMaxDuration(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Team invitation link expiry (hours)</label>
          <input type="number" min="1" value={inviteExpiryHours} onChange={e => setInviteExpiryHours(e.target.value)} className={inputCls} />
          <p className="text-[11px] text-slate-400 mt-1">Shown to admins when they invite a team member.</p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={reset} disabled={!dirty} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg disabled:opacity-40">
            Discard changes
          </button>
          <button type="submit" disabled={!dirty} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
            Save platform settings
          </button>
        </div>
      </form>
    </div>
  );
};
