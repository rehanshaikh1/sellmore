import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { User, Building2, Bell, Shield, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, currentRole } = useStore();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [title, setTitle] = useState(currentUser.title);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, notification thresholds, and tenant configuration.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">Personal Profile</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Email</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-mono cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Tenant Role</label>
            <input
              type="text"
              disabled
              value={currentRole.replace('_', ' ').toUpperCase()}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-mono font-bold cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
