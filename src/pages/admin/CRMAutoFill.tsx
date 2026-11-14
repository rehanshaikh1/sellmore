
import React from 'react';
import { useStore } from '../../store/useStore';
import { HelpCircle, Database, ArrowRight } from 'lucide-react';

export const CRMAutoFill: React.FC = () => {
  const { crmConnected, crmOrgName } = useStore();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            CRM Auto Fill
          </h1>
          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
            SellMore V2
          </span>
        </div>


      </div>

      {/* V2 Feature Information */}
      <div className="p-4.5 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs text-blue-900 space-y-2 leading-relaxed">
        <div className="font-bold flex items-center gap-2 text-blue-950 tracking-tight text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Planned for SellMore V2</span>
        </div>

        <p>
          CRM Auto Fill is planned as part of SellMore V2. It will use meeting
          analysis to identify important sales information, prepare suggested
          CRM field updates, and allow representatives to review and approve
          changes before syncing them to the connected CRM.
        </p>

        <p className="text-[11px] text-blue-800">
          The V2 workflow will include AI extraction, configurable field
          mappings, update review, and CRM synchronization.
        </p>
      </div>

      {/* Connected CRM Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900 tracking-tight">
                Connected CRM Target
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {crmConnected ? crmOrgName : 'No active CRM connected'}
              </div>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
            Current: Read-Only V1
          </span>
        </div>

        {/* Planned V2 Mapping Schema */}
        <div className="border border-slate-200/90 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 border-b border-slate-200 uppercase tracking-wider text-[11px]">
            Planned V2 CRM Field Mapping
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {[
              {
                source: 'Meeting Analysis: Technical Requirements',
                target: 'Opportunity.Technical_Requirements__c',
                status: 'Planned for V2'
              },
              {
                source: 'Meeting Analysis: Agreed Delivery Timelines',
                target: 'Opportunity.Target_First_Article_Date__c',
                status: 'Planned for V2'
              },
              {
                source: 'Meeting Analysis: Commercial Objections',
                target: 'Opportunity.Commercial_Notes__c',
                status: 'Planned for V2'
              }
            ].map((row, idx) => (
              <div
                key={idx}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors rounded-lg"
              >
                <div>
                  <div className="font-semibold text-slate-900 tracking-tight">
                    {row.source}
                  </div>

                  <div className="text-[11px] text-blue-600 font-mono mt-1 flex items-center gap-1 font-medium">
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    {row.target}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            disabled
            className="px-4 py-2.5 bg-slate-100 text-slate-400 font-semibold text-xs rounded-lg cursor-not-allowed"
          >
            CRM Auto Fill — Planned for V2
          </button>
        </div>
      </div>
    </div>
  );
};
