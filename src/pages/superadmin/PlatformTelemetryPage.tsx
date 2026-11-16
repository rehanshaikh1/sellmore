import React, { useMemo, useState } from 'react';
import { Search, Building2, Users, Video, Gauge } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { useStore } from '../../store/useStore';
import { PlanTier, PlatformPlan, PlatformTenant } from '../../types';

const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#e11d48'];
type Level = 'all' | 'over' | 'high' | 'normal' | 'unlimited';

const pct = (used: number, limit: number | null) => (limit ? Math.round((used / limit) * 100) : null);
/** Highest of seat and meeting use, so a tenant close to either limit is flagged. */
const level = (t: PlatformTenant, plan?: PlatformPlan): Exclude<Level, 'all'> => {
  const m = pct(t.meetingsUsed, plan?.meetingQuota ?? null);
  const s = pct(t.seatsUsed, plan?.seats ?? null);
  const top = Math.max(m ?? -1, s ?? -1);
  if (top < 0) return 'unlimited';
  if (top >= 100) return 'over';
  if (top >= 80) return 'high';
  return 'normal';
};

const LEVEL_LABEL: Record<Exclude<Level, 'all'>, { text: string; cls: string }> = {
  over: { text: 'At limit', cls: 'bg-rose-50 text-rose-700' },
  high: { text: 'Near limit', cls: 'bg-amber-50 text-amber-700' },
  normal: { text: 'Healthy', cls: 'bg-emerald-50 text-emerald-700' },
  unlimited: { text: 'No limits', cls: 'bg-slate-100 text-slate-600' }
};

const Bar2: React.FC<{ value: number | null }> = ({ value }) => (
  value === null ? <span className="text-slate-400">—</span> : (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${value >= 100 ? 'bg-rose-500' : value >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono text-[11px] text-slate-600">{value}%</span>
    </div>
  )
);

export const PlatformTelemetryPage: React.FC = () => {
  const { platformTenants, platformPlans } = useStore();

  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState<'all' | PlanTier>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended'>('all');
  const [levelFilter, setLevelFilter] = useState<Level>('all');
  const [sortBy, setSortBy] = useState<'meetings' | 'seats' | 'name'>('meetings');

  const planOf = (id: PlanTier) => platformPlans.find(p => p.id === id);
  const activeTenantFilter = platformTenants.some(t => t.id === tenantFilter) ? tenantFilter : 'all';

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return platformTenants
      .filter(t => (activeTenantFilter === 'all' || t.id === activeTenantFilter)
        && (planFilter === 'all' || t.plan === planFilter)
        && (statusFilter === 'all' || t.status === statusFilter)
        && (levelFilter === 'all' || level(t, planOf(t.plan)) === levelFilter)
        && (!q || t.name.toLowerCase().includes(q) || t.adminName.toLowerCase().includes(q)))
      .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : sortBy === 'seats' ? b.seatsUsed - a.seatsUsed : b.meetingsUsed - a.meetingsUsed);
  }, [platformTenants, platformPlans, search, activeTenantFilter, planFilter, statusFilter, levelFilter, sortBy]);

  const totals = {
    tenants: rows.length,
    seats: rows.reduce((s, t) => s + t.seatsUsed, 0),
    meetings: rows.reduce((s, t) => s + t.meetingsUsed, 0),
    atLimit: rows.filter(t => level(t, planOf(t.plan)) === 'over').length
  };

  const byPlan = platformPlans
    .map(p => ({ name: p.name.replace(' Plan', '').replace(' Evaluation', ''), meetings: rows.filter(t => t.plan === p.id).reduce((s, t) => s + t.meetingsUsed, 0) }))
    .filter(d => d.meetings > 0);
  const topTenants = rows.slice(0, 6).map(t => ({ name: t.name.split(' ')[0], meetings: t.meetingsUsed, seats: t.seatsUsed }));
  const filtersOn = search || activeTenantFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all' || levelFilter !== 'all';

  const sel = 'px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700';

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usage Telemetry</h1>
        <p className="text-xs text-slate-500 mt-1">Seats and meeting analysis used by each customer business, against what its plan allows.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64 max-w-full">
          <input type="text" placeholder="Search tenant or administrator..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
        <select aria-label="Filter by tenant" value={activeTenantFilter} onChange={e => setTenantFilter(e.target.value)} className={sel + ' max-w-[220px]'}>
          <option value="all">All tenants</option>
          {platformTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select aria-label="Filter by plan" value={planFilter} onChange={e => setPlanFilter(e.target.value as 'all' | PlanTier)} className={sel}>
          <option value="all">All plans</option>
          {platformPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className={sel}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select aria-label="Filter by usage level" value={levelFilter} onChange={e => setLevelFilter(e.target.value as Level)} className={sel}>
          <option value="all">Any usage level</option>
          <option value="over">At limit (100%+)</option>
          <option value="high">Near limit (80%+)</option>
          <option value="normal">Healthy (under 80%)</option>
          <option value="unlimited">No limits</option>
        </select>
        <select aria-label="Sort by" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className={sel}>
          <option value="meetings">Sort: most meetings</option>
          <option value="seats">Sort: most seats</option>
          <option value="name">Sort: name</option>
        </select>
        {filtersOn && (
          <button onClick={() => { setSearch(''); setTenantFilter('all'); setPlanFilter('all'); setStatusFilter('all'); setLevelFilter('all'); }} className="text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tenants shown', value: totals.tenants, icon: Building2 },
          { label: 'Seats in use', value: totals.seats, icon: Users },
          { label: 'Meetings analysed', value: totals.meetings, icon: Video },
          { label: 'Tenants at a limit', value: totals.atLimit, icon: Gauge }
        ].map(c => (
          <div key={c.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500"><span className="font-medium">{c.label}</span><c.icon className="w-4 h-4 text-slate-400" /></div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-3">{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Meetings by tenant</h2>
            <p className="text-[11px] text-slate-400 mb-3">Highest six in the current filter.</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTenants}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="meetings" name="Meetings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seats" name="Seats" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Meetings by plan</h2>
            <p className="text-[11px] text-slate-400 mb-3">Where analysis volume comes from.</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPlan} dataKey="meetings" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Seat use</th>
                <th className="py-3 px-4">Meetings</th>
                <th className="py-3 px-4">Meeting use</th>
                <th className="py-3 px-4">Usage level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(t => {
                const plan = planOf(t.plan);
                const lv = LEVEL_LABEL[level(t, plan)];
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.status === 'Suspended' ? 'Suspended · ' : ''}{t.adminName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{plan?.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{t.seatsUsed} / {plan?.seats ?? '∞'}</td>
                    <td className="py-3 px-4"><Bar2 value={pct(t.seatsUsed, plan?.seats ?? null)} /></td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{t.meetingsUsed} / {plan?.meetingQuota ?? '∞'}</td>
                    <td className="py-3 px-4"><Bar2 value={pct(t.meetingsUsed, plan?.meetingQuota ?? null)} /></td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${lv.cls}`}>{lv.text}</span></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-400">No tenants match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
