import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import {
  BarChart3, CalendarDays, Download, Video, Target, BriefcaseBusiness,
  CheckCircle2, Clock3, Coins, TrendingUp, Activity, Filter, AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

type RangeKey = '7' | '30' | '90' | 'all';
const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#e11d48', '#64748b'];
const safeArray = <T,>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const text = (value: unknown, fallback = '—') => value === undefined || value === null || value === '' ? fallback : String(value);
const dateFrom = (value: unknown): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  // Demo records sometimes use labels such as "Today" or "Just now".
  if (/today|just now/i.test(value)) return new Date();
  return null;
};
const inRange = (value: unknown, days: number) => {
  if (days === 0) return true;
  const date = dateFrom(value);
  if (!date) return true; // Keep undated demo records visible; disclose this in the UI.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
};
const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

export const AnalyticsPage: React.FC = () => {
  const {
    currentRole, currentUser, currentPlan, creditBalance, creditTransactions,
    teamMembers, meetings, deals, mockMeetings
  } = useStore();

  const [range, setRange] = useState<RangeKey>('30');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dealStageFilter, setDealStageFilter] = useState('all');
  const [activeReport, setActiveReport] = useState<'overview' | 'meetings' | 'sales' | 'usage'>('overview');
  const days = range === 'all' ? 0 : Number(range);

  const { scope, assignedReps } = useAccess();
  const assignedRepIds = useMemo(() => assignedReps.map(r => r.id), [assignedReps]);

  // Role scope is applied before any filter or metric is calculated, using the
  // central manager ↔ rep relationship: rep = own, manager = assigned team, admin = all.
  const scoped = useMemo(() => {
    const allMembers = safeArray<any>(teamMembers);
    const ownerOf = (x: any) => String(x.representativeId ?? x.ownerId ?? x.userId ?? '');
    const members =
      currentRole === 'client_admin' || currentRole === 'super_admin' ? allMembers
        : currentRole === 'manager' ? allMembers.filter(m => assignedRepIds.includes(String(m.id)))
          : [] as any[];
    return {
      meetings: scope(safeArray<any>(meetings), (m: any) => ownerOf(m)),
      deals: scope(safeArray<any>(deals), (d: any) => d.ownerId),
      mocks: scope(safeArray<any>(mockMeetings), (m: any) => ownerOf(m)),
      credits: currentRole === 'sales_rep' || currentRole === 'manager'
        ? scope(safeArray<any>(creditTransactions), (c: any) => ownerOf(c))
        : safeArray<any>(creditTransactions),
      members
    };
  }, [meetings, deals, mockMeetings, creditTransactions, teamMembers, currentRole, scope, assignedRepIds]);

  const filtered = useMemo(() => {
    const ownerMatches = (id: unknown) => ownerFilter === 'all' || String(id ?? '') === ownerFilter;
    return {
      meetings: scoped.meetings.filter(m => inRange(m.uploadDate, days) && ownerMatches(m.representativeId)),
      deals: scoped.deals.filter(d => ownerMatches(d.ownerId) && (dealStageFilter === 'all' || String(d.stage ?? '') === dealStageFilter)),
      mocks: scoped.mocks.filter(m => inRange(m.date ?? m.createdAt ?? m.created_at, days) && ownerMatches(m.representativeId ?? m.ownerId ?? m.userId)),
      credits: scoped.credits.filter(c => inRange(c.date, days))
    };
  }, [scoped, days, ownerFilter, dealStageFilter]);

  const analysedMeetings = filtered.meetings.filter(m => String(m.processingStatus).toLowerCase() === 'analysed');
  const scores = analysedMeetings.map(m => asNumber(m.overallScorePercent)).filter(n => n > 0);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const wonDeals = filtered.deals.filter(d => /won/i.test(String(d.stage ?? ''))).length;
  const openDeals = filtered.deals.filter(d => !/won|lost/i.test(String(d.stage ?? ''))).length;
  const pipelineValue = filtered.deals.filter(d => !/lost/i.test(String(d.stage ?? ''))).reduce((sum, d) => sum + asNumber(d.amount), 0);
  const lostDeals = filtered.deals.filter(d => /lost/i.test(String(d.stage ?? ''))).length;
  const consumedCredits = filtered.credits.reduce((sum, c) => sum + Math.max(0, asNumber(c.creditsConsumed)), 0);
  const remaining = asNumber(creditBalance);
  const averageDaily = days ? Math.round(consumedCredits / days) : 0;

  const usageBreakdown = useMemo(() => {
    const buckets = new Map<string, number>();
    filtered.credits.forEach(c => {
      const amount = Math.max(0, asNumber(c.creditsConsumed));
      if (!amount) return;
      const activity = String(c.activity ?? 'Other usage');
      const key = /meeting|analysis|speech|cue/i.test(activity) ? 'Meeting Analyse'
        : /live assist|copilot/i.test(activity) ? 'Live Assist'
          : /mock|roleplay/i.test(activity) ? 'Mock Meetings'
            : /practice|drill/i.test(activity) ? 'Practice'
              : 'Other AI usage';
      buckets.set(key, (buckets.get(key) ?? 0) + amount);
    });
    return Array.from(buckets, ([name, value]) => ({ name, value }));
  }, [filtered.credits]);

  const trendData = useMemo(() => {
    const buckets = new Map<string, number>();
    filtered.credits.forEach(c => {
      const d = dateFrom(c.date);
      if (!d) return;
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      buckets.set(key, (buckets.get(key) ?? 0) + Math.max(0, asNumber(c.creditsConsumed)));
    });
    return Array.from(buckets, ([day, credits]) => ({ day, credits })).slice(-14);
  }, [filtered.credits]);

  const agentData = useMemo(() => {
    const buckets = new Map<string, number>();
    filtered.credits.forEach(c => {
      const activity = String(c.activity ?? 'General AI usage');
      buckets.set(activity, (buckets.get(activity) ?? 0) + Math.max(0, asNumber(c.creditsConsumed)));
    });
    return Array.from(buckets, ([agent, credits]) => ({ agent: agent.length > 25 ? `${agent.slice(0, 22)}…` : agent, credits })).sort((a, b) => b.credits - a.credits).slice(0, 7);
  }, [filtered.credits]);

  const stageData = useMemo(() => {
    const buckets = new Map<string, number>();
    scoped.deals.forEach(d => buckets.set(String(d.stage ?? 'Unstaged'), (buckets.get(String(d.stage ?? 'Unstaged')) ?? 0) + 1));
    return Array.from(buckets, ([stage, count]) => ({ stage, count }));
  }, [scoped.deals]);

  const repPerformance = useMemo(() => {
    const people = currentRole === 'sales_rep' ? [{ id: currentUser?.id, name: currentUser?.name }] : scoped.members;
    return people.map((person: any) => {
      const repMeetings = filtered.meetings.filter(m => String(m.representativeId ?? '') === String(person.id));
      const repScores = repMeetings.filter(m => String(m.processingStatus).toLowerCase() === 'analysed').map(m => asNumber(m.overallScorePercent)).filter(n => n > 0);
      const repDeals = filtered.deals.filter(d => String(d.ownerId ?? '') === String(person.id));
      return { id: person.id, name: text(person.name, 'Representative'), meetings: repMeetings.length, avgScore: repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0, deals: repDeals.length, won: repDeals.filter(d => /won/i.test(String(d.stage ?? ''))).length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [currentRole, currentUser, scoped.members, filtered.meetings, filtered.deals]);

  const roleTitle = currentRole === 'super_admin' ? 'Platform Analytics' : currentRole === 'client_admin' ? 'Company Analytics' : currentRole === 'manager' ? 'Team Analytics' : 'My Performance Analytics';
  const scopeLabel = currentRole === 'super_admin' ? 'Available workspace data · platform aggregation requires tenant-level reporting API' : currentRole === 'client_admin' ? 'All users and activity in this company workspace' : currentRole === 'manager' ? 'Your own activity and explicitly assigned representatives' : 'Your personal sales and AI activity';
  const ownerOptions = currentRole === 'sales_rep' ? [] : scoped.members;

  const exportCsv = () => {
    const rows = [
      ['Report', 'Metric', 'Value'],
      ['Summary', 'Meetings', filtered.meetings.length],
      ['Summary', 'Analysed meetings', analysedMeetings.length],
      ['Summary', 'Average analysis score (%)', averageScore],
      ['Summary', 'Deals', filtered.deals.length],
      ['Summary', 'Open deals', openDeals],
      ['Summary', 'Pipeline value', pipelineValue],
      ['Summary', 'Closed won deals', wonDeals],
      ['Summary', 'Closed lost deals', lostDeals],
      ['Summary', 'Credits consumed', consumedCredits],
      ...repPerformance.map(r => ['Representative', r.name, `Meetings: ${r.meetings}; Avg score: ${r.avgScore}%; Deals: ${r.deals}; Won: ${r.won}`])
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sellmore-analytics-${range === 'all' ? 'all-time' : `last-${range}-days`}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const Stat = ({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: React.ElementType }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500">{label}</span><span className="rounded-lg bg-slate-50 p-2 text-slate-500"><Icon className="h-4 w-4" /></span></div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );

  const ChartCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-w-0">
      <div className="mb-4"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
      {children}
    </section>
  );

  const EmptyChart = ({ message }: { message: string }) => <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-center text-sm text-slate-500 px-6">{message}</div>;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700"><BarChart3 className="h-4 w-4" /> Reports & Insights</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{roleTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">{scopeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4" /><select aria-label="Reporting period" value={range} onChange={e => setRange(e.target.value as RangeKey)} className="bg-transparent outline-none"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select></label>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      </header>

      {currentRole === 'super_admin' && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Platform reporting data boundary</p><p className="mt-1">This frontend store contains one workspace's records, not a tenant registry or cross-tenant usage feed. The figures below reflect only the records currently supplied to this page. Connect platform aggregation APIs before presenting these as global totals.</p></div></div>}
      {currentRole === 'manager' && assignedRepIds.length === 0 && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">No representative assignments found</p><p className="mt-1">Only the manager's own records can be included until assigned representative IDs are configured on the manager user record.</p></div></div>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Filter className="h-3.5 w-3.5" /> Filters</div>
        {ownerOptions.length > 0 && <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="all">All visible representatives</option>{ownerOptions.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
        <select value={dealStageFilter} onChange={e => setDealStageFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="all">All deal stages</option>{Array.from(new Set(scoped.deals.map(d => String(d.stage ?? 'Unstaged')))).map(stage => <option key={stage} value={stage}>{stage}</option>)}</select>
        <span className="text-xs text-slate-500">{filtered.meetings.length} meetings · {filtered.deals.length} deals</span>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{([['overview', 'Overview'], ['meetings', 'Meetings & Analysis'], ['sales', 'Sales & Team'], ['usage', 'AI Usage & Credits']] as const).map(([key, label]) => <button key={key} onClick={() => setActiveReport(key)} className={`rounded-lg px-3 py-2 text-sm font-medium ${activeReport === key ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{label}</button>)}</nav>

      {activeReport === 'overview' && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Meetings in period" value={formatNumber(filtered.meetings.length)} detail={`${analysedMeetings.length} successfully analysed`} icon={Video} />
          <Stat label="Average analysis score" value={scores.length ? `${averageScore}%` : '—'} detail={`${scores.length} scored meetings · analysed only`} icon={Target} />
          <Stat label="Open deals" value={formatNumber(openDeals)} detail={`${formatNumber(pipelineValue)} total open pipeline value`} icon={BriefcaseBusiness} />
          <Stat label="Closed won" value={formatNumber(wonDeals)} detail={`${formatNumber(lostDeals)} closed lost`} icon={CheckCircle2} />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title="Meeting analysis trend" description="Completed meeting scores by upload date. Only records with a score are included.">
            {analysedMeetings.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analysedMeetings.slice().reverse().map(m => ({ meeting: String(m.name ?? 'Meeting').slice(0, 16), score: asNumber(m.overallScorePercent) }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="meeting" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="score" name="Score (%)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <EmptyChart message="No completed meeting scores are available for this period." />}
          </ChartCard>
          <ChartCard title="Deal pipeline by stage" description="Count of visible deals in each current stage.">
            {stageData.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={stageData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="stage" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Deals" fill="#0d9488" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyChart message="No deals are available in this role's scope." />}
          </ChartCard>
        </div>
      </>}

      {activeReport === 'meetings' && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total meetings" value={filtered.meetings.length} detail="Within selected period" icon={Video} /><Stat label="Analysed" value={analysedMeetings.length} detail="Completed analysis reports" icon={CheckCircle2} /><Stat label="Processing" value={filtered.meetings.filter(m => /processing/i.test(String(m.processingStatus))).length} detail="Analysis currently in progress" icon={Clock3} /><Stat label="Average score" value={scores.length ? `${averageScore}%` : '—'} detail="Scored analysed meetings" icon={Target} /></div>
        <ChartCard title="Meeting analysis records" description="Latest meeting records visible to your role, including their processing state and score.">
          {filtered.meetings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Meeting</th><th className="py-3 pr-4">Representative</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Status</th><th className="py-3">Score</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.meetings.slice().sort((a, b) => String(b.uploadDate).localeCompare(String(a.uploadDate))).map(m => <tr key={m.id}><td className="py-3 pr-4 font-medium text-slate-800">{text(m.name)}</td><td className="py-3 pr-4 text-slate-600">{text(m.representativeName)}</td><td className="py-3 pr-4 text-slate-600">{text(m.uploadDate)}</td><td className="py-3 pr-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{text(m.processingStatus)}</span></td><td className="py-3 font-semibold text-slate-800">{asNumber(m.overallScorePercent) ? `${asNumber(m.overallScorePercent)}%` : '—'}</td></tr>)}</tbody></table></div> : <EmptyChart message="No meeting records match the selected filters." />}
        </ChartCard>
      </>}

      {activeReport === 'sales' && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total deals" value={filtered.deals.length} detail="Deals in selected stage filter" icon={BriefcaseBusiness} /><Stat label="Won deals" value={wonDeals} detail="Current stage contains Won" icon={TrendingUp} /><Stat label="Open pipeline" value={formatNumber(pipelineValue)} detail="Sum of available deal amounts" icon={Coins} /><Stat label="Closed won / lost" value={`${wonDeals} / ${lostDeals}`} detail="Deals in the selected scope" icon={CheckCircle2} /></div>
        {(currentRole === 'client_admin' || currentRole === 'manager' || currentRole === 'super_admin') && <ChartCard title="Representative performance" description="Meeting volume, average analysed score and deal outcomes for representatives in the current scope.">
          {repPerformance.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Representative</th><th className="py-3 pr-4">Meetings</th><th className="py-3 pr-4">Avg. score</th><th className="py-3 pr-4">Deals</th><th className="py-3">Won</th></tr></thead><tbody className="divide-y divide-slate-100">{repPerformance.map(r => <tr key={String(r.id)}><td className="py-3 pr-4 font-medium text-slate-800">{r.name}</td><td className="py-3 pr-4">{r.meetings}</td><td className="py-3 pr-4">{r.avgScore ? `${r.avgScore}%` : '—'}</td><td className="py-3 pr-4">{r.deals}</td><td className="py-3">{r.won}</td></tr>)}</tbody></table></div> : <EmptyChart message="No representative-level records are available for this scope." />}
        </ChartCard>}
        <ChartCard title="Mock meeting & practice activity" description="Mock meeting sessions recorded in the selected period.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Sessions</p><p className="mt-1 text-2xl font-bold text-slate-900">{filtered.mocks.length}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Average score</p><p className="mt-1 text-2xl font-bold text-slate-900">{filtered.mocks.length ? `${Math.round(filtered.mocks.reduce((s, m) => s + asNumber(m.score), 0) / filtered.mocks.length)}%` : '—'}</p></div></div>
        </ChartCard>
      </>}

      {activeReport === 'usage' && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Credits consumed" value={formatNumber(consumedCredits)} detail="Positive consumption ledger entries" icon={Coins} /><Stat label="Credits remaining" value={formatNumber(remaining)} detail={`Current ${text(currentPlan)} plan balance`} icon={Sparkles} /><Stat label="Average / day" value={formatNumber(averageDaily)} detail={days ? `Selected ${days}-day period` : 'All-time period has no daily average'} icon={Activity} /><Stat label="Ledger entries" value={filtered.credits.length} detail="Credit transactions in period" icon={DatabaseIcon} /></div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title="Credit consumption by usage" description="Categorised from credit ledger activity descriptions; amounts are credits.">
            {usageBreakdown.length ? <><div className="h-60"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={usageBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{usageBreakdown.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => [`${v} credits`, 'Consumed']} /><Legend /></PieChart></ResponsiveContainer></div></> : <EmptyChart message="No credit consumption transactions are available for this period." />}
          </ChartCard>
          <ChartCard title="Credits by AI activity" description="Top ledger activity labels by positive credit consumption.">
            {agentData.length ? <div className="h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={agentData} layout="vertical" margin={{ left: 15 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis type="category" dataKey="agent" width={135} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="credits" name="Credits" fill="#2563eb" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyChart message="No AI activity labels with credit consumption were found." />}
          </ChartCard>
          <ChartCard title="Daily credit consumption" description="Transactions with parseable dates; undated demo entries are excluded from this chart.">
            {trendData.length ? <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="credits" stroke="#0d9488" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div> : <EmptyChart message="No dated credit transactions are available for the trend chart." />}
          </ChartCard>
          <ChartCard title="Credit ledger" description="Recent credit events included in this report.">
            {filtered.credits.length ? <div className="max-h-56 space-y-2 overflow-y-auto">{filtered.credits.slice(0, 10).map(c => <div key={c.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{text(c.activity)}</p><p className="text-xs text-slate-500">{text(c.date)}</p></div><span className={`shrink-0 text-sm font-semibold ${asNumber(c.creditsConsumed) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{asNumber(c.creditsConsumed) > 0 ? '-' : '+'}{formatNumber(Math.abs(asNumber(c.creditsConsumed)))} cr</span></div>)}</div> : <EmptyChart message="No credit ledger entries match this period." />}
          </ChartCard>
        </div>
        <p className="text-xs text-slate-500">Credit reporting uses the current store's credit ledger. AI model, cache savings and per-agent identifiers are not stored as structured fields in the supplied store, so they are not estimated or displayed as factual metrics.</p>
      </>}

      <footer className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Report scope: {scopeLabel}</span><span>Figures are calculated from records currently available in the application store.</span></footer>
    </div>
  );
};

// Kept local so the component does not depend on an additional icon import alias.
const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => <Activity className={className} />;
