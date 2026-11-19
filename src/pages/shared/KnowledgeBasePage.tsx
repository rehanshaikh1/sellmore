import React, { useRef, useState } from 'react';
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
  ArrowRight,
  Pencil,
  Trash2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { KnowledgeSource } from '../../types';

export const KnowledgeBasePage: React.FC = () => {
  const { knowledgeSources, addKnowledgeSource, updateKnowledgeSource, deleteKnowledgeSource, toggleSourceConsidered } = useStore();

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

  const ACCEPTED: Record<string, KnowledgeSource['type']> = { '.pdf': 'PDF', '.doc': 'DOCX', '.docx': 'DOCX', '.txt': 'TXT', '.md': 'TXT' };
  const MAX_MB = 25;
  const isLinkType = sourceType === 'Website' || sourceType === 'YouTube';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState<KnowledgeSource | null>(null);
  const [toDelete, setToDelete] = useState<KnowledgeSource | null>(null);

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const resetForm = () => {
    setShowAddModal(false);
    setEditing(null);
    setPickedFile(null);
    setFormError('');
    setSourceName('');
    setSourceParam('');
    setSourceType('PDF');
    setQaTag('Product Knowledge QA');
  };

  const openAdd = () => { resetForm(); setShowAddModal(true); };

  const openEdit = (src: KnowledgeSource) => {
    setEditing(src);
    setPickedFile(null);
    setFormError('');
    setSourceName(src.name);
    setSourceType(src.type === 'Manual QA' ? 'TXT' : src.type);
    setSourceParam(src.type === 'Website' || src.type === 'YouTube' ? src.sizeOrUrl : '');
    setQaTag(src.qaAssessmentTag || 'Product Knowledge QA');
    setShowAddModal(true);
  };

  const handleFile = (file: File | undefined) => {
    setFormError('');
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED[ext]) { setFormError(`Unsupported file type. Use ${Object.keys(ACCEPTED).join(', ')}.`); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setFormError(`File is larger than ${MAX_MB} MB.`); return; }
    setPickedFile(file);
    setSourceType(ACCEPTED[ext]);
    setSourceParam(formatSize(file.size));
    setSourceName(prev => prev.trim() ? prev : file.name);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;
    if (isLinkType) {
      try { new URL(sourceParam.trim()); } catch { setFormError('Enter a valid URL, including https://'); return; }
    } else if (!editing && !pickedFile) {
      setFormError('Choose a file to upload.');
      return;
    }
    const sizeOrUrl = isLinkType ? sourceParam.trim() : (pickedFile ? sourceParam : editing?.sizeOrUrl || sourceParam);
    if (editing) {
      updateKnowledgeSource(editing.id, {
        name: sourceName.trim(),
        type: sourceType,
        sizeOrUrl,
        qaAssessmentTag: qaTag,
        ...(pickedFile ? { dateAdded: new Date().toISOString().split('T')[0] } : {})
      });
    } else {
      addKnowledgeSource(sourceName.trim(), sourceType, sizeOrUrl, qaTag);
    }
    resetForm();
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
          onClick={openAdd}
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
                    <th className="py-3 px-4 text-right">Actions</th>
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(src)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1" title="Edit source">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => setToDelete(src)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-semibold flex items-center gap-1" title="Delete source">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSources.length === 0 && (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-500">
                      {knowledgeSources.length === 0 ? 'No sources yet. Add a product sheet, spec or website to get started.' : 'No sources match your search.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Delete knowledge source?</h3>
            <p className="text-slate-600">
              <strong>{toDelete.name}</strong> will be removed and no longer used to score calls or answer questions. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setToDelete(null)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
              <button onClick={() => { deleteKnowledgeSource(toDelete.id); setToDelete(null); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">{editing ? 'Edit Knowledge Source' : 'Add Knowledge Source'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">
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
                    onChange={e => { setSourceType(e.target.value as any); setPickedFile(null); setSourceParam(''); setFormError(''); }}
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

              {isLinkType ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{sourceType === 'YouTube' ? 'Video URL' : 'Website URL'}</label>
                  <input
                    type="url"
                    required
                    placeholder={sourceType === 'YouTube' ? 'https://www.youtube.com/watch?v=…' : 'https://www.example.com/product'}
                    value={sourceParam}
                    onChange={e => setSourceParam(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{editing ? 'Replace file (optional)' : 'File'}</label>
                  {editing && !pickedFile && editing.type !== 'Website' && editing.type !== 'YouTube' && (
                    <p className="text-[11px] text-slate-500 mb-1.5">Current file: <span className="font-mono">{editing.sizeOrUrl}</span> · added {editing.dateAdded}</p>
                  )}
                  <input ref={fileInputRef} type="file" accept={Object.keys(ACCEPTED).join(',')} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                    className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${pickedFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'}`}
                  >
                    {pickedFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-800 font-semibold">
                        <FileCheck className="w-4 h-4" />
                        <span className="truncate max-w-[16rem]">{pickedFile.name}</span>
                        <span className="font-mono text-[11px] font-normal text-emerald-700">{sourceParam}</span>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <Upload className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
                        <span className="font-semibold text-blue-600">{editing ? 'Choose a new file' : 'Choose a file'}</span> or drag it here
                        <div className="text-[10px] text-slate-400 mt-1">PDF, Word or text · up to {MAX_MB} MB</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {formError && <p className="text-[11px] text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formError}</p>}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  {editing ? 'Save Changes' : 'Index & Ground'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
