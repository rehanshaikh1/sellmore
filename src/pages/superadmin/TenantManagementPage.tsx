import React, { useState } from 'react';
import { Search, Plus, X, Pencil, Trash2, PauseCircle, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PlanTier, PlatformTenant } from '../../types';

export const TenantManagementPage: React.FC = () => {
  const { platformTenants, platformPlans, addTenant, updateTenant, changeTenantPlan, setTenantStatus, deleteTenant } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'quota'>('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState<'all' | PlanTier>('all');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', adminName: '', adminEmail: '', plan: 'starter' as PlanTier });
  const [formError, setFormError] = useState('');

  const [editing, setEditing] = useState<PlatformTenant | null>(null);
  const [editForm, setEditForm] = useState({ name: '', adminName: '', adminEmail: '', renewal: '', notes: '' });
  const [editError, setEditError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<PlatformTenant | null>(null);

  const planOf = (id: PlanTier) => platformPlans.find(p => p.id === id);
  const atQuota = (t: PlatformTenant) => {
    const quota = planOf(t.plan)?.meetingQuota;
    return quota !== null && quota !== undefined && t.meetingsUsed >= quota;
  };

  const report = (r: { success: boolean; error?: string }, ok: string) =>
    setNotice(r.success ? { ok: true, text: ok } : { ok: false, text: r.error || 'That did not work.' });

  const activeTenantFilter = platformTenants.some(t => t.id === tenantFilter) ? tenantFilter : 'all';
  const filtered = platformTenants.filter(t => {
    if (activeTenantFilter !== 'all' && t.id !== activeTenantFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.adminName.toLowerCase().includes(q) && !t.adminEmail.toLowerCase().includes(q)) return false;
    if (planFilter !== 'all' && t.plan !== planFilter) return false;
    if (statusFilter === 'quota') return atQuota(t);
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addTenant(form);
    if (!r.success) { setFormError(r.error || ''); return; }
    setShowAdd(false);
    setForm({ name: '', adminName: '', adminEmail: '', plan: 'starter' });
    setFormError('');
    report(r, `Tenant ${form.name.trim()} created.`);
  };

  const openEdit = (t: PlatformTenant) => {
    setEditing(t);
    setEditForm({ name: t.name, adminName: t.adminName, adminEmail: t.adminEmail, renewal: t.renewal, notes: t.notes || '' });
    setEditError('');
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const r = updateTenant(editing.id, editForm);
    if (!r.success) { setEditError(r.error || ''); return; }
    setEditing(null);
    report(r, 'Tenant details saved.');
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden';
  const activePlans = platformPlans.filter(p => p.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenant & Client Management</h1>
          <p className="text-xs text-slate-500 mt-1">Create customer businesses, move them between plans, and suspend or remove them.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Tenant
        </button>
      </div>

      {notice && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${notice.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <span className="flex items-center gap-2">
            {notice.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <input
            type="text"
            placeholder="Search business, administrator or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
        <select value={activeTenantFilter} onChange={e => setTenantFilter(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 max-w-[220px]" aria-label="Filter by tenant">
          <option value="all">All tenants</option>
          {platformTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value as 'all' | PlanTier)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700">
          <option value="all">All plans</option>
          {platformPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700">
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="quota">At meeting quota</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} of {platformTenants.length} tenants</span>
        {(tenantFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button onClick={() => { setTenantFilter('all'); setPlanFilter('all'); setStatusFilter('all'); setSearch(''); }} className="text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Meetings</th>
                <th className="py-3 px-4">Renews</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const plan = planOf(t.plan);
                const quota = plan?.meetingQuota;
                const full = atQuota(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.id} · since {t.createdAt}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{t.adminName}</div>
                      <div className="text-[10px] text-slate-400">{t.adminEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={t.plan}
                        onChange={e => report(changeTenantPlan(t.id, e.target.value as PlanTier), `${t.name} moved to ${planOf(e.target.value as PlanTier)?.name}.`)}
                        className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-800"
                        aria-label={`Plan for ${t.name}`}
                      >
                        {platformPlans.filter(p => p.active || p.id === t.plan).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{t.seatsUsed} / {plan?.seats ?? '∞'}</td>
                    <td className={`py-3 px-4 font-mono text-[11px] ${full ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                      {t.meetingsUsed} / {quota ?? '∞'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.renewal}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'Suspended' ? 'bg-rose-50 text-rose-700' : full ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {t.status === 'Suspended' ? 'Suspended' : full ? 'At quota' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="Edit details" aria-label={`Edit ${t.name}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {t.status === 'Active' ? (
                          <button onClick={() => report(setTenantStatus(t.id, 'Suspended'), `${t.name} suspended.`)} className="p-1.5 rounded-md text-slate-500 hover:text-amber-700 hover:bg-amber-50" title="Suspend tenant" aria-label={`Suspend ${t.name}`}>
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => report(setTenantStatus(t.id, 'Active'), `${t.name} reactivated.`)} className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50" title="Reactivate tenant" aria-label={`Reactivate ${t.name}`}>
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setConfirmDelete(t)} className="p-1.5 rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50" title="Delete tenant" aria-label={`Delete ${t.name}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400">No tenants match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={submitAdd} className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Tenant</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {formError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{formError}</div>}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business name</label>
                <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Helix Robotics Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Administrator name</label>
                  <input className={inputCls} value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Administrator email</label>
                  <input className={inputCls} type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan</label>
                <select className={inputCls + ' bg-white'} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value as PlanTier })}>
                  {activePlans.map(p => <option key={p.id} value={p.id}>{p.name} · {p.priceMonthly ? `$${p.priceMonthly}/mo` : 'Free'}</option>)}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Create tenant</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={submitEdit} className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Edit {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {editError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{editError}</div>}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business name</label>
                <input className={inputCls} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Administrator</label>
                  <input className={inputCls} value={editForm.adminName} onChange={e => setEditForm({ ...editForm, adminName: e.target.value })} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input className={inputCls} value={editForm.adminEmail} onChange={e => setEditForm({ ...editForm, adminEmail: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Renewal date</label>
                <input className={inputCls} value={editForm.renewal} onChange={e => setEditForm({ ...editForm, renewal: e.target.value })} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal notes</label>
                <textarea className={inputCls} rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Only visible to platform operators" />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Delete {confirmDelete.name}?</h3>
            <p className="text-slate-600 leading-relaxed">
              This removes the tenant from the platform directory. Its users lose access. This cannot be undone. To keep the data and only block access, suspend the tenant instead.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
              <button
                onClick={() => { const name = confirmDelete.name; report(deleteTenant(confirmDelete.id), `${name} deleted.`); setConfirmDelete(null); }}
                className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700"
              >
                Delete tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
