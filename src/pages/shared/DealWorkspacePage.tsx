import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import { computeDealRisks } from '../../lib/deals';
import { SOURCE_LABELS } from '../../components/common/SourceBadge';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Clock, FileText, Play,
  Sparkles, Users, Target, MessageSquare, Send, RotateCcw,
  ChevronRight, TrendingUp, ShieldCheck, Lightbulb, Save, X,
  Check, Circle, Award, BookOpen, Briefcase, Calendar, Building2
} from 'lucide-react';

type WorkspaceTab = 'overview' | 'timeline' | 'stakeholders' | 'risks' | 'prep';
type PrepStage = 'briefing' | 'call' | 'results';
type ChatMessage = {
  id: string;
  speaker: 'buyer' | 'rep';
  text: string;
  feedback?: string;
  score?: number;
};
type ResultMetric = { label: string; score: number; feedback: string };

const safeArray = <T,>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const makeBuyerOpening = (deal: any, stakeholder: any) => {
  const stage = String(deal.stage || '').toLowerCase();
  const name = stakeholder?.name || 'the buying team';
  if (stage.includes('negotiat') || stage.includes('proposal')) {
    return `Thanks for joining. We have reviewed the proposal for ${deal.name}. Before we move forward, I need to understand the commercial value, what makes your offer different, and what flexibility we have on the terms.`;
  }
  if (stage.includes('technical')) {
    return `Thanks for meeting. Our team has reviewed the technical details for ${deal.name}. I still have a few questions about implementation, practical fit, and how this will solve our current challenges.`;
  }
  return `Thanks for joining. I am looking at whether ${deal.companyName || 'your solution'} is the right fit for us. Can you first help me understand how this addresses our priorities and what the next step would look like?`;
};

const buyerReply = (answer: string, turn: number, deal: any) => {
  const a = answer.toLowerCase();
  const hasQuestion = answer.includes('?');
  const value = /roi|value|impact|save|revenue|cost|benefit|business outcome/.test(a);
  const empathy = /understand|appreciate|fair point|that makes sense|concern/.test(a);
  const proof = /example|data|case study|result|evidence|metric/.test(a);
  const next = /next step|timeline|decision|approve|schedule|align|confirm/.test(a);
  const discount = /discount|reduce the price|lower the price|waive/.test(a);

  if (turn === 1) {
    if (empathy && hasQuestion) return 'That is fair. The biggest concern is whether the expected outcome justifies the investment. How would you help us measure that?';
    if (value || proof) return 'That is useful, but I need something more concrete. What evidence or measurable outcome can you share that supports the business case?';
    return 'I hear you, but I still do not see a clear business reason to prioritise this. Can you connect the solution to an outcome we care about?';
  }
  if (turn === 2) {
    if (discount) return 'You moved to price very quickly. Is there a way to demonstrate value before we discuss changing the commercial terms?';
    if (value || proof) return 'That helps. I also need to know what implementation would require from our team and what risks we should plan for.';
    return 'Implementation risk is another concern for us. How will you make sure the transition is manageable?';
  }
  if (turn === 3) {
    if (hasQuestion) return 'Our decision will involve more than one person. Who would you recommend including, and what should we validate together?';
    return 'I am not the only person involved in this decision. How will you help us bring the right stakeholders into the conversation?';
  }
  if (turn === 4) {
    if (next) return 'Good. What would you need from our side before that next step, and who should own each action?';
    return 'We need a clear plan. What milestones would you suggest, and how can we keep both teams accountable?';
  }
  if (turn === 5) {
    if (empathy && next) return 'That sounds reasonable. Before we close, can you recap the value, the open questions, and the action we have agreed?';
    return 'I am still weighing the options. Give me a concise summary of why we should move ahead and what happens after this meeting.';
  }
  if (turn === 6) return 'One final concern: what happens if we do not achieve the expected outcome or timeline? How would you handle that with us?';
  if (turn === 7) return 'I appreciate the detail. Can you confirm the decision process and the people who need to sign off?';
  if (turn === 8) return 'What would you put in writing after this call so both teams have the same understanding?';
  if (turn === 9) return 'Before we finish, what is the single most important action you want us to take next?';
  return `Thank you. I have a clearer picture of the proposal for ${deal.name}. Please send a short recap with owners, milestones, and the agreed next step.`;
};

