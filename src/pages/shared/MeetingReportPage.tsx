import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { SalesCue } from '../../types';
import { SOURCE_LABELS } from '../../components/common/SourceBadge';
import { LinkDealControl } from '../../components/common/LinkDealControl';

type TabKey = 'overview' | 'scorecard' | 'cues' | 'objections' | 'transcript' | 'improve';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const toSeconds = (t: string) => {
  const parts = t.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
};

/** '32m 45s' or '1h 5m' -> seconds. */
const durationToSeconds = (d?: string) => {
  if (!d) return 0;
  const h = /(\d+)\s*h/.exec(d)?.[1];
  const m = /(\d+)\s*m/.exec(d)?.[1];
  const s = /(\d+)\s*s/.exec(d)?.[1];
  return Number(h || 0) * 3600 + Number(m || 0) * 60 + Number(s || 0);
};

const formatClock = (total: number) => {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Cue score (0-5) -> rating label and the colours used for its marker. */
const RATINGS = [
  { label: 'Not demonstrated', dot: 'bg-slate-300', bar: 'bg-slate-300' },
  { label: 'Very poor', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  { label: 'Below expectations', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { label: 'Meets expectations', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  { label: 'Strong', dot: 'bg-emerald-500', bar: 'bg-emerald-600' },
  { label: 'Excellent', dot: 'bg-emerald-600', bar: 'bg-emerald-700' }
];
const rating = (score: number) => RATINGS[Math.max(0, Math.min(5, Math.round(score)))];

const scoreBand = (percent: number) =>
  percent >= 80 ? 'Strong' : percent >= 65 ? 'Solid' : percent >= 50 ? 'Needs improvement' : 'At risk';

const highlight = (text: string, query: string) => {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${escaped})`, 'ig')).map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-slate-900">{part}</mark>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

/* ------------------------------------------------------------------ */
/* building blocks                                                     */
/* ------------------------------------------------------------------ */

const Panel: React.FC<{ title?: string; aside?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, aside, className = '', children }) => (
  <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
    {title && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {aside}
      </header>
    )}
    {children}
  </section>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</div>
);

const Rating: React.FC<{ score: number }> = ({ score }) => {
  const r = rating(score);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-600">
      <span className={`h-2 w-2 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  );
};

const ScoreBar: React.FC<{ score: number; className?: string }> = ({ score, className = 'w-28' }) => (
  <div className={`h-1.5 overflow-hidden rounded-full bg-slate-100 ${className}`}>
    <div className={`h-full rounded-full ${rating(score).bar}`} style={{ width: `${(score / 5) * 100}%` }} />
  </div>
);

const Empty: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
    <div className="text-sm font-semibold text-slate-900">{title}</div>
    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>
  </div>
);

const BulletList: React.FC<{ items: string[]; marker: string; empty: string }> = ({ items, marker, empty }) =>
  items.length ? (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span className={`mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full ${marker}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-400">{empty}</p>
  );

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export const MeetingReportPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { meetings, currentRole, crmConnected, retryMeetingAnalysis } = useStore();
  const { canAccess } = useAccess();

  const meeting = meetings.find(m => m.id === meetingId);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [expandedCue, setExpandedCue] = useState<number | null>(null);
  const [cueFilter, setCueFilter] = useState<'all' | 'gaps' | 'meets' | 'strong'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<'all' | 'rep' | 'buyer'>('all');
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  const totalSeconds = durationToSeconds(meeting?.duration);
  const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';

  // Start fresh when a different meeting is opened.
  useEffect(() => {
    setActiveTab('overview');
    setExpandedCue(null);
    setPlayhead(0);
    setIsPlaying(false);
    setTranscriptSearch('');
    setSpeakerFilter('all');
  }, [meetingId]);

  // Preview playback advances the playhead one second at a time.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setPlayhead(current => {
        if (current + 1 >= totalSeconds) {
          setIsPlaying(false);
          return totalSeconds;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, totalSeconds]);

  const cues: SalesCue[] = meeting?.cues || [];
  const objections = meeting?.objections || [];
  const transcript = meeting?.transcript || [];

  const stats = useMemo(() => {
    const strong = cues.filter(c => c.score >= 4).length;
    const gaps = cues.filter(c => c.score <= 2).length;
    return { strong, gaps, meets: cues.length - strong - gaps };
  }, [cues]);

  // Talk share, and the turn that is playing now.
  const transcriptMeta = useMemo(() => {
    const words = { rep: 0, buyer: 0 };
    transcript.forEach(t => {
      words[t.role === 'rep' ? 'rep' : 'buyer'] += t.text.split(/\s+/).filter(Boolean).length;
    });
    const total = words.rep + words.buyer;

    return { words, total, repShare: total ? Math.round((words.rep / total) * 100) : 0 };
  }, [transcript]);

  const currentTurnId = useMemo(() => {
    if (playhead <= 0) return null;
    let id: string | null = null;
    transcript.forEach(t => { if (toSeconds(t.timestamp) <= playhead) id = t.id; });
    return id;
  }, [transcript, playhead]);

  const scrollToTurn = (id: string) => {
    const box = transcriptScrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-turn="${id}"]`);
    if (!box || !el) return;
    box.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  };

  // While the preview plays, keep the current turn in view.
  useEffect(() => {
    if (isPlaying && activeTab === 'transcript' && currentTurnId) scrollToTurn(currentTurnId);
  }, [currentTurnId, isPlaying, activeTab]);

  // Not found, or owned by a rep outside this user's scope: same response either way.
  if (!meeting || !canAccess(meeting.representativeId)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Meeting not found</h1>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted, or it belongs to someone outside your access.</p>
        <Link to={`/${rolePrefix}/meetings`} className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:underline">
          Back to Meeting Library
        </Link>
      </div>
    );
  }

  const isAnalysed = meeting.processingStatus === 'Analysed';
  const percent = meeting.overallScorePercent;
  const transcriptText = transcript.map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n\n');

  const copy = (text: string, done: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    done(true);
    window.setTimeout(() => done(false), 2000);
  };

  const downloadTranscript = () => {
    if (!transcript.length) return;
    const url = URL.createObjectURL(new Blob([transcriptText], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.name.replace(/\s+/g, '_')}_Transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const seek = (seconds: number) => setPlayhead(Math.max(0, Math.min(totalSeconds, seconds)));

  const openCue = (id: number) => {
    setExpandedCue(id);
    setActiveTab('scorecard');
  };

  const filteredTranscript = transcript.filter(t =>
    (speakerFilter === 'all' || (speakerFilter === 'rep') === (t.role === 'rep')) &&
    (t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase()))
  );

  const visibleCues = cues.filter(c =>
    cueFilter === 'all' ? true : cueFilter === 'gaps' ? c.score <= 2 : cueFilter === 'meets' ? c.score === 3 : c.score >= 4
  );

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'scorecard', label: 'Scorecard', count: cues.length || undefined },
    { key: 'cues', label: 'Cue analysis' },
    { key: 'objections', label: 'Objections', count: objections.length || undefined },
    { key: 'transcript', label: 'Transcript' },
    { key: 'improve', label: 'Improvement areas' }
  ];

  const improvePoints = [
    ...(meeting.whereRepStruggled || []).map(text => ({ kind: 'Observed gap', text })),
    ...(meeting.whatCouldBeBetter || []).map(text => ({ kind: 'Opportunity', text }))
  ];

  const sourceLabel = SOURCE_LABELS[meeting.source ?? 'upload'];

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* Navigation row */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/${rolePrefix}/meetings`}
          className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Meeting Library
        </Link>

        {crmConnected && (
          meeting.associatedDealId && meeting.associatedDealName ? (
            <Link
              to={`/${rolePrefix}/deals/${meeting.associatedDealId}`}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:underline"
            >
              <span className="max-w-[18rem] truncate">{meeting.associatedDealName}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <LinkDealControl meeting={meeting} />
          )
        )}
      </div>

      {/* Title block */}
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-slate-500">Call report</span>
          <span className="text-slate-300">/</span>
          <span className={`inline-flex items-center gap-1.5 font-medium ${
            isAnalysed ? 'text-emerald-700' : meeting.processingStatus === 'Processing' ? 'text-sky-700' : 'text-rose-700'
          }`}>
            {meeting.processingStatus === 'Processing'
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <span className={`h-1.5 w-1.5 rounded-full ${isAnalysed ? 'bg-emerald-500' : 'bg-rose-500'}`} />}
            {meeting.processingStatus}
          </span>
        </div>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-slate-900">{meeting.name}</h1>
        <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px] text-slate-600">
          <div className="flex items-center gap-1.5"><dt className="text-slate-400">Representative</dt><dd className="font-medium text-slate-800">{meeting.representativeName}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="text-slate-400">Date</dt><dd className="font-medium text-slate-800">{meeting.uploadDate}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="text-slate-400">Duration</dt><dd className="font-medium text-slate-800">{meeting.duration}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="text-slate-400">Source</dt><dd className="font-medium text-slate-800">{sourceLabel}</dd></div>
          <div className="flex items-center gap-1.5"><dt className="text-slate-400">File</dt><dd className="font-medium text-slate-800">{meeting.fileFormat || 'MP4'}{meeting.fileSize ? `, ${meeting.fileSize}` : ''}</dd></div>
        </dl>
      </header>

      {/* Not analysed */}
      {!isAnalysed && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {meeting.processingStatus === 'Processing'
              ? <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-sky-600" />
              : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {meeting.processingStatus === 'Processing' ? 'Analysis in progress' : 'Analysis failed'}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {meeting.processingStatus === 'Processing'
                  ? 'The score, scorecard, objections and transcript appear here as soon as the analysis finishes.'
                  : 'This recording could not be analysed. You can run the analysis again.'}
              </p>
            </div>
          </div>
          {meeting.processingStatus === 'Failed' && (
            <button
              onClick={() => retryMeetingAnalysis(meeting.id)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry analysis
            </button>
          )}
        </div>
      )}

      {isAnalysed && (
        <>
          {/* KPI strip */}
          <section className="mt-6 grid grid-cols-2 divide-slate-200 rounded-lg border border-slate-200 bg-white md:grid-cols-4 md:divide-x">
            <div className="p-5">
              <FieldLabel>Overall score</FieldLabel>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tabular-nums text-slate-900">{percent ?? '—'}</span>
                {percent !== undefined && <span className="text-sm text-slate-400">/ 100</span>}
              </div>
              {percent !== undefined && (
                <>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{scoreBand(percent)}</div>
                </>
              )}
            </div>
            {[
              { label: 'Strong cues', value: stats.strong, hint: 'Scored 4 or 5' },
              { label: 'Meets expectations', value: stats.meets, hint: 'Scored 3' },
              { label: 'Needs improvement', value: stats.gaps, hint: 'Scored 2 or below' }
            ].map(kpi => (
              <div key={kpi.label} className="border-t border-slate-200 p-5 md:border-t-0">
                <FieldLabel>{kpi.label}</FieldLabel>
                <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{cues.length ? kpi.value : '—'}</div>
                <div className="mt-3 text-xs text-slate-500">{cues.length ? `${kpi.hint} · of ${cues.length}` : 'No cue scores'}</div>
              </div>
            ))}
          </section>

          {/* Recording */}
          <section className="mt-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 py-3">
            <button
              onClick={() => setIsPlaying(p => !p)}
              disabled={!totalSeconds}
              aria-label={isPlaying ? 'Pause recording preview' : 'Play recording preview'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
            </button>
            <span className="w-28 shrink-0 text-[13px] tabular-nums text-slate-600">
              <span className="font-semibold text-slate-900">{formatClock(playhead)}</span> / {formatClock(totalSeconds)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(totalSeconds, 1)}
              value={playhead}
              onChange={e => seek(Number(e.target.value))}
              aria-label="Seek recording"
              className="h-1 flex-1 cursor-pointer accent-slate-800"
            />
            <span className="hidden shrink-0 text-xs text-slate-400 sm:block">Recording</span>
          </section>

          {/* Tabs */}
          <nav className="mt-8 flex gap-7 overflow-x-auto border-b border-slate-200" aria-label="Report sections">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-[13px] font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && <span className="ml-1.5 text-xs font-normal text-slate-400">{tab.count}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-6">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Panel
                    title="Summary"
                    aside={
                      <button
                        onClick={() => meeting.summary && copy(meeting.summary, setCopiedSummary)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
                      >
                        {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedSummary ? 'Copied' : 'Copy'}
                      </button>
                    }
                  >
                    <p className="px-5 py-4 text-sm leading-6 text-slate-700">
                      {meeting.summary || 'No summary was produced for this call.'}
                    </p>
                  </Panel>

                  <Panel title="Key takeaways">
                    <div className="divide-y divide-slate-200">
                      <div className="px-5 py-4">
                        <FieldLabel>What went well</FieldLabel>
                        <div className="mt-3"><BulletList items={meeting.whatWentWell || []} marker="bg-emerald-500" empty="Nothing recorded." /></div>
                      </div>
                      <div className="px-5 py-4">
                        <FieldLabel>Where the rep struggled</FieldLabel>
                        <div className="mt-3"><BulletList items={meeting.whereRepStruggled || []} marker="bg-amber-500" empty="Nothing recorded." /></div>
                      </div>
                      <div className="px-5 py-4">
                        <FieldLabel>Recommended next steps</FieldLabel>
                        <div className="mt-3"><BulletList items={meeting.recommendedNextSteps || []} marker="bg-slate-400" empty="Nothing recorded." /></div>
                      </div>
                    </div>
                  </Panel>
                </div>

                <Panel
                  title="Cue performance"
                  aside={cues.length ? <button onClick={() => setActiveTab('scorecard')} className="text-xs font-medium text-blue-700 hover:underline">View scorecard</button> : undefined}
                  className="h-fit"
                >
                  {cues.length ? (
                    <ul className="divide-y divide-slate-100">
                      {cues.map(cue => (
                        <li key={cue.id}>
                          <button
                            onClick={() => openCue(cue.id)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="min-w-0 flex-1 truncate text-[13px] text-slate-800">{cue.name}</span>
                            <ScoreBar score={cue.score} className="w-10 shrink-0" />
                            <span className="w-8 shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-900">{cue.score}/5</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-5 py-5 text-sm text-slate-400">Cue scores are not available for this recording.</p>
                  )}
                </Panel>
              </div>
            )}

            {/* Scorecard */}
            {activeTab === 'scorecard' && (
              cues.length === 0 ? (
                <Empty title="No cue scores for this recording" text="This call was analysed, but a cue-by-cue scorecard is not available for it." />
              ) : (
                <Panel>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="w-14 py-3 pl-5 font-semibold">No.</th>
                        <th className="py-3 font-semibold">Sales cue</th>
                        <th className="hidden py-3 font-semibold sm:table-cell">Score</th>
                        <th className="hidden py-3 font-semibold md:table-cell">Rating</th>
                        <th className="w-12 py-3 pr-5" />
                      </tr>
                    </thead>
                    <tbody>
                      {cues.map(cue => {
                        const open = expandedCue === cue.id;
                        return (
                          <React.Fragment key={cue.id}>
                            <tr
                              onClick={() => setExpandedCue(open ? null : cue.id)}
                              className={`cursor-pointer border-b border-slate-100 transition-colors ${open ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}
                            >
                              <td className="py-3.5 pl-5 text-[13px] tabular-nums text-slate-400">{String(cue.id).padStart(2, '0')}</td>
                              <td className="py-3.5 pr-4 text-sm font-medium text-slate-900">{cue.name}</td>
                              <td className="hidden py-3.5 pr-6 sm:table-cell">
                                <div className="flex items-center gap-3">
                                  <ScoreBar score={cue.score} className="w-28" />
                                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">{cue.score}/5</span>
                                </div>
                              </td>
                              <td className="hidden py-3.5 pr-4 md:table-cell"><Rating score={cue.score} /></td>
                              <td className="py-3.5 pr-5 text-right">
                                <ChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                              </td>
                            </tr>
                            {open && (
                              <tr className="border-b border-slate-100 bg-slate-50">
                                <td />
                                <td colSpan={4} className="pb-5 pr-5 pt-1">
                                  <p className="mb-4 text-[13px] text-slate-500">{cue.evaluationFocus}</p>
                                  <div className="grid gap-5 md:grid-cols-3">
                                    <div>
                                      <FieldLabel>Evidence from the call</FieldLabel>
                                      <p className="mt-1.5 border-l-2 border-slate-300 pl-3 text-[13px] italic leading-6 text-slate-700">{cue.evidence}</p>
                                    </div>
                                    <div>
                                      <FieldLabel>Observation</FieldLabel>
                                      <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{cue.observation}</p>
                                    </div>
                                    <div>
                                      <FieldLabel>How to improve</FieldLabel>
                                      <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{cue.improvement}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </Panel>
              )
            )}

            {/* Cue analysis */}
            {activeTab === 'cues' && (
              cues.length === 0 ? (
                <Empty title="No cue analysis" text="This recording has no cue-by-cue analysis." />
              ) : (
                <div className="space-y-5">
                  <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[13px]">
                    {([
                      ['all', 'All', cues.length],
                      ['gaps', 'Needs improvement', stats.gaps],
                      ['meets', 'Meets', stats.meets],
                      ['strong', 'Strong', stats.strong]
                    ] as const).map(([key, label, count]) => (
                      <button
                        key={key}
                        onClick={() => setCueFilter(key)}
                        className={`rounded px-3.5 py-1.5 font-medium transition-colors ${
                          cueFilter === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label} <span className={cueFilter === key ? 'text-white/60' : 'text-slate-400'}>{count}</span>
                      </button>
                    ))}
                  </div>

                  {visibleCues.length === 0 ? (
                    <Empty title="No cues in this group" text="Choose another filter to see the remaining cues." />
                  ) : (
                    <Panel>
                      <div className="divide-y divide-slate-200">
                        {visibleCues.map(cue => (
                          <article key={cue.id} className="px-5 py-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                <span className="mr-2 font-normal tabular-nums text-slate-400">{String(cue.id).padStart(2, '0')}</span>
                                {cue.name}
                              </h3>
                              <div className="flex items-center gap-4">
                                <Rating score={cue.score} />
                                <span className="text-sm font-semibold tabular-nums text-slate-900">{cue.score}/5</span>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-5 md:grid-cols-3">
                              <div>
                                <FieldLabel>Spoken excerpt</FieldLabel>
                                <p className="mt-1.5 border-l-2 border-slate-300 pl-3 text-[13px] italic leading-6 text-slate-700">{cue.evidence}</p>
                              </div>
                              <div>
                                <FieldLabel>Observation</FieldLabel>
                                <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{cue.observation}</p>
                              </div>
                              <div>
                                <FieldLabel>How to improve</FieldLabel>
                                <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{cue.improvement}</p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </Panel>
                  )}
                </div>
              )
            )}

            {/* Objections */}
            {activeTab === 'objections' && (
              objections.length === 0 ? (
                <Empty title="No objections raised" text="The buyer did not push back on price, lead time or quality in this conversation." />
              ) : (
                <Panel>
                  <div className="divide-y divide-slate-200">
                    {objections.map((obj, index) => (
                      <article key={obj.id} className="px-5 py-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 text-[13px]">
                            <span className="font-semibold text-slate-900">Objection {index + 1}</span>
                            <button
                              onClick={() => { seek(toSeconds(obj.timestamp)); setActiveTab('transcript'); }}
                              className="tabular-nums text-slate-500 hover:text-blue-700 hover:underline"
                              title="Jump to this moment"
                            >
                              at {obj.timestamp}
                            </button>
                          </div>
                        </div>

                        <dl className="mt-4 space-y-3 text-[13px] leading-6">
                          <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
                            <dt className="font-medium text-slate-500">Buyer said</dt>
                            <dd className="text-slate-800">"{obj.objection}"</dd>
                          </div>
                          <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
                            <dt className="font-medium text-slate-500">Rep replied</dt>
                            <dd className="text-slate-700">"{obj.repResponse}"</dd>
                          </div>
                          <div className="grid gap-1 rounded-md bg-slate-50 px-4 py-3 sm:grid-cols-[134px_1fr] sm:gap-4">
                            <dt className="font-medium text-slate-500">Suggested reply</dt>
                            <dd className="text-slate-800">{obj.strongerResponseSuggestion}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </Panel>
              )
            )}

            {/* Transcript */}
            {activeTab === 'transcript' && (
              transcript.length === 0 ? (
                <Empty title="No transcript for this recording" text="A transcript was not produced for this call." />
              ) : (
                <Panel>
                  {/* Toolbar */}
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search transcript"
                          value={transcriptSearch}
                          onChange={e => setTranscriptSearch(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-[13px] text-slate-900 focus:border-slate-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[13px]" role="group" aria-label="Filter by speaker">
                        {([['all', 'All'], ['rep', 'Rep'], ['buyer', 'Buyer']] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setSpeakerFilter(key)}
                            className={`rounded px-3 py-1.5 font-medium transition-colors ${
                              speakerFilter === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="text-slate-400">{filteredTranscript.length} of {transcript.length} turns</span>
                      <button
                        onClick={() => copy(transcriptText, setCopiedTranscript)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {copiedTranscript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedTranscript ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={downloadTranscript}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                  </div>

                  {/* Talk time */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 bg-slate-50/60 px-5 py-3">
                    <FieldLabel>Talk time</FieldLabel>
                    <div className="flex h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 sm:w-64" aria-hidden="true">
                      <div className="h-full bg-blue-600" style={{ width: `${transcriptMeta.repShare}%` }} />
                    </div>
                    <span className="text-[13px] text-slate-600">
                      <strong className="font-semibold text-slate-900">Rep {transcriptMeta.repShare}%</strong>
                      <span className="mx-2 text-slate-300">|</span>
                      Buyer {100 - transcriptMeta.repShare}%
                      <span className="ml-3 text-xs text-slate-400">{transcriptMeta.total.toLocaleString()} words</span>
                    </span>
                  </div>

                  <div>
                    {/* Turns */}
                    <div ref={transcriptScrollRef} className="relative max-h-[640px] divide-y divide-slate-100 overflow-y-auto">
                      {filteredTranscript.length === 0 ? (
                        <p className="px-5 py-12 text-center text-sm text-slate-400">No lines match your filters.</p>
                      ) : filteredTranscript.map(item => {
                        const isRep = item.role === 'rep';
                        const isCurrent = item.id === currentTurnId;
                        return (
                          <div
                            key={item.id}
                            data-turn={item.id}
                            className={`grid grid-cols-[64px_1fr] gap-4 border-l-2 px-5 py-3.5 transition-colors ${
                              isCurrent ? 'border-blue-600 bg-blue-50/50' : 'border-transparent hover:bg-slate-50/70'
                            }`}
                          >
                            <button
                              onClick={() => seek(toSeconds(item.timestamp))}
                              className={`pt-0.5 text-left text-xs tabular-nums hover:text-blue-700 ${isCurrent ? 'font-semibold text-blue-700' : 'text-slate-400'}`}
                              title="Jump to this moment in the recording"
                            >
                              {item.timestamp}
                            </button>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-slate-900">{item.speaker}</span>
                                <span className={`rounded border px-1.5 text-[10px] font-medium uppercase tracking-wide ${
                                  isRep ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'
                                }`}>
                                  {isRep ? 'Rep' : 'Buyer'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{highlight(item.text, transcriptSearch)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Panel>
              )
            )}

            {/* Improvement areas */}
            {activeTab === 'improve' && (
              <Panel title={`Improvement areas for ${meeting.representativeName}`}>
                {improvePoints.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500">No improvement points were recorded for this call.</p>
                ) : (
                  <ol className="divide-y divide-slate-200">
                    {improvePoints.map((item, i) => (
                      <li key={i} className="flex gap-4 px-5 py-4">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold tabular-nums text-slate-600">
                          {i + 1}
                        </span>
                        <div>
                          <FieldLabel>{item.kind}</FieldLabel>
                          <p className="mt-1 text-sm leading-6 text-slate-800">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {crmConnected && (
                  <div className="border-t border-slate-200 px-5 py-3.5 text-[13px]">
                    {meeting.associatedDealId ? (
                      <Link
                        to={`/${rolePrefix}/deal-coaching?deal=${meeting.associatedDealId}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                      >
                        Open deal coaching for {meeting.associatedDealName}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-slate-500">Link this call to a deal to build deal coaching from it.</span>
                    )}
                  </div>
                )}
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
};
