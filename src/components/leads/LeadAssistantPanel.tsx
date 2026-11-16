import React, { useState } from 'react';
import { Clock, Database, Send, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { computeDealRisks, getDealMeetings } from '../../lib/deals';
import { DealRecord, MeetingRecord } from '../../types';

interface QAMessage {
  question: string;
  answer: string;
  sources: { title: string; timestamp?: string; type: 'meeting' | 'crm' }[];
}

/**
 * Answers a question from the selected lead's own data: its Salesforce fields,
 * contact roles, computed risks, and the analysed calls linked to it.
 * (Placeholder for retrieval over transcripts; it never uses another lead's data.)
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
      answer = `No contacts are set on "${deal.name}" yet.`;
    } else {
      answer = deal.stakeholders
        .map(s => `${s.name}, ${s.role}: ${s.sentiment}. Last spoke ${s.lastSpoke}.`)
        .join('\n');
    }
    crm(deal.source === 'crm' ? 'Salesforce Opportunity Contact Roles' : 'Lead contacts');
  } else if (/risk|concern|block|problem|worr/.test(q)) {
    const risks = computeDealRisks(deal, allMeetings);
    answer = risks.length
      ? risks.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : `No risks found for "${deal.name}".`;
    crm(deal.source === 'crm' ? 'Salesforce Opportunity' : 'Lead record');
    analysed.slice(0, 2).forEach(call);
  } else if (/objection/.test(q)) {
    const objections = analysed.flatMap(m => (m.objections || []).map(o => ({ m, o })));
    answer = objections.length
      ? objections.map(({ m, o }) => `${o.objection} (${o.status}). Rep said: ${o.repResponse}`).join('\n')
      : 'No objections are recorded in the analysed calls on this lead.';
    objections.slice(0, 3).forEach(({ m }) => call(m));
  } else if (/next|step|action|follow/.test(q)) {
    const latest = analysed.find(m => (m.recommendedNextSteps || []).length > 0);
    answer = latest
      ? (latest.recommendedNextSteps || []).map((t, i) => `${i + 1}. ${t}`).join('\n')
      : 'No analysed call on this lead has recommended next steps yet.';
    if (latest) call(latest);
  } else if (/stage|amount|value|close|status|when|owner|price/.test(q)) {
    answer =
      `"${deal.name}" is in ${deal.stage}` +
      (deal.rawStage && deal.rawStage !== deal.stage ? ` (Salesforce stage: ${deal.rawStage})` : '') +
      `, worth $${deal.amount.toLocaleString()}, owned by ${deal.ownerName}. ` +
      `Close date: ${deal.closeDate || 'not set'}. ${deal.callCount} calls linked.`;
    crm(deal.source === 'crm' ? 'Salesforce Opportunity' : 'Lead record');
  } else {
    const latest = analysed[0];
    answer =
      `"${deal.name}" (${deal.companyName}) is in ${deal.stage}, owned by ${deal.ownerName}, with ${deal.callCount} calls linked.` +
      (latest?.summary ? ` Latest call: ${latest.summary}` : '');
    crm(deal.source === 'crm' ? 'Salesforce Opportunity' : 'Lead record');
    if (latest) call(latest);
  }

  if (analysed.length === 0) {
    answer += '\n\nNo analysed call is linked to this lead yet, so this answer uses the lead record only.';
  }
  return { answer, sources };
};


/** Ask questions about one lead. Answers come from the lead's own record, contacts, risks and analysed calls. */
export const LeadAssistantPanel: React.FC<{ deal: DealRecord }> = ({ deal }) => {
  const { meetings } = useStore();
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [history, setHistory] = useState<QAMessage[]>([]);

  const handleAsk = (text?: string) => {
    const q = text || questionInput;
    if (!q.trim() || isAnswering) return;
    setIsAnswering(true);
    setQuestionInput('');
    setTimeout(() => {
      const { answer, sources } = answerForDeal(q, deal, getDealMeetings(deal, meetings), meetings);
      setHistory(prev => [...prev, { question: q, answer, sources }]);
      setIsAnswering(false);
    }, 800);
  };

  const suggested = [
    'Who are the decision makers on this lead?',
    'What risks does this lead have?',
    'What objections came up in the calls?',
    'What are the recommended next steps?'
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[13px] font-semibold text-slate-900">Ask about this lead</h3>
        <p className="mt-0.5 text-xs text-slate-500">Answers use this lead's contacts, risks and analysed calls only.</p>
      </div>

      <div className="space-y-4">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">Q</div>
              <h4 className="text-sm font-semibold leading-snug text-slate-900">{item.question}</h4>
            </div>
            <div className="space-y-3 pl-8">
              <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 leading-relaxed text-slate-700">{item.answer}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sources:</span>
                {item.sources.map((src, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                    {src.type === 'meeting' ? <Clock className="h-3 w-3 text-blue-500" /> : <Database className="h-3 w-3 text-emerald-500" />}
                    {src.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isAnswering && (
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 animate-spin text-blue-600" />
            Reading this lead's record and call transcripts…
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Suggested questions</div>
        <div className="flex flex-wrap gap-2">
          {suggested.map(q => (
            <button key={q} onClick={() => handleAsk(q)} className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700">{q}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder={`Ask anything about ${deal.name}...`}
          value={questionInput}
          onChange={e => setQuestionInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          className="flex-1 border-none px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
        />
        <button onClick={() => handleAsk()} disabled={!questionInput.trim() || isAnswering} aria-label="Send question" className="shrink-0 rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-40">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
