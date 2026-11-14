import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import {
  Building2,
  Search,
  Filter,
  Users,
  Briefcase,
  Video,
  Sparkles,
  Send,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompanyAccount {
  id: string;
  name: string;
  industry: string;
  location: string;
  annualRevenue: string;
  primaryContact: string;
  opportunitiesCount: number;
  totalOpportunityValue: number;
  meetingsCount: number;
  assignedRep: string;
  assignedRepId: string;
}

export const CompanyIntelligencePage: React.FC = () => {
  const { currentRole, currentUser } = useStore();
  const { scope } = useAccess();
  const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';

  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp_1');
  const [askInput, setAskInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const COMPANIES: CompanyAccount[] = [
    {
      id: 'comp_1',
      name: 'AeroDynamics UK Ltd',
      industry: 'Aerospace & Defense Airframes',
      location: 'Bristol, United Kingdom',
      annualRevenue: '£85M',
      primaryContact: 'Dr. Thomas Wright (Chief Engineer)',
      opportunitiesCount: 1,
      totalOpportunityValue: 185000,
      meetingsCount: 3,
      assignedRep: 'Marcus Vance',
      assignedRepId: 'usr_rep_1'
    },
    {
      id: 'comp_2',
      name: 'BioMedix Surgical Devices',
      industry: 'Medical Robotic Implants',
      location: 'Lyon, France',
      annualRevenue: '€120M',
      primaryContact: 'Claire Dupont (VP Hardware)',
      opportunitiesCount: 1,
      totalOpportunityValue: 320000,
      meetingsCount: 2,
      assignedRep: 'Marcus Vance',
      assignedRepId: 'usr_rep_1'
    },
    {
      id: 'comp_3',
      name: 'VoltDrive Mobility AG',
      industry: 'Automotive EV Powertrains',
      location: 'Munich, Germany',
      annualRevenue: '€340M',
      primaryContact: 'Henrik Larsson (Head of Supply Chain)',
      opportunitiesCount: 1,
      totalOpportunityValue: 540000,
      meetingsCount: 4,
      assignedRep: 'Elena Rostova',
      assignedRepId: 'usr_rep_2'
    }
  ];

  // Accounts follow the rep they are assigned to (rep = own, manager = team, admin = all).
  const visibleCompanies = scope(COMPANIES, c => c.assignedRepId);
  const filteredCompanies = visibleCompanies.filter(c => {
    if (scopeFilter === 'assigned' && c.assignedRepId !== currentUser.id) return false;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedCompany = visibleCompanies.find(c => c.id === selectedCompanyId) || visibleCompanies[0];

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    setAiAnswer(`Analysis for ${selectedCompany.name}: Across ${selectedCompany.meetingsCount} recorded meetings and Salesforce opportunity history, key technical requirements focus on AS9100D titanium milling and Class 7 cleanroom packaging. Procurement decision maker is actively evaluating Capex payback on tooling surcharges.`);
    setAskInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Intelligence</h1>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase">
              Analytics Module (PRD Section 10.5)
            </span>
          </div>

        </div>
      </div>

      {/* Scope and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search company accounts by name or sector..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${scopeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setScopeFilter('assigned')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${scopeFilter === 'assigned' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* Layout Grid: List on Left, Detail & Ask on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Target Accounts ({filteredCompanies.length})
          </h3>

          <div className="space-y-2">
            {filteredCompanies.map(comp => {
              const isSelected = selectedCompany.id === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanyId(comp.id);
                    setAiAnswer(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50/70 border-blue-500 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{comp.name}</h4>
                      <p className="text-[11px] text-slate-500">{comp.industry}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ${(comp.totalOpportunityValue / 1000).toFixed(0)}k
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{comp.meetingsCount} meetings</span>
                    <span>Rep: {comp.assignedRep}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Detail & Ask Panel (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                  Account Dossier
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedCompany.name}</h2>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {selectedCompany.industry} · {selectedCompany.location}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pipeline Value</span>
                <div className="font-mono text-xl font-bold text-slate-900">
                  ${selectedCompany.totalOpportunityValue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Primary Contact</span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">
                  {selectedCompany.primaryContact}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Annual Revenue</span>
                <span className="font-semibold text-slate-800 font-mono mt-0.5 block">
                  {selectedCompany.annualRevenue}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Sales Representative</span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">
                  {selectedCompany.assignedRep}
                </span>
              </div>
            </div>

            {/* Natural Language Ask About This Company */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Ask Natural-Language Intelligence About {selectedCompany.name}
              </div>

              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ask anything about ${selectedCompany.name} (e.g. 'What are their main GD&T constraints?')...`}
                  value={askInput}
                  onChange={e => setAskInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!askInput.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {aiAnswer && (
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-sans text-xs animate-in fade-in duration-150">
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
