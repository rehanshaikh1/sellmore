import React, { useState } from 'react';
import { X, UploadCloud, FileAudio, FileVideo, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

interface MeetingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDealId?: string;
}

export const MeetingUploadModal: React.FC<MeetingUploadModalProps> = ({
  isOpen,
  onClose,
  preselectedDealId
}) => {
  const { uploadMeeting, teamMembers, deals, crmConnected, currentPlan, freeMeetingQuota, meetings, currentUser } = useStore();
  const navigate = useNavigate();

  const [meetingName, setMeetingName] = useState('');
  const [selectedRepId, setSelectedRepId] = useState(currentUser.id);
  const [selectedDealId, setSelectedDealId] = useState(preselectedDealId || '');
  const [format, setFormat] = useState<'MP4' | 'MP3' | 'TXT'>('MP4');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const reps = teamMembers.filter(m => m.role === 'sales_rep' || m.id === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!meetingName.trim()) {
      setErrorMsg('Meeting Name is required.');
      return;
    }

    const rep = teamMembers.find(m => m.id === selectedRepId) || currentUser;

    setIsSubmitting(true);
    const result = uploadMeeting(meetingName.trim(), rep.id, rep.name, format, crmConnected && selectedDealId ? selectedDealId : undefined);

    if (!result.success) {
      setIsSubmitting(false);
      setErrorMsg(result.error || 'Upload failed.');
      return;
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      // Reset form
      setMeetingName('');
      setFileName('');
      // Navigate to library to see processing record
      const rolePrefix = currentUser.role === 'manager' ? 'manager' : currentUser.role === 'sales_rep' ? 'sales' : 'admin';
      navigate(`/${rolePrefix}/meetings`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Sales Conversation for Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Processes speech-to-text transcript and scores all 12 sales cues
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quota Notice */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600">Current Plan Quota:</span>
            {currentPlan === 'free' ? (
              <span className="font-mono font-semibold text-amber-700">
                {meetings.length} / {freeMeetingQuota} meetings used
              </span>
            ) : (
              <span className="font-mono font-semibold text-emerald-700">
                Unlimited Uploads (15 AI credits/call)
              </span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Meeting Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AeroDynamics — 5-Axis GD&T Review"
              value={meetingName}
              onChange={e => setMeetingName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sales Representative
              </label>
              <select
                value={selectedRepId}
                onChange={e => setSelectedRepId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {reps.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {crmConnected && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Associate with Opportunity
              </label>
              <select
                value={selectedDealId}
                onChange={e => setSelectedDealId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">No deal linked (link it later)</option>
                {deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            )}
          </div>

          {/* Supported Format Selector & Drag Drop Simulation */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Source Format & Recording File <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFormat('MP4')}
                className={`flex-1 py-1.5 px-2 rounded-md border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  format === 'MP4' ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileVideo className="w-3.5 h-3.5" /> MP4 Video
              </button>
              <button
                type="button"
                onClick={() => setFormat('MP3')}
                className={`flex-1 py-1.5 px-2 rounded-md border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  format === 'MP3' ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileAudio className="w-3.5 h-3.5" /> MP3 Audio
              </button>
              <button
                type="button"
                onClick={() => setFormat('TXT')}
                className={`flex-1 py-1.5 px-2 rounded-md border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  format === 'TXT' ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Text Transcript
              </button>
            </div>

            <div 
              onClick={() => setFileName(`call_recording_${Date.now()}.${format.toLowerCase()}`)}
              className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all"
            >
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              {fileName ? (
                <div className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to upload: {fileName} (142 MB)</span>
                </div>
              ) : (
                <>
                  <div className="font-semibold text-slate-800">Click to select {format} file</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Supports high-fidelity audio & video streams up to 2GB</div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2"
            >
              {isSubmitting ? 'Uploading & Queuing...' : 'Start Speech Analysis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
