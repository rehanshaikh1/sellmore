import React, { useRef, useState } from 'react';
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
  Pencil,
  FileCheck
} from 'lucide-react';

export const CompanyDocuments: React.FC = () => {
  const { companyDocuments, addCompanyDocument, updateCompanyDocument, deleteCompanyDocument, toggleDocumentConsidered, currentPlan } = useStore();

  const [docName, setDocName] = useState('');
  const [docSize, setDocSize] = useState('2.4 MB');
  const [taggedAssessment, setTaggedAssessment] = useState('Product Knowledge QA');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCurrent, setEditingCurrent] = useState<{ size: string; uploadDate: string } | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);

  const assessmentCategories = [
    'Product Knowledge QA',
    'Technical Feasibility QA',
    'Commercial Awareness QA',
    'Objection Handling QA',
    'Compliance & ISO QA'
  ];


  const ACCEPTED = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx', '.pptx'];
  const MAX_MB = 25;

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleFile = (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setFileError(`Unsupported file type. Use ${ACCEPTED.join(', ')}.`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File is larger than ${MAX_MB} MB.`);
      return;
    }
    setPickedFile(file);
    setDocSize(formatSize(file.size));
    setDocName(prev => prev.trim() ? prev : file.name);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    if (!editingId && !pickedFile) {
      setFileError('Choose a file to upload.');
      return;
    }
    if (editingId) {
      // A replacement file refreshes the size and upload date; otherwise only the details change.
      updateCompanyDocument(editingId, {
        name: docName.trim(),
        taggedAssessment,
        ...(pickedFile ? { size: docSize, uploadDate: new Date().toISOString().split('T')[0] } : {})
      });
    } else {
      addCompanyDocument(docName.trim(), docSize, taggedAssessment);
    }
    closeModal();
  };

  const closeModal = () => {
    setPickedFile(null);
    setFileError('');
    setEditingCurrent(null);
    setDocSize('2.4 MB');
    setDocName('');
    setEditingId(null);
    setShowUploadModal(false);
  };

  const openEdit = (doc: { id: string; name: string; taggedAssessment: string; size: string; uploadDate: string }) => {
    setEditingCurrent({ size: doc.size, uploadDate: doc.uploadDate });
    setPickedFile(null);
    setFileError('');
    setEditingId(doc.id);
    setDocName(doc.name);
    setTaggedAssessment(doc.taggedAssessment);
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Documents</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Upload proprietary manufacturing specifications to ground automated QA assessments.
          </p>
        </div>

        <button
          onClick={() => { setEditingId(null); setDocName(''); setPickedFile(null); setFileError(''); setShowUploadModal(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Company Document</span>
        </button>
      </div>

      {(
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            The Free Plan permits document upload and tagging to relevant QA assessments. You can toggle whether each document should be considered during cue scoring.
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
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyDocuments.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400">No company documents yet.</td></tr>
                  )}
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
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(doc)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1"
                            title="Edit document"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => setDocToDelete({ id: doc.id, name: doc.name })}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-semibold flex items-center gap-1"
                            title="Delete document"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Delete document?</h3>
            <p className="text-slate-600">
              <strong>{docToDelete.name}</strong> will be removed and no longer used to ground QA scoring. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDocToDelete(null)} className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">Cancel</button>
              <button
                onClick={() => { deleteCompanyDocument(docToDelete.id); setDocToDelete(null); }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">{editingId ? 'Edit Company Document' : 'Upload Company Document'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {(
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{editingId ? 'Replace file (optional)' : 'File'}</label>
                  {editingId && editingCurrent && !pickedFile && (
                    <p className="text-[11px] text-slate-500 mb-1.5">Current file: <span className="font-mono">{editingCurrent.size}</span> · uploaded {editingCurrent.uploadDate}</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED.join(',')}
                    className="hidden"
                    onChange={e => handleFile(e.target.files?.[0])}
                  />
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
                        <span className="font-mono text-[11px] font-normal text-emerald-700">{docSize}</span>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <Upload className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
                        <span className="font-semibold text-blue-600">{editingId ? 'Choose a new file' : 'Choose a file'}</span> or drag it here
                        <div className="text-[10px] text-slate-400 mt-1">PDF, Word, text, spreadsheet or slides · up to {MAX_MB} MB</div>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fileError}</p>}
                </div>
              )}

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
                  onClick={closeModal}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Save Changes' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