const evaluateAnswer = (answer: string) => {
  const a = answer.toLowerCase();
  let score = 45;
  if (/understand|appreciate|concern|fair point/.test(a)) score += 10;
  if (/\?/.test(answer)) score += 8;
  if (/roi|value|impact|revenue|save|benefit|business outcome/.test(a)) score += 10;
  if (/example|data|case study|result|metric|evidence/.test(a)) score += 8;
  if (/next step|timeline|decision|schedule|align|confirm|owner/.test(a)) score += 10;
  if (/discount|waive|guarantee|definitely|100%/.test(a)) score -= 8;
  if (answer.trim().length < 25) score -= 12;
  return clamp(score);
};

const feedbackFor = (answer: string) => {
  const a = answer.toLowerCase();
  const notes: string[] = [];
  if (/understand|appreciate|concern|fair point/.test(a)) notes.push('You acknowledged the buyer concern.');
  else notes.push('Acknowledge the buyer concern before moving into your pitch.');
  if (answer.includes('?')) notes.push('You used a question to keep the conversation open.');
  else notes.push('Ask a focused follow-up question to uncover the real blocker.');
  if (/roi|value|impact|revenue|save|benefit|business outcome/.test(a)) notes.push('You connected the discussion to business value.');
  else notes.push('Make the business impact clearer with a measurable outcome.');
  if (/next step|timeline|decision|schedule|align|confirm|owner/.test(a)) notes.push('You moved the discussion toward a concrete next step.');
  return notes.join(' ');
};

