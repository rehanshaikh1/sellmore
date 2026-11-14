import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  FileText, 
  Upload, 
  Check, 
  Eye, 
  Lock, 
  AlertCircle, 
  Tag, 
  BookOpen, 
  Trash2,
  FileCheck
} from 'lucide-react';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const CompanyDocuments: React.FC = () => {
  const { companyDocuments, addCompanyDocument, toggleDocumentConsidered, currentPlan } = useStore();

  const [activeTab, setActiveTab] = useState<'docs' | 'prompts'>('docs');
  const [docName, setDocName] = useState('');
  const [docSize, setDocSize] = useState('2.4 MB');
  const [taggedAssessment, setTaggedAssessment] = useState('Product Knowledge QA');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const assessmentCategories = [
    'Product Knowledge QA',
    'Technical Feasibility QA',
    'Commercial Awareness QA',
    'Objection Handling QA',
    'Compliance & ISO QA'
  ];

  const PREDEFINED_QA_PROMPTS = [
    {
      id: 'qa_1',
      assessment: 'Product Knowledge QA',
      description: 'Evaluates whether the sales rep accurately represents 5-axis DMG MORI specifications, machine envelope limits, and ISO cleanroom certifications.',
      promptTemplate: `Assess the sales representative against uploaded Company Documentation tagged with "Product Knowledge QA".
Evaluate whether the rep accurately cited:
1. Spindle maximum RPM and high-pressure coolant bars (70 bar).
2. Cleanroom ISO Class 7 packaging protocols.
Award score 0-5. Cite exact transcript timestamps and contrast with source documentation.`
    },
    {
      id: 'qa_2',
      assessment: 'Technical Feasibility QA',
      description: 'Checks for technical feasibility commitments regarding titanium work hardening and geometric tolerances.',
      promptTemplate: `Review customer drawing requirements against the Aerospace Titanium Milling Feasibility Handbook.
Flag any unrealistic lead times or unverified ±0.005mm concentricity promises made without engineering sign-off.`
    },
    {
      id: 'qa_3',
      assessment: 'Commercial Awareness QA',
      description: 'Enforces adherence to standard surcharge policies and minimum order value guidelines.',
      promptTemplate: `Examine commercial discussions regarding dedicated tooling fees ($8,500 baseline) and raw material indexation.
Verify rep followed the authorized amortization script instead of offering unauthorized waivers.`
    }
  ];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    addCompanyDocument(docName.trim(), docSize, taggedAssessment);
    setDocName('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Documentation & QA Prompts</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Upload proprietary manufacturing specifications to ground automated QA assessments.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Company Document</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 tracking-tight ${
            activeTab === 'docs' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Uploaded Documents ({companyDocuments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 tracking-tight ${
            activeTab === 'prompts' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Predefined QA Prompts {currentPlan === 'free' && '(View-Only)'}</span>
        </button>
      </div>

      {activeTab === 'docs' ? (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            Per PRD Section 7.5, the Free Plan permits document upload and tagging to relevant QA assessments. You can toggle whether each document should be considered during cue scoring.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4">Tagged QA Assessment</th>
                    <th className="py-3 px-4">Consider in QA Scoring</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{doc.size}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{doc.uploadDate}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {doc.taggedAssessment}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.considered}
                            onChange={() => toggleDocumentConsidered(doc.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={doc.considered ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                            {doc.considered ? 'Considered' : 'Ignored'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                          <FileCheck className="w-3 h-3" /> Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {currentPlan === 'free' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Free Plan Restriction:</strong> Predefined QA prompts are view-only. Custom prompt editing requires an upgrade to Growth or Enterprise.
                </span>
              </div>
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="font-bold underline hover:text-amber-900 shrink-0 ml-2"
              >
                Upgrade to Edit
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {PREDEFINED_QA_PROMPTS.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.assessment}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      System Preset
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> View Only
                  </div>
                </div>

                <p className="text-xs text-slate-600">{item.description}</p>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {item.promptTemplate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Upload Company Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex_5Axis_Milling_Handbook_v4.pdf"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tag to QA Assessment</label>
                <select
                  value={taggedAssessment}
                  onChange={e => setTaggedAssessment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  {assessmentCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tagging ensures speech cue analysis checks conversations against this document.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Custom QA Prompt Editing Locked"
        featureDescription="Editing predefined QA prompts is disabled on the Free Plan. Upgrade to customize scoring rubrics."
      />
    </div>
  );
};
