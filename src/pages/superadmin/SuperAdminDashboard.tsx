import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Layers, Database, DollarSign, ArrowUpRight, AlertTriangle, PauseCircle, History } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const SuperAdminDashboard: React.FC = () => {
  const { platformTenants, platformPlans, platformLimits, platformActivity, platformCues } = useStore();

  const planOf = (id: string) => platformPlans.find(p => p.id === id);
  const active = platformTenants.filter(t => t.status === 'Active');
  const suspended = platformTenants.filter(t => t.status === 'Suspended');
  const mrr = active.reduce((sum, t) => sum + (planOf(t.plan)?.priceMonthly ?? 0), 0);
  const atQuota = active.filter(t => {
    const q = planOf(t.plan)?.meetingQuota;
    return q != null && t.meetingsUsed >= q;
  });
  const nearSeats = active.filter(t => {
    const s = planOf(t.plan)?.seats;
    return s != null && t.seatsUsed / s >= 0.9;
  });
  const recent = [...platformTenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const needsAttention = [
    ...atQuota.map(t => ({ id: `q_${t.id}`, name: t.name, text: 'has used its meeting quota. Upgrade the plan to let them continue.' })),
    ...nearSeats.map(t => ({ id: `s_${t.id}`, name: t.name, text: 'is at 90% or more of its seats.' })),
    ...suspended.map(t => ({ id: `x_${t.id}`, name: t.name, text: 'is suspended. Its users cannot sign in.' }))
  ];

  const card = 'bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all group';

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Super Admin Console</h1>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono uppercase">Platform operator</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Customer businesses, plans, default cues and upload limits for every tenant.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/platform/clients" className={card}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Tenants</span><Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">{platformTenants.length}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{active.length} active · {suspended.length} suspended</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Manage <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        <Link to="/platform/clients" className={card}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Monthly recurring revenue</span><DollarSign className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">${mrr.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-2">From active tenants on paid plans</div>
        </Link>

        <Link to="/platform/plans" className={card}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Plans on sale</span><Layers className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">{platformPlans.filter(p => p.active).length} of {platformPlans.length}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{platformCues.filter(c => c.enabled).length} default cues on</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Catalogue <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        <Link to="/platform/integrations" className={card}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Upload rules</span><Database className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-3 truncate">{platformLimits.formats}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Up to {platformLimits.maxFileSizeMb.toLocaleString()} MB · {platformLimits.inviteExpiryHours}h invites</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Rules <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Newest tenants</h2>
            <Link to="/platform/clients" className="text-xs font-semibold text-purple-600 hover:underline">View all &rarr;</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Meetings</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map(t => {
                  const plan = planOf(t.plan);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4"><div className="font-bold text-slate-900">{t.name}</div><div className="text-[10px] text-slate-400">{t.adminName}</div></td>
                      <td className="py-3 px-4 text-slate-800">{plan?.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{t.seatsUsed} / {plan?.seats ?? '∞'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{t.meetingsUsed} / {plan?.meetingQuota ?? '∞'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.status === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{t.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {recent.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">No tenants yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Needs attention</h2>
            </div>
            <ul className="divide-y divide-slate-100 text-xs">
              {needsAttention.map(n => (
                <li key={n.id} className="px-5 py-3 text-slate-600">
                  <span className="font-semibold text-slate-900">{n.name}</span> {n.text}
                </li>
              ))}
              {needsAttention.length === 0 && <li className="px-5 py-6 text-center text-slate-400">Nothing needs attention.</li>}
            </ul>
            {suspended.length > 0 && (
              <div className="px-5 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <PauseCircle className="w-3 h-3" /> Reactivate suspended tenants from Client Tenants.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent changes</h2>
            </div>
            <ul className="divide-y divide-slate-100 text-xs max-h-64 overflow-y-auto">
              {platformActivity.map(a => (
                <li key={a.id} className="px-5 py-3">
                  <div className="text-slate-700">{a.text}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(a.at).toLocaleString()}</div>
                </li>
              ))}
              {platformActivity.length === 0 && <li className="px-5 py-6 text-center text-slate-400">Changes you make here are listed.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
