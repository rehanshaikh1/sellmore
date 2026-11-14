import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAccess } from '../../store/useAccess';
import {
  ArrowLeft,
  Headphones,
  Lock,
  Play,
  Search,
  Clock,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Download,
  Archive,
  Check,
  Mic,
  PhoneCall,
  Volume2,
  User,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  Share2,
  MoreVertical,
  X,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users
} from 'lucide-react';
import { MockMeetingHistoryItem } from '../../types';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';
import confetti from 'canvas-confetti';

const EMPTY_MOCK_MEETING: MockMeetingHistoryItem = {
  id: '',
  startedAt: '-',
  duration: '-',
  representativeName: '-',
  buyerName: 'No mock meeting selected',
  buyerRole: '',
  roleplayType: '',
  domain: '',
  score: 0,
  summary: '',
  talkListenRatio: '-',
  fillerWordsPerMin: 0,
  talkSpeedWpm: 0,
  longestMonologue: '-',
  whatWentWell: [],
  pointsToImprove: []
};

export const MockMeetingsPage: React.FC = () => {
  const {
    currentPlan,
    mockMeetings: allMockMeetings,
    addMockMeetingRecord,
    rescoreMockMeeting,
    currentUser
  } = useStore();

  const { scope } = useAccess();
  // Practice history follows the owning rep: rep = own, manager = assigned reps, admin = all.
  const mockMeetings = scope(allMockMeetings, m => m.representativeId);
  const isFree = currentPlan === 'free';
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // List page: /mock-meetings. Detail page: /mock-meetings/:mockId
  const { mockId } = useParams<{ mockId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = location.pathname.split('/mock-meetings')[0] + '/mock-meetings';

  // Tabs: History (list), Active Simulation, Result Detail, Configure
  const [activeTab, setActiveTab] = useState<'history' | 'simulate' | 'result' | 'configure'>(mockId ? 'result' : 'history');
  const [, setSelectedMock] = useState<MockMeetingHistoryItem | undefined>(undefined);
  const routedMock = mockId ? mockMeetings.find(m => m.id === mockId) : undefined;
  const selectedMock: MockMeetingHistoryItem = routedMock || EMPTY_MOCK_MEETING;

  // Keep the visible tab in sync with the URL
  useEffect(() => {
    if (mockId) setActiveTab('result');
    else setActiveTab(prev => (prev === 'result' ? 'history' : prev));
  }, [mockId]);

  // Sub-tabs on Result screen (Feedback, Analytics, Leaderboard, Objections - Competitor Pages 31-34)
  const [resultSubTab, setResultSubTab] = useState<'feedback' | 'analytics' | 'leaderboard' | 'objections'>('feedback');
  const [analyticsCategory, setAnalyticsCategory] = useState<'delivery' | 'word_choice' | 'listening'>('delivery');

  // Scorecard item accordion state for "Why were you scored this way?" (Competitor Page 31-32)
  const [expandedScoreItem, setExpandedScoreItem] = useState<string | null>('opener_permission');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [audioPlayingPause, setAudioPlayingPause] = useState<string | null>(null);

  // Roleplay setup state
  const [domain, setDomain] = useState('Aerospace CNC Machining');
  const [roleplayType, setRoleplayType] = useState('Cold Call');
  const [buyerPersona, setBuyerPersona] = useState('VP of Engineering at CodePilot');
  const [buyerName, setBuyerName] = useState('Michael Thompson');

  const [conversationLine, setConversationLine] = useState(0);
  const [conversationPlaying, setConversationPlaying] = useState(false);

  const demoConversation = [
    { speaker: 'buyer', text: `Hello, this is ${buyerName}. Who am I speaking with today?` },
    { speaker: 'rep', text: `Hi Michael, this is ${currentUser.name} from Apex Precision. Thanks for taking my call. Do you have 30 seconds for me to explain why I reached out?` },
    { speaker: 'buyer', text: `I have a minute. What is this regarding? We already work with a couple of machining suppliers.` },
    { speaker: 'rep', text: `Absolutely, and I am not suggesting you replace a supplier. We help aerospace engineering teams reduce 5-axis titanium machining bottlenecks when capacity or tight tolerances become difficult to manage.` },
    { speaker: 'buyer', text: `That is interesting, but delivery reliability has been a problem for us. How would you make sure your team can meet our production schedule?` },
    { speaker: 'rep', text: `That is a fair concern. Before I explain our process, could I ask where delays usually happen for your team: machining capacity, material availability, or quality approval?` },
    { speaker: 'buyer', text: `Mostly machining capacity and quality approval. We cannot afford parts failing inspection or arriving late.` },
    { speaker: 'rep', text: `Understood. We can review the drawings, tolerance requirements and expected volumes with your engineering team, then confirm capacity and inspection checkpoints before quoting. Would a short technical review next week make sense?` },
    { speaker: 'buyer', text: `Yes, send me the information you need and a couple of available times. I can bring our manufacturing lead into that discussion.` },
    { speaker: 'rep', text: `Perfect. I will send a short checklist and two time options. Thanks, Michael. I appreciate your time.` }
  ];

  // Simulation in-flight state
  const [simDuration, setSimDuration] = useState(6);
  const [simRunning, setSimRunning] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Preview only for now. Live voice interaction will be connected later.
  const handleStartSimulation = () => {
    setConversationLine(0);
    setConversationPlaying(true);
    setActiveTab('simulate');
  };

  useEffect(() => {
    if (activeTab !== 'simulate' || !conversationPlaying) return;

    const currentLine = demoConversation[conversationLine];
    if (!currentLine) return;

    const duration = Math.max(2600, Math.min(6500, currentLine.text.length * 34));
    const timer = window.setTimeout(() => {
      if (conversationLine >= demoConversation.length - 1) {
        // Keep the final dialogue visible, then automatically open the result screen.
        handleFinishSimulation();
      } else {
        setConversationLine(line => line + 1);
      }
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeTab, conversationPlaying, conversationLine, demoConversation.length]);


  const handleFinishSimulation = () => {
    clearInterval((window as any).__simTimer);
    setSimRunning(false);

    const newMock: MockMeetingHistoryItem = {
      id: `mock_${Date.now()}`,
      startedAt: 'Just now',
      duration: `${Math.floor(simDuration / 60)}m ${simDuration % 60}s`,
      representativeId: currentUser.id,
      representativeName: currentUser.name,
      buyerName,
      buyerRole: buyerPersona,
      roleplayType,
      domain,
      score: 78,
      summary: `AI Roleplay completed with ${buyerName} (${buyerPersona}). Rep introduced 5-axis capability, but missed the permission-based opening window.`,
      talkListenRatio: '42% / 58%',
      fillerWordsPerMin: 1.2,
      talkSpeedWpm: 138,
      longestMonologue: '0m 45s',
      whatWentWell: ['Smooth pacing during initial greeting.', 'Clear explanation of 5-axis tolerances.'],
      pointsToImprove: ['Address dedicated fixture surcharge before customer brings it up.'],
      rescoreStatus: 'idle'
    };

    addMockMeetingRecord(newMock);
    navigate(`${listPath}/${newMock.id}`);
    try { confetti({ particleCount: 50, spread: 60 }); } catch (e) { }
  };

  const handleRescore = () => {
    rescoreMockMeeting(selectedMock.id);
    try { confetti({ particleCount: 70, spread: 70 }); } catch (e) { }
  };

  const playPauseClip = (id: string) => {
    setAudioPlayingPause(id);
    setTimeout(() => setAudioPlayingPause(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Sales Roleplays & Mock Meetings</h1>
          </div>

        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'history' && (
            <button
              onClick={() => setActiveTab('configure')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start New Roleplay
            </button>
          )}
        </div>
      </div>

      {/* Free Plan Lock Notice */}
      {isFree && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">AI Mock Meetings & Live Simulation Locked</h3>
              <p className="text-amber-700 mt-0.5">
                The Free Plan includes read-only evaluation. Upgrade to Growth or Enterprise to unlock real-time voice roleplays and speech analytics.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {mockId && (
        <Link
          to={listPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Meetings
        </Link>
      )}

      {/* Tab: Roleplay History (Competitor Page 30) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Buyer Persona</th>
                  <th className="py-3 px-4">Call Type</th>
                  <th className="py-3 px-4">Score / 100</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {mockMeetings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center font-sans text-slate-400">
                      No mock meetings yet. Start a new roleplay or load sample data.
                    </td>
                  </tr>
                )}
                {mockMeetings.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`${listPath}/${m.id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{m.startedAt}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{m.duration}</td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap">
                      {m.representativeName}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-800 whitespace-nowrap">
                      {m.buyerName}
                      <span className="block text-[10px] text-slate-400 font-normal">{m.buyerRole}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 whitespace-nowrap">
                      <div>{m.roleplayType}</div>
                      <span className="text-[10px] text-slate-400">{m.domain}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 tabular-nums">
                      <span className={`px-2 py-0.5 rounded ${m.score >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                        {m.score}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`${listPath}/${m.id}`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold rounded text-[11px] transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Auto-playing Mock Meeting Preview */}
      {activeTab === 'simulate' && (
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[26px] border border-slate-800 bg-[#030817] p-5 text-white shadow-2xl sm:p-8 lg:p-10">
          <style>{`
            @keyframes mockWave {
              0%, 100% { transform: scaleY(.28); opacity: .55; }
              50% { transform: scaleY(1); opacity: 1; }
            }
            @keyframes mockPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,.0); }
              50% { box-shadow: 0 0 0 7px rgba(99,102,241,.12); }
            }
          `}</style>

          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-100">Mock Meeting Preview</div>
              <p className="mt-1 text-xs text-slate-400">A sample sales conversation between the representative and an AI buyer persona</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-700 bg-emerald-950/60 px-3 py-1.5 font-mono text-[10px] tracking-wider text-emerald-400">
              <span className={`h-2 w-2 rounded-full ${conversationPlaying ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
              {conversationPlaying ? 'DEMO IN PROGRESS' : 'DEMO PAUSED'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Buyer participant */}
            <div className={`relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all duration-500 ${demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying ? 'border-indigo-400/70 bg-[#111a31] shadow-[0_0_35px_rgba(99,102,241,.12)]' : 'border-slate-800 bg-[#0d1528]'}`}>
              {demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying && <span className="absolute right-4 top-4 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300">Speaking</span>}
              <div className="mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-indigo-400/70 bg-indigo-950 shadow-lg" style={demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying ? { animation: 'mockPulse 1.5s infinite' } : undefined}>
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=85" alt={buyerName} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <h3 className="text-lg font-bold">{buyerName}</h3>
              <p className="mt-1 text-sm text-slate-400">{buyerPersona}</p>
              <span className="mt-3 rounded bg-slate-800 px-2.5 py-1 font-mono text-[10px] text-slate-300">AI BUYER · {roleplayType.toUpperCase()}</span>
              <div className="mt-6 flex h-8 items-center justify-center gap-1.5">
                {[8, 17, 25, 13, 30, 18, 10, 22, 14, 27, 9].map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-indigo-400" style={{ height: `${h}px`, transform: 'scaleY(.35)', animation: demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying ? `mockWave ${.55 + (i % 4) * .13}s ease-in-out ${i * .06}s infinite` : 'none', opacity: demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying ? 1 : .35 }} />
                ))}
              </div>
              <span className="mt-1 text-[10px] text-slate-500">{demoConversation[conversationLine]?.speaker === 'buyer' && conversationPlaying ? 'Buyer is talking...' : 'Buyer'}</span>
            </div>

            {/* Sales representative participant */}
            <div className={`relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all duration-500 ${demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying ? 'border-blue-400/70 bg-[#111a31] shadow-[0_0_35px_rgba(59,130,246,.12)]' : 'border-slate-800 bg-[#0d1528]'}`}>
              {demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying && <span className="absolute right-4 top-4 rounded-full bg-blue-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-300">Speaking</span>}
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border-2 border-blue-500/60 bg-blue-950 text-3xl font-bold text-blue-300" style={demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying ? { animation: 'mockPulse 1.5s infinite' } : undefined}>
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold">{currentUser.name} (You)</h3>
              <p className="mt-1 text-sm text-slate-400">Sales Representative</p>
              <span className="mt-3 rounded border border-blue-900 bg-blue-950/70 px-2.5 py-1 font-mono text-[10px] text-blue-300">SALES REP</span>
              <div className="mt-6 flex h-8 items-center justify-center gap-1.5">
                {[8, 17, 25, 13, 30, 18, 10, 22, 14, 27, 9].map((h, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-emerald-400" style={{ height: `${h}px`, transform: 'scaleY(.35)', animation: demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying ? `mockWave ${.55 + (i % 4) * .13}s ease-in-out ${i * .06}s infinite` : 'none', opacity: demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying ? 1 : .35 }} />
                ))}
              </div>
              <span className="mt-1 text-[10px] text-slate-500">{demoConversation[conversationLine]?.speaker === 'rep' && conversationPlaying ? 'Representative is talking...' : 'Sales representative'}</span>
            </div>
          </div>

          {/* Automatically changing conversation transcript */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0d1528] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Live conversation transcript</p>
                <p className="mt-1 text-[11px] text-slate-500">Dialogue advances automatically to demonstrate the roleplay flow</p>
              </div>
              <span className="whitespace-nowrap font-mono text-xs text-blue-300">{conversationLine + 1} / {demoConversation.length}</span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500" style={{ width: `${((conversationLine + 1) / demoConversation.length) * 100}%` }} />
            </div>
            <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
              {demoConversation.slice(0, conversationLine + 1).map((line, index) => (
                <div key={index} className={`flex ${line.speaker === 'rep' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[88%] rounded-xl border px-4 py-3 ${line.speaker === 'rep' ? 'border-blue-800/70 bg-blue-950/60' : 'border-slate-700 bg-slate-900'}`}>
                    <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${line.speaker === 'rep' ? 'text-blue-300' : 'text-indigo-300'}`}>{line.speaker === 'rep' ? `${currentUser.name} · Sales Rep` : `${buyerName} · AI Buyer`}</div>
                    <p className="text-xs leading-6 text-slate-200">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {conversationPlaying && (
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: `${i * .15}s` }} />)}</span>
                {demoConversation[conversationLine]?.speaker === 'buyer' ? `${buyerName} is speaking` : `${currentUser.name} is responding`}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-2xl font-bold text-blue-400">{conversationPlaying ? 'Roleplay in progress' : 'Preview completed'}</div>
              <p className="mt-1 text-[11px] text-slate-500">Scripted demonstration · No live microphone or recording</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setConversationLine(0); setConversationPlaying(true); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">
                <RefreshCw className="h-4 w-4" /> Replay Demo
              </button>
              <button onClick={handleFinishSimulation} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-700">
                <BarChart3 className="h-4 w-4" /> View Results
              </button>
              <button onClick={() => { setConversationPlaying(false); setActiveTab('configure'); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-700">
                <SlidersHorizontal className="h-4 w-4" /> Back to Mock Setup
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] leading-5 text-slate-500">This is an automated scripted preview of the intended two-way roleplay experience. The live version will connect speech generation, microphone input, real-time buyer responses, transcription and AI scoring.</p>
        </div>
      )}

      {/* Tab: Configure & Launch */}
      {activeTab === 'configure' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-5 text-xs">
          <div>
            <button
              onClick={() => setActiveTab('history')}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Meetings
            </button>
            <h2 className="text-base font-bold text-slate-900">Configure AI Mock Roleplay</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select industry domain, call scenario type, and buyer persona difficulty. (PRD Section 10.11)
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry Domain</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
              >
                <option value="Aerospace CNC Machining">Aerospace CNC Machining (5-Axis Titanium GD&T)</option>
                <option value="Medical Robotics Devices">Medical Robotics Devices (Swiss Turning & Cleanroom)</option>
                <option value="Automotive EV Powertrain">Automotive EV Powertrain (Extrusions & LME Index)</option>
                <option value="Naval Bronze Machining">Naval Bronze Defense Machining (Subsea Mil-Spec)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Roleplay Call Type</label>
              <select
                value={roleplayType}
                onChange={e => setRoleplayType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
              >
                <option value="Cold Call">Cold Call (Permission-based opener drill)</option>
                <option value="Warm Commercial Negotiation">Warm Commercial Negotiation (Surcharges & Split Delivery)</option>
                <option value="Competitor Pushback Defense">Competitor Pushback Defense (Defeating Vanguard Precision)</option>
                <option value="Final PO Authorization Close">Final PO Authorization Close (Locking Machine Slots)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Buyer Persona</label>
              <select
                value={buyerPersona}
                onChange={e => setBuyerPersona(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
              >
                <option value="VP of Engineering at CodePilot">Michael Thompson (VP of Engineering at CodePilot - High Standards)</option>
                <option value="VP of Procurement (Skeptical on Surcharges)">Sarah Jenkins (VP of Procurement - Capex sensitive)</option>
                <option value="Chief Airframe Engineer (Strict on GD&T)">Dr. Thomas Wright (Chief Airframe Engineer - Precision focus)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">AI Buyer Display Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setActiveTab('history')}
                className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSimulation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Mock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Full Roleplay Result Inspection (Exact Competitor Layout from Pages 31-35, 42-47) */}
      {activeTab === 'result' && mockId && !routedMock && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
          Mock meeting not found. It may not be loaded yet.
        </div>
      )}

      {activeTab === 'result' && routedMock && (
        <div className="space-y-6">
          {/* Top Bar with Breadcrumb and Actions (Competitor Page 31, 35) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <Link to={listPath} className="hover:text-blue-600 hover:underline">Mock Meetings</Link>
                  <span>&gt;</span>
                  <span className="font-bold text-slate-800">AI Roleplay Results</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-bold text-slate-900 text-lg">
                    {selectedMock.buyerName}
                  </span>
                  <span className="text-slate-400 text-xs">·</span>
                  <span className="text-xs text-slate-500">{selectedMock.buyerRole}</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {selectedMock.roleplayType}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Share, Start New Roleplay, Rescore, More Menu */}
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Roleplay URL copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>

                <button
                  onClick={handleRescore}
                  disabled={selectedMock.rescoreStatus === 'processing'}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${selectedMock.rescoreStatus === 'processing' ? 'animate-spin' : ''}`} />
                  {selectedMock.rescoreStatus === 'processing' ? 'Rescoring...' : 'Rescore'}
                </button>

                <button
                  onClick={() => setActiveTab('configure')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start New Roleplay
                </button>

                {/* 3-Dots Menu (Competitor Page 35) */}
                <div className="relative">
                  <button
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-xs">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => {
                          handleRescore();
                          setMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Rescore
                      </button>
                      <button
                        onClick={() => {
                          alert('Session archived.');
                          setMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-rose-600 font-semibold"
                      >
                        Archive call
                      </button>
                      <button
                        onClick={() => {
                          alert('Audio recording download started.');
                          setMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Download recording
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMock.summary);
                          setMoreMenuOpen(false);
                          alert('Transcript copied!');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Copy transcript
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMock.summary);
                          setMoreMenuOpen(false);
                          alert('Summary copied!');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Copy summary
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Pill and Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-blue-600 tabular-nums">
                  Score: {selectedMock.score}/100
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-mono">Date: {selectedMock.startedAt}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-mono">Duration: {selectedMock.duration}</span>
              </div>
            </div>
          </div>

          {/* 4 Sub-Tabs: Feedback | Analytics | Leaderboard | Objections (Competitor Page 31, 33, 34) */}
          <div className="flex gap-2 border-b border-slate-200 text-xs font-semibold pb-1">
            {[
              { key: 'feedback', label: 'Feedback' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'leaderboard', label: 'Leaderboard' },
              { key: 'objections', label: 'Objections' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setResultSubTab(tab.key as any)}
                className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 font-medium ${resultSubTab === tab.key
                  ? 'border-blue-600 text-blue-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-Tab 1: FEEDBACK (With Scorecard Accordion & Deep Explanations, Competitor Page 31-32) */}
          {resultSubTab === 'feedback' && (
            <div className="space-y-6">
              {/* Summary and What Went Well / What to Improve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What Went Well
                  </span>
                  <ul className="space-y-1.5 text-slate-700 pt-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Prospect remained open:</strong> Despite an abrupt opener, the buyer stayed on the line and asked why you were reaching out.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Call connected:</strong> The rep successfully initiated engagement with a real verified decision maker.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> What to Improve
                  </span>
                  <ul className="space-y-1.5 text-slate-700 pt-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span><strong>No introduction or opener:</strong> The rep never stated their name or company, leaving the prospect confused at 0:06.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span><strong>Minimal engagement:</strong> Talk ratio was lopsided without framing value or asking permission for a 30s briefing.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Scorecard Option (Exact Competitor Layout from Pages 31-32) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Scorecard Breakdown</h3>
                    <p className="text-slate-500 text-xs">
                      Click any criterion card to inspect why you received that score and what to do differently next time.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500">5 Categories Evaluated</span>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Category 1: Opener */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                      <span>Opener</span>
                      <span className="font-mono text-rose-600">0 / 2</span>
                    </div>

                    <div
                      onClick={() => setExpandedScoreItem(expandedScoreItem === 'opener_permission' ? null : 'opener_permission')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${expandedScoreItem === 'opener_permission' ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">✕</span>
                        <span className="font-medium">Permission based opener?</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <span>0 / 1</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div
                      onClick={() => setExpandedScoreItem(expandedScoreItem === 'opener_research' ? null : 'opener_research')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${expandedScoreItem === 'opener_research' ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">✕</span>
                        <span className="font-medium">Used research on prospect?</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <span>0 / 1</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Discovery */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                      <span>Discovery</span>
                      <span className="font-mono text-rose-600">0 / 1</span>
                    </div>

                    <div
                      onClick={() => setExpandedScoreItem(expandedScoreItem === 'disc_preconceptions' ? null : 'disc_preconceptions')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${expandedScoreItem === 'disc_preconceptions' ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">✕</span>
                        <span className="font-medium">SDR asked for preconceptions of product?</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <span>0 / 1</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Social Proof */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                      <span>Social Proof</span>
                      <span className="font-mono text-rose-600">0 / 2</span>
                    </div>

                    <div
                      onClick={() => setExpandedScoreItem(expandedScoreItem === 'proof_provided' ? null : 'proof_provided')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${expandedScoreItem === 'proof_provided' ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">✕</span>
                        <span className="font-medium">Provided social proof?</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <span>0 / 1</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Closing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                      <span>Closing</span>
                      <span className="font-mono text-rose-600">0 / 2</span>
                    </div>

                    <div
                      onClick={() => setExpandedScoreItem(expandedScoreItem === 'closing_steps' ? null : 'closing_steps')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${expandedScoreItem === 'closing_steps' ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">✕</span>
                        <span className="font-medium">Next steps agreed upon?</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <span>0 / 1</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deep Scorecard Reason Card (Competitor Page 32) */}
                {expandedScoreItem === 'opener_permission' && (
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-xl border border-indigo-200 text-xs space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-sm text-slate-900">Why were you scored this way?</h4>
                    </div>

                    <p className="text-slate-600 leading-relaxed">
                      A permission-based opener involves the rep introducing themselves, briefly stating the purpose of the call, and then asking the prospect for a short amount of time to explain further. Here is how the call actually unfolded:
                    </p>

                    <div className="space-y-2 pl-2">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span className="text-slate-700">
                          <strong>No introduction:</strong> The rep never stated their name or the company they represent. The prospect had to ask <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1 rounded">(0:06)</span> "Yes. Hello. This is David. Why are you calling me?" — showing the rep gave no context.
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span className="text-slate-700">
                          <strong>No purpose stated:</strong> Instead of explaining why they were calling, the rep said at <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1 rounded">(0:10)</span> "I need to check your services." This is vague and confusing, not a clear reason for the call.
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span className="text-slate-700">
                          <strong>No time request:</strong> The rep never asked for even 30 seconds or a minute of the prospect's time to explain the purpose of the call.
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-indigo-100 space-y-2">
                      <h5 className="font-bold text-slate-900">What could you do differently next time?</h5>
                      <p className="text-slate-600 leading-relaxed">
                        To use a permission-based opener, the rep should have started the call with a clear introduction, a concise reason for calling, and a polite request for a brief moment of the prospect's time:
                      </p>
                      <div className="p-3 bg-white rounded-lg border border-indigo-200 text-slate-800 space-y-1 font-mono text-[11px]">
                        <div>&bull; <strong>Introduce yourself:</strong> "Hi David, this is Marcus from Apex Precision."</div>
                        <div>&bull; <strong>State the purpose:</strong> "Reason for my call is we help aerospace engineering teams eliminate 5-axis titanium machining backlogs."</div>
                        <div>&bull; <strong>Ask for permission:</strong> "Do you have 30 seconds for me to share why I thought this might be relevant?"</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: ANALYTICS (Pacing Gauge, Pauses, Filler Words, Delivery - Competitor Page 32-33, 42-47) */}
          {resultSubTab === 'analytics' && (
            <div className="space-y-6">
              {/* 4 Top Metric Cards (Talk/Listen Ratio, Filler Words, Talk Speed, Longest Monologue) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 block text-[11px]">Talk / Listen Ratio</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {selectedMock.talkListenRatio}
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-1">● Below average</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 block text-[11px]">Filler Words</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {selectedMock.fillerWordsPerMin} wpm
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">● Good</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 block text-[11px]">Talk Speed</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {selectedMock.talkSpeedWpm} wpm
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-1">● Conversational pace</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-slate-500 block text-[11px]">Longest Monologue</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {selectedMock.longestMonologue}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">● Healthy duration</span>
                </div>
              </div>

              {/* Category Subtabs: Delivery | Word Choice | Listening (Competitor Page 43-47) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 text-xs">
                <div className="flex gap-4 border-b border-slate-200 pb-2 text-xs font-semibold">
                  {[
                    { key: 'delivery', label: 'Delivery' },
                    { key: 'word_choice', label: 'Word Choice' },
                    { key: 'listening', label: 'Listening' }
                  ].map(c => (
                    <button
                      key={c.key}
                      onClick={() => setAnalyticsCategory(c.key as any)}
                      className={`pb-1 transition-colors ${analyticsCategory === c.key
                        ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Delivery: Pacing semi-gauge, Pacing Variation chart, Pauses audio (Competitor Page 45-47) */}
                {analyticsCategory === 'delivery' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pacing Gauge */}
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Pacing</span>
                          <span className="font-mono font-bold text-blue-600 text-sm">124 words/minute</span>
                        </div>
                        <p className="text-slate-500 text-xs">Your pace sounded relaxed and conversational.</p>

                        {/* Gauge Arc Graphic */}
                        <div className="relative w-48 h-24 mx-auto mt-2">
                          <div className="w-48 h-24 rounded-t-full border-8 border-slate-200 border-b-0 relative overflow-hidden">
                            <div className="w-full h-full bg-blue-600/20 rounded-t-full" />
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                            <span className="font-mono font-extrabold text-2xl text-slate-900">124</span>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Conversational</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-4">
                          <span>Slow</span>
                          <span>Fast</span>
                        </div>
                      </div>

                      {/* Pauses Analysis (Competitor Page 47) */}
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Pauses Analysis</span>
                          <span className="text-[11px] text-slate-500 font-mono">1–2s Target</span>
                        </div>
                        <p className="text-slate-500 text-xs">
                          We recommend pausing 1–2 seconds between key points so the buyer digests what you're saying.
                        </p>

                        <div className="space-y-2 pt-1">
                          {[
                            { id: 'p1', time: '1.1s', text: 'and ... I\'m' },
                            { id: 'p2', time: '1.04s', text: 'and ... 5-axis' },
                            { id: 'p3', time: '0.88s', text: 'to ... set schedule' },
                            { id: 'p4', time: '0.72s', text: 'like ... titanium specs' }
                          ].map(pause => (
                            <div
                              key={pause.id}
                              onClick={() => playPauseClip(pause.id)}
                              className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:border-blue-400 cursor-pointer transition-colors"
                            >
                              <span className="font-mono text-slate-700">
                                <strong className="text-blue-600">{pause.time}</strong> pause: "{pause.text}"
                              </span>
                              <button className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                {audioPlayingPause === pause.id ? 'Playing...' : 'Play Clip'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Speech Tone & Pronunciation (Competitor Page 39-41) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-800 block">Detected Speech Tone:</span>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                            Clear
                          </span>
                          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                            Steady
                          </span>
                          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                            Consultative
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-800 block">Pronunciation & Articulation:</span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          When pronouncing /t/ and /d/ sounds in words like "tolerance", "titanium", and "detail", place the tip of the tongue directly against the alveolar ridge for crisper acoustic clarity.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Word Choice: Weak words, conciseness, filler words (Competitor Page 43) */}
                {analyticsCategory === 'word_choice' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Weak Words</span>
                        <span className="font-mono font-bold text-emerald-600 text-lg">0%</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Conciseness</span>
                        <span className="font-mono font-bold text-slate-900 text-lg">24% Excess</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Filler Words</span>
                        <span className="font-mono font-bold text-slate-900 text-lg">4 fillers (3%)</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Sentence Starters</span>
                        <span className="font-mono font-bold text-slate-900 text-lg">"Basically" 28%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Listening: Talk time, Monologues, Questions (Competitor Page 44) */}
                {analyticsCategory === 'listening' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Total Talk Time</span>
                        <span className="font-mono font-bold text-slate-900 text-lg">0:38</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Monologues</span>
                        <span className="font-mono font-bold text-emerald-600 text-lg">0</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Questions Asked</span>
                        <span className="font-mono font-bold text-amber-600 text-lg">1</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: LEADERBOARD (Competitor Page 33) */}
          {resultSubTab === 'leaderboard' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Team Sales Roleplay Leaderboard</h3>
                <p className="text-slate-500 text-xs">
                  Benchmarked scoring across all reps in the workspace.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Elena Rostova', calls: 14, score: 92, status: 'Top Performer' },
                  { rank: 2, name: 'Marcus Vance (You)', calls: 11, score: 84, status: 'Strong Fluency' },
                  { rank: 3, name: 'Jamie Rivera', calls: 8, score: 76, status: 'Improving' }
                ].map(r => (
                  <div key={r.rank} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 font-bold font-mono text-slate-800 flex items-center justify-center text-xs">
                        #{r.rank}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{r.name}</span>
                        <span className="text-slate-400 text-[11px] block">{r.calls} completed roleplays</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-blue-600 text-base">{r.score}/100</span>
                      <span className="block text-[10px] text-slate-500">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 4: OBJECTIONS (Competitor Page 34) */}
          {resultSubTab === 'objections' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Buyer Objections and Rep Responses</h3>
                <p className="text-slate-500 text-xs">
                  Side-by-side analysis of buyer objections raised and how you navigated them. (PRD Section 10.11)
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Timestamp 0:13
                    </span>
                    <span className="text-rose-600 font-bold text-[11px]">Objection Not Successfully Handled</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Buyer (Michael Thompson):</span>
                      <p className="text-slate-800 italic mt-0.5 font-mono">
                        "I'm not sure what you mean by that. I don't provide engineering services directly... Why are you reaching out to me?"
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Rep Response:</span>
                      <p className="text-slate-800 italic mt-0.5 font-mono">
                        "Well, that's not really what we do... We don't offer generic design services. If that's what you're after, you're probably calling the wrong shop."
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 text-xs">
                    <span className="font-bold block">AI Coaching Advice:</span>
                    Do not get defensive or tell the buyer they're calling the wrong place. Instead, clarify your target persona: "Pardon me Michael, I saw your team oversees airframe structures at CodePilot and reached out specifically about eliminating 5-axis titanium bottlenecks."
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="AI Roleplay Simulation Locked"
        featureDescription="Interactive Mock Meetings and AI buyer conversations are available on Growth and Enterprise plans."
      />
    </div>
  );
};