export const DealWorkspacePage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { deals, meetings, currentRole, currentUser } = useStore();

  const rolePrefix =
    currentRole === 'manager'
      ? 'manager'
      : currentRole === 'sales_rep'
        ? 'sales'
        : 'admin';

  // Manager visibility must come only from explicitly assigned representatives.
  // If the assignment list is not configured, the manager receives no team deals.
  const { scope, assignedReps } = useAccess();
  const roleScopedDeals = useMemo(
    () => scope(safeArray<any>(deals), (d: any) => d.ownerId),
    [deals, scope]
  );


  const deal = roleScopedDeals.find((d: any) => String(d.id) === String(dealId));
  const [activeTab, setActiveTab] = useState<WorkspaceTab>((searchParams.get('tab') as WorkspaceTab) || 'overview');
  const [selectedPrompt, setSelectedPrompt] = useState('focus');
  const [prepStage, setPrepStage] = useState<PrepStage>('briefing');
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState('');
  const [turn, setTurn] = useState(0);
  const [results, setResults] = useState<ResultMetric[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const dealKey = `sellmore-prep-${dealId || 'unknown'}`;
  const notesKey = `${dealKey}-notes`;
  const reviewKey = `${dealKey}-review`;

  useEffect(() => {
    const tab = searchParams.get('tab');
    const valid: WorkspaceTab[] = ['overview', 'timeline', 'stakeholders', 'risks', 'prep'];
    setActiveTab(valid.includes(tab as WorkspaceTab) ? tab as WorkspaceTab : 'overview');
  }, [searchParams]);

  useEffect(() => {
    if (!dealId) return;
    try {
      setNotes(localStorage.getItem(notesKey) || '');
      setReviewed(JSON.parse(localStorage.getItem(reviewKey) || '{}'));
    } catch {
      setNotes('');
      setReviewed({});
    }
    setPrepStage('briefing');
    setMessages([]);
    setTurn(0);
    setResults([]);
  }, [dealId]);

  const changeTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') params.delete('tab');
    else params.set('tab', tab);
    setSearchParams(params, { replace: true });
  };

  const stakeholders = safeArray<any>(deal?.stakeholders);
  // Risks come from the Salesforce record plus the analysed calls linked to this deal.
  const risks = useMemo(
    () => (deal ? computeDealRisks(deal, safeArray<any>(meetings)) : []),
    [deal, meetings]
  );
  const timeline = safeArray<any>(deal?.timeline);
  const dealMeetings = useMemo(() => {
    const linkedIds = new Set(timeline.map((t: any) => t.meetingId).filter(Boolean).map(String));
    return safeArray<any>(meetings)
      .filter((m: any) => (deal && String(m.associatedDealId ?? '') === String(deal.id)) || linkedIds.has(String(m.id)))
      .sort((x: any, y: any) => String(y.uploadDate).localeCompare(String(x.uploadDate)));
  }, [meetings, deal, timeline]);
  // Recommended next steps are read from the latest analysed call; they are not a task list.
  const latestAnalysed = dealMeetings.find((m: any) => m.processingStatus === 'Analysed' && safeArray<string>(m.recommendedNextSteps).length > 0);
  const recommendedSteps: string[] = latestAnalysed ? safeArray<string>(latestAnalysed.recommendedNextSteps) : [];
  const primaryStakeholder = stakeholders.find(s => /decision|economic|buyer|cfo|director|owner/i.test(`${s.role || ''} ${s.sentiment || ''}`)) || stakeholders[0];

  const objective = useMemo(() => {
    const stage = String(deal?.stage || '').toLowerCase();
    if (stage.includes('negotiat') || stage.includes('proposal')) return 'Build confidence in the commercial value, resolve outstanding objections, and agree on the decision path.';
    if (stage.includes('technical')) return 'Confirm technical fit, surface implementation concerns, and align the buying team on validation criteria.';
    if (stage.includes('discovery')) return 'Understand the buyer priorities, uncover the business problem, and qualify the decision process.';
    return 'Clarify the buyer’s priorities, connect the solution to business outcomes, and agree on a specific next step.';
  }, [deal?.stage]);

  const talkingPoints = useMemo(() => {
    const items = [
      `Connect the solution to ${deal?.companyName || 'the buyer'}’s business priorities, not just product features.`,
      'Ask at least one open question before recommending a solution.',
      'Use evidence, examples, or measurable outcomes to support your claims.',
      'Understand who is involved in the decision and what each person needs.',
      'End with a clear next step, owner, and expected timeline.'
    ];
    if (risks.length) items[2] = `Address the known deal risk: ${risks[0]}`;
    if (recommendedSteps.length) items[4] = `Confirm the next action: ${recommendedSteps[0]}`;
    return items;
  }, [deal?.companyName, risks, recommendedSteps]);

  const objections = useMemo(() => {
    const firstRisk = risks[0];
    const stage = String(deal?.stage || '').toLowerCase();
    return [
      {
        title: 'Price and business value',
        why: 'The buyer may need stronger commercial justification before committing.',
        response: 'Clarify the value criteria, quantify the impact where possible, and only then discuss commercial options.'
      },
      {
        title: stage.includes('technical') ? 'Technical fit and implementation' : 'Implementation and delivery risk',
        why: firstRisk || 'The buyer may be concerned about effort, timeline, or operational disruption.',
        response: 'Ask which requirement is most important, explain the validation process, and avoid unverified promises.'
      },
      {
        title: 'Decision process and stakeholder alignment',
        why: 'The buying process may involve people who have not yet joined the conversation.',
        response: 'Map the decision-makers, ask what each stakeholder needs, and propose a shared next step.'
      }
    ];
  }, [deal?.stage, risks]);

  const saveNotes = () => {
    try {
      localStorage.setItem(notesKey, notes);
      localStorage.setItem(reviewKey, JSON.stringify(reviewed));
      setNotesSaved(true);
      window.setTimeout(() => setNotesSaved(false), 1800);
    } catch {
      setNotesSaved(false);
    }
  };

  const toggleReviewed = (key: string) => {
    setReviewed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(reviewKey, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const startCall = () => {
    const opening = makeBuyerOpening(deal, primaryStakeholder);
    setMessages([{ id: 'buyer-opening', speaker: 'buyer', text: opening }]);
    setTurn(0);
    setResults([]);
    setAnswer('');
    setPrepStage('call');
  };

  const finishCall = (completedTurn: number, transcript: ChatMessage[]) => {
    const repMessages = transcript.filter(m => m.speaker === 'rep');
    const avg = repMessages.length
      ? Math.round(repMessages.reduce((sum, m) => sum + (m.score || 0), 0) / repMessages.length)
      : 0;
    const count = (pattern: RegExp) => repMessages.filter(m => pattern.test(m.text.toLowerCase())).length;
    const metrics: ResultMetric[] = [
      { label: 'Discovery & questioning', score: clamp(35 + count(/\?/) * 12), feedback: count(/\?/) ? 'You used questions to explore buyer needs.' : 'Ask more open-ended discovery questions.' },
      { label: 'Active listening', score: clamp(35 + count(/understand|appreciate|concern|fair point/) * 16), feedback: 'Acknowledge the buyer’s concern and respond to what they actually said.' },
      { label: 'Business value', score: clamp(30 + count(/roi|value|impact|revenue|save|benefit|business outcome/) * 17), feedback: 'Tie recommendations to measurable business outcomes.' },
      { label: 'Objection handling', score: clamp(35 + count(/because|however|example|evidence|data|alternative/) * 12), feedback: 'Clarify the objection before presenting evidence or options.' },
      { label: 'Closing & next steps', score: clamp(30 + count(/next step|timeline|decision|schedule|align|confirm|owner/) * 18), feedback: 'Finish with an agreed action, owner, and timeline.' }
    ];
    if (repMessages.length) metrics[0].score = clamp(Math.round((metrics[0].score + avg) / 2));
    setResults(metrics);
    setPrepStage('results');
  };

  const submitAnswer = () => {
    const clean = answer.trim();
    if (!clean || turn >= 10) return;
    const nextTurn = turn + 1;
    const score = evaluateAnswer(clean);
    const repMessage: ChatMessage = {
      id: `rep-${nextTurn}`,
      speaker: 'rep',
      text: clean,
      score,
      feedback: feedbackFor(clean)
    };
    const updated = [...messages, repMessage];
    setAnswer('');
    setTurn(nextTurn);

    if (nextTurn >= 10) {
      const finalTranscript = [...updated, {
        id: 'buyer-final',
        speaker: 'buyer' as const,
        text: 'Thank you. Please send the recap with the agreed actions and owners.'
      }];
      setMessages(finalTranscript);
      finishCall(nextTurn, finalTranscript);
      return;
    }

    const response = buyerReply(clean, nextTurn, deal);
    updated.push({ id: `buyer-${nextTurn}`, speaker: 'buyer', text: response });
    setMessages(updated);
  };

  const endCall = () => {
    if (turn === 0) {
      setPrepStage('briefing');
      return;
    }
    finishCall(turn, messages);
  };

  if (!deal) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle /></div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Deal Not Available</h2>
        <p className="mt-1 text-sm text-slate-500">
          This deal is not in your permitted deal list, may have been removed, or your team assignment may not be configured.
        </p>
        <Link to={`/${rolePrefix}/deals`} className="inline-flex mt-4 text-sm text-blue-600 font-semibold">Back to Deal Dashboard</Link>
      </div>
    );
  }

  const roleplayTitle = primaryStakeholder ? `${primaryStakeholder.name} · ${primaryStakeholder.role}` : 'Buyer representative';
  const totalReviewed = Object.values(reviewed).filter(Boolean).length;
  const overallScore = results.length ? Math.round(results.reduce((s, m) => s + m.score, 0) / results.length) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link to={`/${rolePrefix}/deals`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Deal Dashboard
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">{deal.crmId ? `Opportunity ID: ${deal.crmId}` : `Deal ID: ${deal.id}`}</span>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">{deal.stage}</span>
              {deal.source === 'draft' ? (
                <span className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold">Draft · not in Salesforce yet</span>
              ) : (
                <span className="px-2 py-1 rounded border border-sky-200 bg-sky-50 text-sky-700 text-[11px] font-semibold">
                  Salesforce{deal.rawStage && deal.rawStage !== deal.stage ? ` · ${deal.rawStage}` : ''}
                </span>
              )}
              <span className="text-xs text-slate-400">{deal.callCount || 0} calls · {deal.emailCount || 0} emails</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">{deal.name}</h1>
            <p className="text-xs text-slate-500 mt-1">{deal.companyName} · Owner: {deal.ownerName} · Last interaction: {deal.lastMeetingDate || 'Not available'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Opportunity value</p><p className="text-xl font-bold text-slate-900">${Number(deal.amount || 0).toLocaleString()}</p><p className="text-[10px] text-slate-500">Close: {deal.closeDate || 'Not set'}</p></div>
            <button onClick={() => changeTab('prep')} className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Prep Call</button>
          </div>
        </div>
      </section>

      {activeTab !== 'prep' && (
        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Meetings held for this deal</h3>
              <p className="mt-0.5 text-xs text-slate-500">Newest first. Open a report for the full analysis.</p>
            </div>
            <span className="text-xs tabular-nums text-slate-500">
              {dealMeetings.length} {dealMeetings.length === 1 ? 'meeting' : 'meetings'}
            </span>
          </header>

          {dealMeetings.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pl-5 pr-3 font-semibold">Meeting</th>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Score</th>
                    <th className="px-3 py-2.5 font-semibold">What it showed</th>
                    <th className="py-2.5 pl-3 pr-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealMeetings.map((m: any) => {
                    const analysed = m.processingStatus === 'Analysed';
                    const objectionCount = safeArray<any>(m.objections).length;
                    const gap = safeArray<string>(m.whereRepStruggled)[0];
                    return (
                      <tr key={m.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="py-3.5 pl-5 pr-3 align-top">
                          <Link to={`/${rolePrefix}/meetings/${m.id}`} className="text-[13px] font-semibold text-slate-900 hover:text-blue-700 hover:underline">
                            {m.name}
                          </Link>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {m.representativeName} · {SOURCE_LABELS[(m.source ?? 'upload') as keyof typeof SOURCE_LABELS]}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 align-top text-[13px] text-slate-700">
                          {m.uploadDate}
                          <div className="text-xs text-slate-400">{m.duration}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 align-top">
                          {analysed && m.overallScorePercent != null ? (
                            <div className="w-24">
                              <span className="text-[13px] font-semibold tabular-nums text-slate-900">{m.overallScorePercent}%</span>
                              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${m.overallScorePercent}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{m.processingStatus}</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          {analysed ? (
                            <>
                              <p className="max-w-sm text-[13px] leading-5 text-slate-700 line-clamp-2">{gap ? `Gap: ${gap}` : m.summary}</p>
                              <div className="mt-1 text-xs text-slate-400">
                                {objectionCount ? `${objectionCount} objection${objectionCount === 1 ? '' : 's'} raised` : 'No objections raised'}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Analysis pending</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pl-3 pr-5 text-right align-top">
                          <Link to={`/${rolePrefix}/meetings/${m.id}`} className="text-[13px] font-medium text-blue-700 hover:underline">
                            View report →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">
              Waiting for the first call. When a recording on this Opportunity is imported from Salesforce, or you link a call from the Meeting Library, it appears here and starts the risks and coaching.
            </p>
          )}
        </section>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Recent Events</h3>
            {timeline.slice(0, 5).length ? timeline.slice(0, 5).map((item: any) => <div key={item.id} className="border-t border-slate-100 pt-3"><p className="font-semibold text-xs text-slate-800">{item.title}</p><p className="text-[11px] text-slate-500 mt-1">{item.date} · {item.description}</p></div>) : <p className="text-xs text-slate-500">No timeline events available.</p>}
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-900">Deal Health & Coaching Focus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{deal.name} is currently in {deal.stage}. Prepare around the buyer’s business priorities, validate outstanding risks, and agree on a measurable next step.</p>
            {risks.length > 0 && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-xs font-bold text-amber-900 flex gap-2"><AlertTriangle className="w-4 h-4" /> Attention areas</p><ul className="mt-2 space-y-1 text-xs text-amber-900">{risks.map((r, i) => <li key={i}>• {r}</li>)}</ul></div>}
            <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-slate-800">Recommended next steps from the latest call</h4><button onClick={() => changeTab('risks')} className="text-xs text-blue-600">View all</button></div>
            {recommendedSteps.length ? recommendedSteps.slice(0, 4).map((step, i) => <div key={i} className="p-3 rounded-lg border border-slate-200 text-xs text-slate-700">{step}</div>) : <p className="text-xs text-slate-500">No analysed call on this deal yet.</p>}
          </section>
        </div>
      )}

      {activeTab === 'timeline' && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Chronological Interaction Timeline</h3>
          {timeline.length ? timeline.map((item: any) => <div key={item.id} className="border-l-2 border-blue-200 pl-4 py-2"><div className="flex justify-between gap-3"><p className="font-semibold text-xs">{item.title}</p><span className="text-[10px] text-slate-400">{item.date}</span></div><p className="text-xs text-slate-600 mt-1">{item.description}</p>{item.meetingId && <Link to={`/${rolePrefix}/meetings/${item.meetingId}`} className="text-xs text-blue-600 inline-block mt-2">Open meeting report →</Link>}</div>) : <p className="text-xs text-slate-500">No timeline events available.</p>}
        </section>
      )}

      {activeTab === 'stakeholders' && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.length ? stakeholders.map((s: any) => <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex items-start justify-between"><div><h3 className="font-bold text-sm">{s.name}</h3><p className="text-xs text-slate-500">{s.role}</p></div><span className="text-[10px] px-2 py-1 bg-slate-100 rounded">{s.sentiment || 'Unclassified'}</span></div><p className="text-[11px] text-slate-500 mt-3">Last contact: {s.lastSpoke || 'Not available'}</p><p className="text-[11px] text-slate-500">Company: {s.company || deal.companyName}</p></div>) : <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">No stakeholders have been added to this deal.</div>}
        </section>
      )}

      {activeTab === 'risks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-sm mb-3">Detected Deal Risks</h3>{risks.length ? risks.map((r, i) => <div key={i} className="p-3 mb-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">{r}</div>) : <p className="text-xs text-slate-500">No risks found for this deal.</p>}</section>
          <section className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-sm mb-3">Recommended Next Steps</h3>{recommendedSteps.length ? recommendedSteps.map((step, i) => <div key={i} className="p-3 mb-2 border border-slate-200 rounded-lg text-xs text-slate-700">{step}</div>) : <p className="text-xs text-slate-500">No analysed call on this deal yet.</p>}{latestAnalysed && <p className="text-[10px] text-slate-400 mt-2">From {latestAnalysed.name}</p>}</section>
        </div>
      )}

      {activeTab === 'prep' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Deal-specific call preparation</p><h2 className="text-xl font-bold text-slate-900 mt-1">{prepStage === 'briefing' ? 'Prepare for your meeting' : prepStage === 'call' ? 'Mock buyer conversation' : 'Your performance review'}</h2><p className="text-xs text-slate-500 mt-1">{deal.name} · {deal.companyName}</p></div>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              {(['briefing', 'call', 'results'] as PrepStage[]).map((s, i) => <React.Fragment key={s}><span className={`px-3 py-2 rounded-lg ${prepStage === s ? 'bg-blue-600 text-white' : (['briefing', 'call', 'results'].indexOf(prepStage) > i ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}`}>{String(i + 1).padStart(2, '0')} {s === 'briefing' ? 'Prepare' : s === 'call' ? 'Mock Call' : 'Results'}</span>{i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}</React.Fragment>)}
            </div>
          </div>

          {prepStage === 'briefing' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 space-y-4">
                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-blue-700"><Target className="w-4 h-4" /><h3 className="font-bold text-sm">Your meeting objective</h3></div>
                  <p className="text-sm text-slate-800 font-semibold mt-3">{objective}</p>
                  <p className="text-xs text-slate-500 mt-2">Target outcome: leave the conversation with a confirmed decision path and a specific next action.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">{[['Stage', deal.stage], ['Deal value', `$${Number(deal.amount || 0).toLocaleString()}`], ['Owner', deal.ownerName], ['Close date', deal.closeDate || 'Not set']].map(([k, v]) => <div key={k} className="p-3 bg-slate-50 rounded-lg"><p className="text-[10px] text-slate-400">{k}</p><p className="text-xs font-bold text-slate-800 mt-1">{v}</p></div>)}</div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /><h3 className="font-bold text-sm">Key talking points – remember these</h3></div><span className="text-[11px] text-slate-500">{totalReviewed}/5 reviewed</span></div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${totalReviewed / 5 * 100}%` }} /></div>
                  <div className="space-y-2 mt-4">{talkingPoints.map((point, i) => <label key={i} className="flex gap-3 items-start p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={!!reviewed[`talk-${i}`]} onChange={() => toggleReviewed(`talk-${i}`)} className="mt-0.5 rounded text-blue-600" /><span className={`text-xs ${reviewed[`talk-${i}`] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{point}</span></label>)}</div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-indigo-600" /><h3 className="font-bold text-sm">Stakeholder reminders</h3></div>
                  {stakeholders.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{stakeholders.map((s: any, i: number) => <div key={s.id} className="p-3 bg-slate-50 rounded-lg"><div className="flex justify-between gap-2"><p className="font-bold text-xs text-slate-800">{s.name}</p><span className="text-[10px] text-slate-500">{s.sentiment || 'Stakeholder'}</span></div><p className="text-[11px] text-slate-500 mt-0.5">{s.role}</p><p className="text-[11px] text-slate-700 mt-2">{/cfo|finance|economic|decision/i.test(`${s.role} ${s.sentiment}`) ? 'Focus on ROI, budget, financial justification, and measurable business impact.' : /technical|engineer|it|security/i.test(s.role) ? 'Focus on technical fit, implementation, integrations, and risk validation.' : 'Understand this stakeholder’s priorities, concerns, influence, and required next action.'}</p></div>)}</div> : <p className="text-xs text-slate-500">No stakeholders are linked to this deal yet. Use the questions below to identify the buying committee.</p>}
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-sm mb-3">Likely objections and response direction</h3>
                  <div className="space-y-3">{objections.map((o, i) => <div key={i} className="p-3 border border-slate-200 rounded-lg"><p className="text-xs font-bold text-slate-800">{o.title}</p><p className="text-[11px] text-slate-500 mt-1">Why it may come up: {o.why}</p><p className="text-[11px] text-emerald-800 mt-2"><strong>Response direction:</strong> {o.response}</p></div>)}</div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="bg-amber-50 border border-amber-200 rounded-xl p-5"><h3 className="font-bold text-sm text-amber-900 flex gap-2"><ShieldCheck className="w-4 h-4" /> Things to avoid</h3><ul className="space-y-2 mt-3 text-xs text-amber-900"><li>• Do not offer a discount before understanding the concern.</li><li>• Do not promise timelines or capabilities you have not validated.</li><li>• Do not ignore risks already recorded on this deal.</li><li>• Do not focus on one contact while overlooking other decision-makers.</li><li>• Do not end without confirming the next action and owner.</li></ul>{risks.length > 0 && <div className="mt-3 pt-3 border-t border-amber-200"><p className="text-[10px] font-bold uppercase text-amber-800">Deal-specific risk to remember</p><p className="text-xs text-amber-900 mt-1">{risks[0]}</p></div>}</section>
                <section className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-sm text-slate-900">Questions to ask the buyer</h3><ul className="space-y-3 mt-3 text-xs text-slate-600">{['What is the biggest concern preventing you from moving forward?', 'Who else needs to approve this decision?', 'What criteria will determine the final decision?', 'What needs to happen before we agree on the next milestone?', 'What would make this meeting a successful outcome for you?'].map((q, i) => <li key={i} className="flex gap-2"><span className="text-blue-600 font-bold">{i + 1}.</span>{q}</li>)}</ul></section>
                <section className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center justify-between"><h3 className="font-bold text-sm">Personal preparation notes</h3><button onClick={saveNotes} className="text-xs text-blue-600 font-semibold inline-flex items-center gap-1"><Save className="w-3 h-3" /> Save</button></div><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={7} placeholder="Write your own reminders, buyer context, questions, or points to raise..." className="w-full mt-3 p-3 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-y" /><div className="flex justify-between items-center mt-2"><span className="text-[10px] text-slate-400">Saved privately in this browser for this deal.</span>{notesSaved && <span className="text-[10px] text-emerald-600 font-semibold">Saved</span>}</div></section>
                <button onClick={startCall} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex justify-center items-center gap-2 shadow-sm"><Play className="w-4 h-4" /> Start Mock Call <ChevronRight className="w-4 h-4" /></button>
                <p className="text-[10px] text-center text-slate-400">Interactive text-based simulation · Up to 10 response turns</p>
              </aside>
            </div>
          )}

          {prepStage === 'call' && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 md:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Live simulation · not a real call</p><h3 className="font-bold text-base text-slate-900 mt-1">{deal.name} – Buyer meeting</h3><p className="text-xs text-slate-500 mt-1">{roleplayTitle}</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-xs font-bold text-slate-800">Turn {turn}/10</p><p className="text-[10px] text-slate-400">Representative responses</p></div><button onClick={() => setShowExitConfirm(true)} className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold">End meeting</button></div></div>
              <div className="h-1.5 bg-slate-100"><div className="h-full bg-blue-600 transition-all" style={{ width: `${turn * 10}%` }} /></div>
              <div className="p-4 md:p-6 space-y-4 max-h-[55vh] overflow-y-auto bg-slate-50">{messages.map(m => <div key={m.id} className={`flex ${m.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] md:max-w-[75%] rounded-2xl p-4 ${m.speaker === 'rep' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}><p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${m.speaker === 'rep' ? 'text-blue-100' : 'text-slate-400'}`}>{m.speaker === 'rep' ? 'You · Sales representative' : `${primaryStakeholder?.name || 'Buyer'} · Buyer`}</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>{m.feedback && <p className="text-[10px] mt-2 pt-2 border-t border-white/20 text-blue-100">Practice feedback: {m.feedback}</p>}</div></div>)}</div>
              <div className="p-4 md:p-5 border-t border-slate-200"><label className="text-xs font-bold text-slate-800">Your response</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }} rows={3} placeholder="Respond as you would in a real sales meeting. Press Enter to send, Shift + Enter for a new line." className="w-full mt-2 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-y" /><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3"><p className="text-[10px] text-slate-400">Tip: acknowledge the concern, ask a question, explain value, and agree on a next step.</p><button onClick={submitAnswer} disabled={!answer.trim()} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2"><Send className="w-3.5 h-3.5" /> Send response</button></div></div>
            </section>
          )}

          {prepStage === 'results' && (
            <div className="space-y-4">
              <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600">Simulation completed</p><h3 className="text-xl font-bold text-slate-900 mt-1">Your mock call results</h3><p className="text-xs text-slate-500 mt-1">{deal.name} · {turn} representative responses</p></div><div className="w-28 h-28 rounded-full border-8 border-blue-100 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-slate-900">{overallScore}</span><span className="text-[9px] uppercase text-slate-400">out of 100</span></div></div>
                <p className="text-xs text-slate-600 mt-4">{overallScore >= 80 ? 'Strong performance. Keep building on your consultative approach.' : overallScore >= 60 ? 'Good foundation. A few targeted improvements can make your conversations more effective.' : 'Use this as a practice opportunity. Focus on discovery, value communication, and clear next steps.'}</p>
              </section>
              <section className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-sm mb-4">Skill breakdown</h3><div className="space-y-4">{results.map(metric => <div key={metric.label}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-800">{metric.label}</span><span className="font-bold text-slate-900">{metric.score}/100</span></div><div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${metric.score}%` }} /></div><p className="text-[11px] text-slate-500 mt-1">{metric.feedback}</p></div>)}</div></section>
              <section className="bg-white border border-slate-200 rounded-xl p-5"><h3 className="font-bold text-sm mb-3">Response-by-response review</h3><div className="space-y-3">{messages.filter(m => m.speaker === 'rep').map((m, i) => <div key={m.id} className="p-3 rounded-lg border border-slate-200"><div className="flex justify-between gap-2"><p className="text-[10px] font-bold uppercase text-slate-400">Your response · Turn {i + 1}</p><span className="text-[10px] font-bold text-blue-700">{m.score}/100</span></div><p className="text-xs text-slate-800 mt-2">{m.text}</p><p className="text-[11px] text-slate-500 mt-2">{m.feedback}</p></div>)}</div></section>
              <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-5"><h3 className="font-bold text-sm text-indigo-950 flex gap-2"><Lightbulb className="w-4 h-4" /> Recommended next practice</h3><p className="text-xs text-indigo-900 mt-2">{[...results].sort((a, b) => a.score - b.score)[0]?.label || 'Discovery and questioning'} is your lowest-scoring area. Practise this skill in a focused lesson, then retry the deal simulation.</p></section>
              <div className="flex flex-wrap gap-2"><button onClick={startCall} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Retry Mock Call</button><button onClick={() => setPrepStage('briefing')} className="px-4 py-2.5 border border-slate-200 bg-white rounded-lg text-xs font-bold">Review Preparation</button><button onClick={() => navigate(`/${rolePrefix}/practice`)} className="px-4 py-2.5 border border-slate-200 bg-white rounded-lg text-xs font-bold">Practise a Skill</button><button onClick={() => changeTab('overview')} className="px-4 py-2.5 border border-slate-200 bg-white rounded-lg text-xs font-bold">Back to Deal Workspace</button></div>
            </div>
          )}
        </div>
      )}

      {showExitConfirm && <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl"><div className="flex justify-between items-center"><h3 className="font-bold text-sm">End this mock meeting?</h3><button onClick={() => setShowExitConfirm(false)}><X className="w-4 h-4 text-slate-400" /></button></div><p className="text-xs text-slate-500 mt-2">Your current conversation will be used to create a practice review. You can also continue the meeting.</p><div className="flex justify-end gap-2 mt-5"><button onClick={() => setShowExitConfirm(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold">Continue meeting</button><button onClick={() => { setShowExitConfirm(false); endCall(); }} className="px-3 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold">End meeting</button></div></div></div>}
    </div>
  );
};
