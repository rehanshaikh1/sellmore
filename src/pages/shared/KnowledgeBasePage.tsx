import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  BookOpen,
  Upload,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Globe,
  Video,
  HelpCircle,
  Tag,
  Layers,
  Play,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { KnowledgeSource } from '../../types';

export const KnowledgeBasePage: React.FC = () => {
  const { knowledgeSources, addKnowledgeSource, toggleSourceConsidered } = useStore();

  const [activeTab, setActiveTab] = useState<'sources' | 'testing' | 'logs' | 'map'>('sources');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New source form
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<KnowledgeSource['type']>('PDF');
  const [sourceParam, setSourceParam] = useState('');
  const [qaTag, setQaTag] = useState('Product Knowledge QA');

  // Source test state
  const [testQuestion, setTestQuestion] = useState('What are the internal bore GD&T tolerances for 5-axis titanium milling?');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const filteredSources = knowledgeSources.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.qaAssessmentTag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;
    addKnowledgeSource(sourceName.trim(), sourceType, sourceParam || '2.4 MB', qaTag);
    setShowAddModal(false);
    setSourceName('');
    setSourceParam('');
  };

  const handleRunSourceTest = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`Grounded Source Citation Match (Confidence 96.4%):\nFound in "Apex_5Axis_CNC_Machining_Capabilities_2026.pdf" [Section 4.2 - Aerospace GD&T Standards]:\n"Standard bore concentricity is held to ±0.005mm (5 microns) post-reaming using Renishaw in-process optical touch probes on Hermle C42 5-axis cells with 70-bar through-spindle coolant."`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base & QA Grounding</h1>

        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Knowledge Source
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'sources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Indexed Sources ({knowledgeSources.length})
        </button>
        <button
          onClick={() => setActiveTab('testing')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'testing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          Source Retrieval Testing
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <FileText className="w-4 h-4" />
          Query Logs & Citations
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'map' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Layers className="w-4 h-4" />
          Knowledge Map Clusters
        </button>
      </div>

      {/* Tab 1: Sources Table */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search knowledge sources or QA tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Source Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size / URL</th>
                    <th className="py-3 px-4">Tagged QA Assessment</th>
                    <th className="py-3 px-4">Consider in QA</th>
                    <th className="py-3 px-4">Indexed Queries</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSources.map(src => (
                    <tr key={src.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        {src.type === 'PDF' && <FileText className="w-4 h-4 text-rose-600 shrink-0" />}
                        {src.type === 'DOCX' && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                        {src.type === 'Website' && <Globe className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {src.type === 'TXT' && <FileText className="w-4 h-4 text-slate-600 shrink-0" />}
                        <span>{src.name}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {src.type}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px] truncate max-w-xs">
                        {src.sizeOrUrl}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {src.qaAssessmentTag || 'General QA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={src.consideredForQA}
                          onChange={() => toggleSourceConsidered(src.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                        {src.queriesCount} citations
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Indexed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Retrieval Testing */}
      {activeTab === 'testing' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Test Grounded Semantic Retrieval</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Enter an engineering or commercial inquiry to verify that your uploaded documents are correctly matched and cited.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Test Query</label>
            <input
              type="text"
              value={testQuestion}
              onChange={e => setTestQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
            />
          </div>

          <button
            onClick={handleRunSourceTest}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isTesting ? 'Searching Indexed Knowledge...' : 'Run Retrieval Test'}
          </button>

          {testResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {testResult}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Query Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden text-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
            Recent Speech-to-Document QA Evaluations
          </div>
          <div className="divide-y divide-slate-100 p-4 space-y-3">
            {[
              { q: 'Did rep quote 70-bar through-spindle coolant for titanium?', match: 'Apex_5Axis_CNC_Machining_Capabilities_2026.pdf', time: 'Today 14:32', status: 'Verified' },
              { q: 'Was standard $8,500 dedicated tooling fee defended?', match: 'Pricing_and_Surcharge_Policy_2026.pdf', time: 'Today 14:30', status: 'Verified' },
              { q: 'Did rep promise unverified Class 7 cleanroom packaging?', match: 'Cleanroom_ISO_Class7_SOP.docx', time: 'Nov 8, 2026', status: 'Flagged' }
            ].map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{log.q}</div>
                  <div className="text-[11px] text-blue-600 font-mono mt-0.5">Matched source: {log.match}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[10px] text-slate-400 block">{log.time}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Knowledge Map */}
      {activeTab === 'map' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs text-center space-y-4">
          <div className="max-w-md mx-auto">
            <Layers className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">Semantic Knowledge Clusters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Interactive map linking company technical documentation with customer conversation cues.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-left space-y-1">
              <span className="font-mono font-bold text-blue-800 text-[11px]">Cluster A: 5-Axis Milling</span>
              <p className="text-blue-900">Covers DMG MORI, Hermle C42, ±0.005mm tolerances, and AS9100D certifications.</p>
              <span className="text-[10px] font-mono text-blue-600 block pt-1">3 Sources · 142 Citations</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-1">
              <span className="font-mono font-bold text-emerald-800 text-[11px]">Cluster B: Commercial & Tooling</span>
              <p className="text-emerald-900">Covers $8,500 fixture surcharges, LME raw metal indexation, and Net-30 terms.</p>
              <span className="text-[10px] font-mono text-emerald-600 block pt-1">2 Sources · 110 Citations</span>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-left space-y-1">
              <span className="font-mono font-bold text-purple-800 text-[11px]">Cluster C: Quality & Cleanroom</span>
              <p className="text-purple-900">Covers ISO Class 7 packaging, FDA ISO 13485 medical, and laser tool probing.</p>
              <span className="text-[10px] font-mono text-purple-600 block pt-1">2 Sources · 89 Citations</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Add Knowledge Source</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Name / Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AS9100D_Quality_Assurance_Spec.pdf"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Format</label>
                  <select
                    value={sourceType}
                    onChange={e => setSourceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word DOCX</option>
                    <option value="TXT">Plain Text TXT</option>
                    <option value="Website">Website URL</option>
                    <option value="YouTube">YouTube Video</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tag to QA Rubric</label>
                  <select
                    value={qaTag}
                    onChange={e => setQaTag(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="Product Knowledge QA">Product Knowledge QA</option>
                    <option value="Technical Feasibility QA">Technical Feasibility QA</option>
                    <option value="Commercial Awareness QA">Commercial Awareness QA</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Index & Ground
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
