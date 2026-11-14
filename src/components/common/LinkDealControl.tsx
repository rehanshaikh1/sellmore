import React, { useState } from 'react';
import { Link2, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { isClosedStage } from '../../lib/deals';
import { MeetingRecord } from '../../types';

/**
 * Shown for a call that is not linked to a deal ("No deal linked").
 * The rep either links it to a Salesforce deal they can see, or creates a draft deal
 * that lives only in SellMore until the Opportunity appears in Salesforce.
 */
export const LinkDealControl: React.FC<{ meeting: MeetingRecord }> = ({ meeting }) => {
  const { deals, crmConnected, associateMeetingToDeal, createDraftDeal } = useStore();
  const { scope } = useAccess();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'link' | 'draft'>('link');
  const [dealId, setDealId] = useState('');
  const [dealName, setDealName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  // Deals only exist once Salesforce is connected. Without it, show nothing deal-related.
  if (!crmConnected) return null;

  const badge = (
    <span className="inline-flex items-center px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-medium whitespace-nowrap">
      No deal linked
    </span>
  );

  const openDeals = scope(deals, d => d.ownerId).filter(d => !isClosedStage(d.stage));

  const close = () => {
    setOpen(false);
    setError('');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'link') {
      if (!dealId) {
        setError('Choose a deal to link this call to.');
        return;
      }
      associateMeetingToDeal(meeting.id, dealId);
      close();
      return;
    }
    const result = createDraftDeal(meeting.id, dealName, companyName);
    if (!result.success) {
      setError(result.error || 'Could not create the draft deal.');
      return;
    }
    close();
  };

  return (
    <>
      <span className="inline-flex items-center gap-2">
        {badge}
        <button
          type="button"
          onClick={() => {
            setDealName('');
            setCompanyName('');
            setDealId('');
            setMode(openDeals.length ? 'link' : 'draft');
            setOpen(true);
          }}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-semibold text-[11px] whitespace-nowrap"
        >
          <Link2 className="w-3 h-3" /> Link to deal
        </button>
      </span>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Link this call to a deal</h3>
                <p className="text-[11px] text-slate-500 mt-1">{meeting.name}</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('link')}
                  className={`px-3 py-2 rounded-lg border font-semibold ${mode === 'link' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  Salesforce deal
                </button>
                <button
                  type="button"
                  onClick={() => setMode('draft')}
                  className={`px-3 py-2 rounded-lg border font-semibold ${mode === 'draft' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  New draft deal
                </button>
              </div>

              {mode === 'link' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Open deal</label>
                  <select
                    value={dealId}
                    onChange={e => setDealId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="">Select a deal</option>
                    {openDeals.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}{d.source === 'draft' ? ' (draft)' : ''}
                      </option>
                    ))}
                  </select>
                  {openDeals.length === 0 && (
                    <p className="text-[11px] text-slate-500 mt-2">You have no open deals. Create a draft deal instead.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Deal name</label>
                    <input
                      value={dealName}
                      onChange={e => setDealName(e.target.value)}
                      placeholder="e.g. Kessler Automotive — Shaft Machining"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company (Salesforce account name)</label>
                    <input
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Kessler Automotive GmbH"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    A draft is saved in SellMore only and marked "Not in Salesforce yet". When an Opportunity for the same
                    account appears in Salesforce, the next sync matches it and keeps this deal's calls.
                  </p>
                </div>
              )}

              {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
              <button type="button" onClick={close} className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                Cancel
              </button>
              <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                {mode === 'link' ? 'Link call' : 'Create draft and link'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
