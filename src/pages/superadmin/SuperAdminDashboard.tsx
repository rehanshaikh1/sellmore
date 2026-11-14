import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Layers, 
  Database, 
  BarChart3, 
  ShieldAlert, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Super Admin Console</h1>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono uppercase">
            Platform Operator Layer (PRD Section 11 & 26)
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cross-tenant configuration, multi-tenant isolation monitoring, plan catalogue management, and platform quotas.
        </p>
      </div>

      {/* Mandatory PRD Non-Negotiable Boundary Notice */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-sm">PRD Section 11 Non-Negotiable Architectural Boundary</div>
          <p className="text-purple-800 text-xs mt-1">
            Super Admin is an independent platform operator layer, NOT one of the three customer panels (Client Admin, Manager, Sales Rep). All tenant operational data is isolated by customer boundary.
          </p>
        </div>
      </div>

      {/* Cross-Tenant Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/platform/clients"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total Enterprise Tenants</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            142 Tenants
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Apex Precision, BioMedix, etc.</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Manage <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        <Link
          to="/platform/plans"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Active Subscription Plans</span>
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            4 Configured
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Free, Starter, Growth, Enterprise</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Catalogue <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        <Link
          to="/platform/integrations"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Format & Size Rules</span>
            <Database className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-3">
            MP4, MP3, TXT
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Max 2GB per file · 48h invite expiry</span>
            <span className="text-purple-600 group-hover:underline flex items-center">Rules <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>
          </div>
        </Link>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Global AI Speech Model</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-3 truncate font-mono">
            Gemini Flash 2.5
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            Average Inference Latency: 1.2s
          </div>
        </div>
      </div>

      {/* Tenant Directory Sample Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Customer Tenant Organizations</h2>
          <Link to="/platform/clients" className="text-xs font-semibold text-purple-600 hover:underline">
            View All Tenants &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tenant Identity</th>
                <th className="py-3 px-4">Primary Admin</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Allocated Seats</th>
                <th className="py-3 px-4">Meetings Analysed</th>
                <th className="py-3 px-4">Tenant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-sans font-bold text-slate-900">
                  Apex Precision Engineering Ltd
                  <span className="text-[10px] text-slate-400 block font-normal font-mono">Tenant ID: ten_apex_001</span>
                </td>
                <td className="py-3 px-4 font-sans text-slate-700">Sarah Lin</td>
                <td className="py-3 px-4 text-emerald-700 font-bold font-sans">Growth ($249/mo)</td>
                <td className="py-3 px-4 text-slate-800">5 / 25 Seats</td>
                <td className="py-3 px-4 text-slate-800">7 calls</td>
                <td className="py-3 px-4 font-sans">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-sans font-bold text-slate-900">
                  BioMedix Surgical Instruments
                  <span className="text-[10px] text-slate-400 block font-normal font-mono">Tenant ID: ten_biomed_002</span>
                </td>
                <td className="py-3 px-4 font-sans text-slate-700">Claire Dupont</td>
                <td className="py-3 px-4 text-purple-700 font-bold font-sans">Enterprise ($799/mo)</td>
                <td className="py-3 px-4 text-slate-800">38 / 100 Seats</td>
                <td className="py-3 px-4 text-slate-800">148 calls</td>
                <td className="py-3 px-4 font-sans">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-sans font-bold text-slate-900">
                  Nordic Marine Defense AS
                  <span className="text-[10px] text-slate-400 block font-normal font-mono">Tenant ID: ten_nordic_003</span>
                </td>
                <td className="py-3 px-4 font-sans text-slate-700">Gunnar Lindholm</td>
                <td className="py-3 px-4 text-amber-700 font-bold font-sans">Free Evaluation (Capped)</td>
                <td className="py-3 px-4 text-slate-800">2 / 5 Seats</td>
                <td className="py-3 px-4 text-slate-800">10 / 10 calls (Cap hit)</td>
                <td className="py-3 px-4 font-sans">
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                    At Quota
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
