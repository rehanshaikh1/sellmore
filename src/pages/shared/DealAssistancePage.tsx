import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { Link } from 'react-router-dom';
import { computeDealRisks, getDealMeetings } from '../../lib/deals';
import { DealRecord, MeetingRecord } from '../../types';
import {
  HelpCircle,
  Search,
  Send,
  Sparkles,
  Database,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

interface QAMessage {
  dealId: string;
  question: string;
  answer: string;
  sources: { title: string; timestamp?: string; type: 'meeting' | 'crm' }[];
}

export const DealAssistancePage: React.FC = () => {
  const { deals: allDeals } = useStore();
  const { scope } = useAccess();
  const deals = scope(allDeals, d => d.ownerId);

  if (deals.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deal Assistance</h1>
        <p className="text-xs text-slate-500">
          Ask questions about a deal using CRM and meeting context.
        </p>
        <div className="mt-6 bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
          No deals available yet. Load sample data to pick a deal and start asking questions.
        </div>
      </div>
    );
  }

  return <DealAssistanceInner />;
};

/**
 * Answers a question from the selected deal's own data: its Salesforce fields,
 * contact roles, computed risks, and the analysed calls linked to it.
 * (Placeholder for retrieval over transcripts; it never uses another deal's data.)
 */
const answerForDeal = (
  question: string,
  deal: DealRecord,
  dealMeetings: MeetingRecord[],
  allMeetings: MeetingRecord[]
): { answer: string; sources: QAMessage['sources'] } => {
  const q = question.toLowerCase();
  const analysed = dealMeetings.filter(m => m.processingStatus === 'Analysed');
  const sources: QAMessage['sources'] = [];
  const crm = (title: string) => sources.push({ title, type: 'crm' });
  const call = (m: MeetingRecord) => sources.push({ title: m.name, type: 'meeting' });
  let answer = '';

  if (/decision|who|stakeholder|champion|buyer|contact/.test(q)) {
    if (deal.stakeholders.length === 0) {
      answer = `No contacts are set on the Salesforce Opportunity "${deal.name}". Add Opportunity Contact Roles in Salesforce and sync again.`;
    } else {
      answer = deal.stakeholders
        .map(s => `${s.name}, ${s.role}: ${s.sentiment}. Last spoke ${s.lastSpoke}.`)
        .join('\n');
    }
    crm('Salesforce Opportunity Contact Roles');
  } else if (/risk|concern|block|problem|worr/.test(q)) {
    const risks = computeDealRisks(deal, allMeetings);
    answer = risks.length
      ? risks.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : `No risks found for "${deal.name}".`;
    crm('Salesforce Opportunity');
    analysed.slice(0, 2).forEach(call);
  } else if (/objection/.test(q)) {
    const objections = analysed.flatMap(m => (m.objections || []).map(o => ({ m, o })));
    answer = objections.length
      ? objections.map(({ m, o }) => `${o.objection} (${o.status}). Rep said: ${o.repResponse}`).join('\n')
      : 'No objections are recorded in the analysed calls on this deal.';
    objections.slice(0, 3).forEach(({ m }) => call(m));
  } else if (/next|step|action|follow/.test(q)) {
    const latest = analysed.find(m => (m.recommendedNextSteps || []).length > 0);
    answer = latest
      ? (latest.recommendedNextSteps || []).map((t, i) => `${i + 1}. ${t}`).join('\n')
      : 'No analysed call on this deal has recommended next steps yet.';
    if (latest) call(latest);
  } else if (/stage|amount|value|close|status|when|owner|price/.test(q)) {
    answer =
      `"${deal.name}" is in ${deal.stage}` +
      (deal.rawStage && deal.rawStage !== deal.stage ? ` (Salesforce stage: ${deal.rawStage})` : '') +
      `, worth $${deal.amount.toLocaleString()}, owned by ${deal.ownerName}. ` +
      `Close date: ${deal.closeDate || 'not set'}. ${deal.callCount} calls linked.`;
    crm('Salesforce Opportunity');
  } else {
    const latest = analysed[0];
    answer =
      `"${deal.name}" (${deal.companyName}) is in ${deal.stage}, owned by ${deal.ownerName}, with ${deal.callCount} calls linked.` +
      (latest?.summary ? ` Latest call: ${latest.summary}` : '');
    crm('Salesforce Opportunity');
    if (latest) call(latest);
  }

  if (analysed.length === 0) {
    answer += '\n\nNo analysed call is linked to this deal yet, so this answer uses Salesforce fields only.';
  }
  return { answer, sources };
};

