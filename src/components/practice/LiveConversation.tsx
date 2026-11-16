import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Mic, Send, Sparkles, X } from 'lucide-react';
import { PracticeLesson, cueName } from '../../data/practiceLessons';
import {
  Correction, checksForTurn, cleanTranscript, correctReply, evaluateChecks, fillName
} from '../../lib/practiceCorrection';

const BUYER_NAME = 'Daniel Brooks';
const BUYER_ROLE = 'Procurement Lead, Brightline Aerospace';

type Phase = 'buyer' | 'your-turn' | 'listening' | 'corrected' | 'done';

interface Message {
  id: number;
  role: 'buyer' | 'rep';
  /** The full text. The visible part grows word by word while `streaming` is true. */
  text: string;
  visible: string;
  streaming: boolean;
  correction?: Correction;
  turnIndex?: number;
}

export const CueBadge: React.FC<{ cueId: number; tone?: 'neutral' | 'pass' | 'miss' }> = ({ cueId, tone = 'neutral' }) => {
  const styles = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    miss: 'border-amber-200 bg-amber-50 text-amber-800'
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${styles}`}>
      <span className="tabular-nums text-slate-400">{cueId}</span>{cueName(cueId)}
    </span>
  );
};

/** Animated bars: a stand-in for a live audio level while the demo speech-to-text runs. */
const Waveform: React.FC<{ active: boolean; tone: 'blue' | 'slate' }> = ({ active, tone }) => (
  <span className="inline-flex h-4 items-end gap-[2px]" aria-hidden="true">
    {[0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8].map((h, i) => (
      <span
        key={i}
        className={`w-[3px] rounded-sm ${tone === 'blue' ? 'bg-blue-500' : 'bg-slate-400'}`}
        style={{
          height: active ? `${h * 100}%` : '20%',
          animation: active ? `practice-wave 0.9s ease-in-out ${i * 0.09}s infinite alternate` : undefined
        }}
      />
    ))}
  </span>
);

export interface LiveResult {
  corrections: Correction[];
}

interface Props {
  lesson: PracticeLesson;
  repName: string;
  onExit: () => void;
  onFinish: (result: LiveResult) => void;
}

export const LiveConversation: React.FC<Props> = ({ lesson, repName, onExit, onFinish }) => {
  const repFirst = repName.split(' ')[0] || 'Sam';
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>('buyer');
  const [turn, setTurn] = useState(0);
  const [draft, setDraft] = useState('');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [openModel, setOpenModel] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  /** Reveals text one word at a time, like a live transcript, then calls done. */
  const stream = useCallback((text: string, onWord: (visible: string) => void, done: () => void, perWord = 90) => {
    const parts = text.split(' ');
    let i = 0;
    const step = () => {
      i += 1;
      onWord(parts.slice(0, i).join(' '));
      if (i < parts.length) later(step, perWord);
      else done();
    };
    later(step, 250);
  }, []);

  const buyerSays = useCallback((text: string, then: () => void) => {
    const id = nextId.current++;
    setPhase('buyer');
    setMessages(prev => [...prev, { id, role: 'buyer', text, visible: '', streaming: true }]);
    stream(
      text,
      visible => setMessages(prev => prev.map(m => m.id === id ? { ...m, visible } : m)),
      () => { setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false } : m)); then(); },
      70
    );
  }, [stream]);

  useEffect(() => {
    buyerSays(fillName(lesson.turns[0].buyer, repFirst), () => setPhase('your-turn'));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [messages, phase]);

  const checks = useMemo(() => checksForTurn(lesson, turn), [lesson, turn]);
  const liveResults = useMemo(
    () => evaluateChecks(draft.trim() ? cleanTranscript(draft).cleaned : '', checks),
    [draft, checks]
  );

  const submit = (raw: string) => {
    if (!raw.trim()) return;
    const correction = correctReply(raw, lesson, repFirst, turn);
    const id = nextId.current++;
    setMessages(prev => [...prev, { id, role: 'rep', text: raw, visible: raw, streaming: false, correction, turnIndex: turn }]);
    setCorrections(prev => [...prev, correction]);
    setDraft('');
    setPhase('corrected');
  };

  const speak = () => {
    if (phase !== 'your-turn') return;
    setDraft('');
    setPhase('listening');
    const spoken = fillName(lesson.turns[turn].spoken, repFirst);
    stream(spoken, visible => setDraft(visible), () => later(() => submit(spoken), 700), 230);
  };

  const last = corrections[corrections.length - 1];

  const next = () => {
    const nextTurn = turn + 1;
    const reaction = last && last.score >= 67 ? 'That helps, thank you. ' : 'I am not fully convinced yet. ';
    if (nextTurn < lesson.turns.length) {
      setTurn(nextTurn);
      setOpenModel(null);
      buyerSays(reaction + fillName(lesson.turns[nextTurn].buyer, repFirst), () => setPhase('your-turn'));
    } else {
      buyerSays(reaction + fillName(lesson.closing, repFirst), () => setPhase('done'));
    }
  };

  const running = useMemo(() => {
    const out: Record<number, { passed: number; total: number }> = {};
    lesson.cueIds.forEach(id => { out[id] = { passed: 0, total: 0 }; });
    corrections.forEach(c => c.results.forEach(r => {
      const e = out[r.check.cueId];
      if (!e) return;
      e.total += 1;
      if (r.passed) e.passed += 1;
    }));
    return out;
  }, [corrections, lesson]);

  return (
    <div className="space-y-4">
      <style>{'@keyframes practice-wave { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => { clearTimers(); onExit(); }} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Exit practice
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">Live practice</span>
          <span className="tabular-nums">Turn {Math.min(turn + 1, lesson.turns.length)} of {lesson.turns.length}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Conversation */}
        <section className="flex min-h-[560px] flex-col rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">DB</span>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">{BUYER_NAME} <span className="font-normal text-slate-400">· AI buyer</span></div>
                <div className="text-xs text-slate-500">{BUYER_ROLE}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Waveform active={phase === 'buyer'} tone="slate" />
              {phase === 'buyer' ? 'Speaking' : 'Listening to you'}
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5" aria-live="polite">
            {messages.map(m => (
              <div key={m.id} className={m.role === 'rep' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {m.role === 'buyer' ? BUYER_NAME : 'You'}
                  <span className="font-normal normal-case tracking-normal">· live transcript</span>
                </div>
                <div className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${m.role === 'buyer' ? 'border border-slate-200 bg-slate-50 text-slate-800' : 'bg-blue-600 text-white'}`}>
                  {m.visible}
                  {m.streaming && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-current align-middle" />}
                </div>

                {m.correction && (
                  <div className="mt-3 w-full max-w-[88%] rounded-lg border border-slate-200 bg-white text-left">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Auto-correct
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">
                        <span className="font-semibold text-slate-900">{m.correction.results.filter(r => r.passed).length}</span>/{m.correction.results.length} checks met
                      </span>
                    </div>
                    <div className="space-y-3 px-4 py-3">
                      {m.correction.changes.length > 0 && (
                        <p className="text-xs text-slate-500">Cleaned up: {m.correction.changes.join(', ').toLowerCase()}.</p>
                      )}
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Corrected reply</div>
                        <p className="text-[13px] leading-6 text-slate-800">
                          {m.correction.segments.map((s, i) => (
                            <span key={i} className={s.added ? 'rounded-sm bg-blue-50 px-0.5 text-blue-800' : ''}>{s.text}{' '}</span>
                          ))}
                        </p>
                        {m.correction.addedCount > 0 && (
                          <p className="mt-1 text-[11px] text-slate-400">Highlighted sentences were added to cover the checks you missed.</p>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {m.correction.results.map(r => (
                          <li key={r.check.id} className="flex items-start gap-2 text-xs">
                            {r.passed
                              ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />}
                            <span className="min-w-0 text-slate-600">
                              <span className="font-medium text-slate-800">{r.check.label}</span>
                              {!r.passed && <span> · {r.check.tip}</span>}
                              <span className="ml-1.5 align-middle"><CueBadge cueId={r.check.cueId} tone={r.passed ? 'pass' : 'miss'} /></span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {m.turnIndex !== undefined && (
                        <div>
                          <button
                            onClick={() => setOpenModel(openModel === m.id ? null : m.id)}
                            className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openModel === m.id ? 'rotate-180' : ''}`} />
                            {openModel === m.id ? 'Hide a strong reply' : 'See a strong reply'}
                          </button>
                          {openModel === m.id && (
                            <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-[13px] leading-6 text-slate-700">
                              {fillName(lesson.turns[m.turnIndex].model, repFirst)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input area */}
          <footer className="border-t border-slate-200 p-4">
            {phase === 'corrected' && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Review the correction, then continue the conversation.</p>
                <button onClick={next} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {phase === 'done' && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">The conversation has ended.</p>
                <button onClick={() => onFinish({ corrections })} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700">
                  See results <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {(phase === 'buyer' || phase === 'your-turn' || phase === 'listening') && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    {phase === 'listening' ? <><Waveform active tone="blue" /> <span className="font-medium text-blue-700">Listening… (demo speech-to-text)</span></> : 'Your reply'}
                  </span>
                  <span className="tabular-nums">{draft.trim() ? draft.trim().split(/\s+/).length : 0} words</span>
                </div>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (phase === 'your-turn') submit(draft); } }}
                  readOnly={phase !== 'your-turn'}
                  rows={3}
                  placeholder={phase === 'buyer' ? 'Daniel is speaking…' : 'Type your reply, or press Speak to try the demo voice input.'}
                  className="w-full resize-none rounded-md border border-slate-300 p-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={speak}
                    disabled={phase !== 'your-turn'}
                    className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Mic className="h-3.5 w-3.5" /> Speak (demo)
                  </button>
                  <button
                    onClick={() => submit(draft)}
                    disabled={phase !== 'your-turn' || !draft.trim()}
                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </div>
            )}
          </footer>
        </section>

        {/* Coaching rail */}
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Live checks</h3>
            <p className="mt-1 text-xs text-slate-400">Update as you type or speak.</p>
            <ul className="mt-3 space-y-2.5">
              {liveResults.map(r => (
                <li key={r.check.id} className="flex items-start gap-2 text-[13px]">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${r.passed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>
                    <span className={r.passed ? 'text-slate-900' : 'text-slate-600'}>{r.check.label}</span>
                    <span className="mt-0.5 block"><CueBadge cueId={r.check.cueId} tone={r.passed ? 'pass' : 'neutral'} /></span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cues in this lesson</h3>
            <ul className="mt-3 space-y-3">
              {lesson.cueIds.map(id => {
                const r = running[id];
                const pct = r && r.total ? (r.passed / r.total) * 100 : 0;
                return (
                  <li key={id}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-700">{cueName(id)}</span>
                      <span className="shrink-0 tabular-nums text-slate-400">{r && r.total ? `${r.passed}/${r.total}` : '—'}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};
