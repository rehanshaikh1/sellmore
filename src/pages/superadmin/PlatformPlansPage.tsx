import React from 'react';
import { Layers, CheckCircle2, Lock } from 'lucide-react';

export const PlatformPlansPage: React.FC = () => {
  const PLANS = [
    { name: 'Free Evaluation', price: '$0', seats: '5 Seats', quota: '10 Meetings Cap', credits: '0 / pay-as-you-go', features: ['Manual Upload Only', 'All 12 Cues Scored', 'View-only QA Prompts', 'No CRM/Drive Sync'] },
    { name: 'Starter Plan', price: '$99/mo', seats: '10 Seats', quota: '35 Meetings/mo', credits: '100 Credits/mo', features: ['Google Drive Folder Retrieval', 'Practice Timed Prompts', 'Custom Document Tagging'] },
    { name: 'Growth Plan', price: '$249/mo', seats: '25 Seats', quota: 'Unlimited Meetings', credits: '500 Credits/mo', features: ['Salesforce V1 CRM Read-Only', 'Live Assist Extension', 'AI Mock Roleplay Engine', 'Deal Coaching'] },
    { name: 'Enterprise Plan', price: '$799/mo', seats: 'Unlimited', quota: 'Unlimited Meetings', credits: '2,500 Credits/mo', features: ['Custom CRM Write-back Rules', 'Dedicated SLAs', 'Custom Speech Models'] }
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Plan Catalogue & Entitlements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure commercial tier limits, seat quotas, and module entitlements. (PRD Section 11 & 26)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {PLANS.map((p, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">{p.name}</div>
              <div className="font-mono text-xl font-extrabold text-blue-600 mt-1">{p.price}</div>
              <div className="mt-3 space-y-1 font-mono text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                <div>Seats: <strong className="text-slate-800">{p.seats}</strong></div>
                <div>Quota: <strong className="text-slate-800">{p.quota}</strong></div>
                <div>Credits: <strong className="text-slate-800">{p.credits}</strong></div>
              </div>
              <ul className="mt-3 space-y-1 text-slate-500 text-[11px]">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-mono text-slate-400">Platform Preset</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
