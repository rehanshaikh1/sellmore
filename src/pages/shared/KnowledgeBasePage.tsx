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

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New source form
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<KnowledgeSource['type']>('PDF');
  const [sourceParam, setSourceParam] = useState('');
  const [qaTag, setQaTag] = useState('Product Knowledge QA');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-600">Product and sales material the company has added. Sources switched on are used when SellMore scores calls ({knowledgeSources.length} added).</p>

        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Knowledge Source
        </button>
      </div>

      {/* Sources */}
      {(
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
                    <th className="py-3 px-4">Used for</th>
                    <th className="py-3 px-4">Use in scoring</th>
                    <th className="py-3 px-4">Citations</th>
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
                  {filteredSources.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-500">
                      {knowledgeSources.length === 0 ? 'No sources yet. Add a product sheet, spec or website to get started.' : 'No sources match your search.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
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