const DealAssistanceInner: React.FC = () => {
  const { deals: allDeals, meetings, crmConnected, currentRole } = useStore();
  const { scope } = useAccess();
  const deals = scope(allDeals, d => d.ownerId);
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || 'deal_1');
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const selectedDeal = deals.find(d => d.id === selectedDealId) || deals[0];
  const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';

  const [chatHistory, setChatHistory] = useState<QAMessage[]>([]);
  const visibleChat = chatHistory.filter(m => m.dealId === selectedDeal.id);

  const handleAsk = (textToAsk?: string) => {
    const q = textToAsk || questionInput;
    if (!q.trim()) return;

    const asked = selectedDeal;
    setIsAnswering(true);
    setQuestionInput('');

    setTimeout(() => {
      const { answer, sources } = answerForDeal(q, asked, getDealMeetings(asked, meetings), meetings);
      setChatHistory(prev => [...prev, { dealId: asked.id, question: q, answer, sources }]);
      setIsAnswering(false);
    }, 800);
  };

  const suggestedQuestions = [
    'Who are the decision makers on this deal?',
    'What risks does this deal have?',
    'What objections came up in the calls?',
    'What are the recommended next steps?'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deal Assistance</h1>

      </div>

      {/* CRM Connection Check */}
      {!crmConnected && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Salesforce is disconnected. Deal Assistance can only use meeting context until it is connected.
            </span>
          </div>
          {currentRole === 'client_admin' && (
            <Link to="/admin/crm" className="font-bold underline shrink-0 ml-2">
              Connect Salesforce
            </Link>
          )}
        </div>
      )}

      {/* Deal Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-700">Active Opportunity Context:</span>
          <select
            value={selectedDealId}
            onChange={e => setSelectedDealId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
          >
            {deals.map(d => (
              <option key={d.id} value={d.id}>{d.name} (${(d.amount / 1000).toFixed(0)}k){d.source === 'draft' ? ' · draft' : ''}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>Stage: <strong className="text-slate-800">{selectedDeal.stage}</strong></span>
          <span>·</span>
          <span>Calls: <strong className="text-slate-800">{selectedDeal.callCount}</strong></span>
        </div>
      </div>

      {/* Q&A Stream */}
      <div className="space-y-4">
        {visibleChat.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                Q
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.question}</h3>
            </div>

            <div className="pl-8 space-y-3">
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                {item.answer}
              </div>

              {/* Source References */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Sources:
                </span>
                {item.sources.map((src, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {src.type === 'meeting' ? <Clock className="w-3 h-3 text-blue-500" /> : <Database className="w-3 h-3 text-emerald-500" />}
                    <span>{src.title}</span>
                    {src.timestamp && <span className="text-slate-400">({src.timestamp})</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {isAnswering && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs flex items-center gap-2.5 text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Consulting permitted CRM opportunity records and conversation transcripts...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Suggested Opportunity Questions
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleAsk(q)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs transition-colors border border-slate-200 text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
        <input
          type="text"
          placeholder={`Ask anything about ${selectedDeal.name}...`}
          value={questionInput}
          onChange={e => setQuestionInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          className="flex-1 px-3 py-1.5 text-xs text-slate-900 border-none focus:outline-hidden"
        />
        <button
          onClick={() => handleAsk()}
          disabled={!questionInput.trim() || isAnswering}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
