import React, { useState } from 'react';
import { Building2, Search, Filter, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export const TenantManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const TENANTS = [
    { id: 'ten_001', name: 'Apex Precision Engineering Ltd', admin: 'Sarah Lin', plan: 'Growth ($249)', seats: '5/25', meetings: 7, status: 'Active', renewal: 'Dec 1, 2026' },
    { id: 'ten_002', name: 'BioMedix Surgical Devices', admin: 'Claire Dupont', plan: 'Enterprise ($799)', seats: '38/100', meetings: 148, status: 'Active', renewal: 'Jan 15, 2027' },
    { id: 'ten_003', name: 'VoltDrive Mobility AG', admin: 'Henrik Larsson', plan: 'Growth ($249)', seats: '12/25', meetings: 42, status: 'Active', renewal: 'Nov 30, 2026' },
    { id: 'ten_004', name: 'Nordic Marine Defense AS', admin: 'Gunnar Lindholm', plan: 'Free Evaluation', seats: '2/5', meetings: 10, status: 'At Quota', renewal: 'Perpetual' },
    { id: 'ten_005', name: 'Bavaria Gear Systems GmbH', admin: 'Hans Keller', plan: 'Starter ($99)', seats: '4/10', meetings: 18, status: 'Active', renewal: 'Dec 12, 2026' }
  ];

  const filtered = TENANTS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.admin.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenant & Client Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Platform-level customer tenant directory, quota compliance, and isolation status. (PRD Section 11)
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search tenants or administrators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Tenant Name</th>
              <th className="py-3 px-4">Client Administrator</th>
              <th className="py-3 px-4">Assigned Plan</th>
              <th className="py-3 px-4">Seat Usage</th>
              <th className="py-3 px-4">Meetings Used</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{t.name}</td>
                <td className="py-3.5 px-4 font-sans text-slate-700">{t.admin}</td>
                <td className="py-3.5 px-4 font-sans text-slate-800">{t.plan}</td>
                <td className="py-3.5 px-4 text-slate-600">{t.seats}</td>
                <td className="py-3.5 px-4 text-slate-600">{t.meetings} calls</td>
                <td className="py-3.5 px-4 font-sans">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
