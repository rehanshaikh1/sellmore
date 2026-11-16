import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Pencil, X, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PlatformPlan } from '../../types';

interface PlanForm {
  name: string;
  priceMonthly: string;
  seats: string;
  meetingQuota: string;
  credits: string;
  features: string;
}

const toForm = (p: PlatformPlan): PlanForm => ({
  name: p.name,
  priceMonthly: String(p.priceMonthly),
  seats: p.seats === null ? '' : String(p.seats),
  meetingQuota: p.meetingQuota === null ? '' : String(p.meetingQuota),
  credits: String(p.credits),
  features: p.features.join('\n')
});

export const PlatformPlansPage: React.FC = () => {
  const { platformPlans, platformTenants, updatePlatformPlan } = useStore();
  const [editing, setEditing] = useState<PlatformPlan | null>(null);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const openEdit = (p: PlatformPlan) => { setEditing(p); setForm(toForm(p)); setError(''); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form) return;
    const r = updatePlatformPlan(editing.id, {
      name: form.name,
      priceMonthly: Number(form.priceMonthly),
      // An empty box means unlimited.
      seats: form.seats.trim() === '' ? null : Number(form.seats),
      meetingQuota: form.meetingQuota.trim() === '' ? null : Number(form.meetingQuota),
      credits: Number(form.credits),
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean)
    });
    if (!r.success) { setError(r.error || ''); return; }
    setEditing(null);
    setNotice({ ok: true, text: `${form.name.trim()} updated.` });
  };

  const toggleActive = (p: PlatformPlan) => {
    const r = updatePlatformPlan(p.id, { active: !p.active });
    setNotice(r.success ? { ok: true, text: `${p.name} ${p.active ? 'switched off' : 'switched on'}.` } : { ok: false, text: r.error || '' });
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden';

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Plan Catalogue & Entitlements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Set price, seat and meeting limits and included features. Changes show up in tenant limits and in the Free plan's meeting cap.
        </p>
      </div>

      {notice && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${notice.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <span className="flex items-center gap-2">{notice.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
        {platformPlans.map(p => {
          const tenants = platformTenants.filter(t => t.plan === p.id);
          return (
            <div key={p.id} className={`bg-white p-5 rounded-xl border shadow-2xs flex flex-col justify-between gap-4 ${p.active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                  {!p.active && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Off</span>}
                </div>
                <div className="font-mono text-xl font-extrabold text-blue-600 mt-1">{p.priceMonthly ? `$${p.priceMonthly}/mo` : '$0'}</div>
                <div className="mt-3 space-y-1 font-mono text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                  <div>Seats: <strong className="text-slate-800">{p.seats ?? 'Unlimited'}</strong></div>
                  <div>Meetings: <strong className="text-slate-800">{p.meetingQuota ?? 'Unlimited'}</strong></div>
                  <div>Credits: <strong className="text-slate-800">{p.credits ? `${p.credits.toLocaleString()}/mo` : 'Pay as you go'}</strong></div>
                </div>
                <ul className="mt-3 space-y-1 text-slate-500 text-[11px]">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{tenants.length} tenant{tenants.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => openEdit(p)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5">
                    <Pencil className="w-3 h-3" /> Edit plan
                  </button>
                  {p.id !== 'free' && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input type="checkbox" checked={p.active} onChange={() => toggleActive(p)} className="rounded border-slate-300 text-blue-600" />
                      On sale
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={save} className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Edit {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {error && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan name</label>
                  <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price per month (USD)</label>
                  <input className={inputCls} type="number" min="0" value={form.priceMonthly} onChange={e => setForm({ ...form, priceMonthly: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seats</label>
                  <input className={inputCls} type="number" min="1" placeholder="Unlimited" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meetings</label>
                  <input className={inputCls} type="number" min="1" placeholder="Unlimited" value={form.meetingQuota} onChange={e => setForm({ ...form, meetingQuota: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credits per month</label>
                  <input className={inputCls} type="number" min="0" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 -mt-2">Leave seats or meetings empty for unlimited.</p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Included features (one per line)</label>
                <textarea className={inputCls} rows={5} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Save plan</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
