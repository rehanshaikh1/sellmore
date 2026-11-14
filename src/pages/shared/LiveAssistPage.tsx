import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Radio,
  Lock,
  Play,
  Pause,
  Sparkles,
  Send,
  MessageSquare,
  CheckCircle2,
  Volume2,
  Maximize2,
  Minimize2,
  Share2,
  Clock,
  HelpCircle,
  FileText,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Smile,
  Hand,
  MoreVertical,
  Camera,
  Copy,
  ChevronDown,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PlanUpgradeModal } from '../../components/common/PlanUpgradeModal';

export const LiveAssistPage: React.FC = () => {
  const { currentPlan } = useStore();
  const isFree = currentPlan === 'free';

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sideTab, setSideTab] = useState<'transcript' | 'ask_ai'>('transcript');
  const [bottomTab, setBottomTab] = useState<'transcript' | 'notes'>('transcript');

  // Simulated Google Meet states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<string>(
    "- Dr. Thomas Wright confirmed ±0.005mm concentricity requirement.\n- Sarah Jenkins requested 10 units in 3 weeks via split shipment.\n- Follow-up: Send ISO 9001 quality cert and carbide tooling amortization schedule."
  );

  // Ask AI State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponses, setAiResponses] = useState<{ q: string; a: string; time: string }[]>([
    {
      q: 'What are the key points so far?',
      a: '1. Technical Fit: AeroDynamics requires 5-axis simultaneous milling for Ti-6Al-4V Grade 5 brackets.\n2. Delivery Milestone: Flight integration window requires 10 prototype units in 3 weeks; rep offered weekend split delivery.\n3. Commercial Blocker: Sarah Jenkins is disputing the $8,500 dedicated carbide tooling charge.',
      time: 'Just now'
    }
  ]);

  const liveTranscript = [
    { speaker: 'Dr. Thomas Wright (AeroDynamics)', time: '15:02', text: 'Marcus, our airframe test window opens in exactly 5 weeks. 8 weeks delivery will ground the prototype.' },
    { speaker: 'Marcus Vance (Apex Rep)', time: '15:03', text: 'I understand 8 weeks is tight for your airframe integration. What if we deliver 10 first articles in 3 weeks using an expedited weekend cell, and the remaining 90 in week 7?' },
    { speaker: 'Sarah Jenkins (Procurement)', time: '15:04', text: 'If you can guarantee 10 units in 3 weeks, that keeps our airframe team on schedule. We can live with that split.' },
    { speaker: 'Sarah Jenkins (Procurement)', time: '15:05', text: 'However, looking at the commercial sheet, why is there an $8,500 dedicated carbide tooling surcharge? Vanguard Precision quoted zero tooling fee.' }
  ];

  const handleAskPreset = (presetQuestion: string, presetAnswer: string) => {
    setAiResponses(prev => [
      ...prev,
      {
        q: presetQuestion,
        a: presetAnswer,
        time: 'Just now'
      }
    ]);
    setSideTab('ask_ai');
  };

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const q = aiQuestion.trim();
    setAiQuestion('');
    setAiResponses(prev => [
      ...prev,
      {
        q,
        a: `Live Suggestion: Reframe the custom carbide tooling fee ($8,500) as an amortized $85/part over the 100-piece flight qualification batch to avoid Capex budget hurdles before Thursday's drawing freeze.`,
        time: 'Just now'
      }
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live Assist Chrome Extension Simulator</h1>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono uppercase">
              Tactiq & Fireflies Style
            </span>
          </div>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            {isMinimized ? 'Expand Extension Panel' : 'Minimize Extension Panel'}
          </button>
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
              <h3 className="font-bold text-amber-900">Live Assist & In-Meeting Prompts Locked</h3>
              <p className="text-amber-700 mt-0.5">
                The Chrome extension real-time transcription and objection prompts are available on Growth and Enterprise tiers.
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

      {/* SIMULATED GOOGLE MEET VIEWPORT (Exact Competitor Layout from Pages 57-65) */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {/* Meet Top Bar */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans font-bold text-white">meet.google.com/qnz-pizn-nxj</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>15:05</span>
            <span>·</span>
            <span>3 participants</span>
          </div>
        </div>

        {/* Video Canvas & Extension Split */}
        <div className="relative min-h-[520px] flex flex-col lg:flex-row">
          {/* Main Video Tile (Simulated Call Participant) */}
          <div className="flex-1 bg-gradient-to-br from-amber-950/40 via-stone-900 to-slate-950 flex flex-col items-center justify-center p-8 relative">
            {/* User Circle Avatar (Competitor Page 57, 60) */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center text-5xl font-extrabold shadow-2xl font-mono">
              R
            </div>
            <div className="mt-4 text-center">
              <span className="font-bold text-white text-base">Rehan Shaikh (Client Lead)</span>
              <span className="block text-xs text-slate-400 mt-0.5 font-mono">AeroDynamics UK Airframe Review</span>
            </div>

            {/* Meet Bottom Controls Bar (Competitor Page 57, 62) */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-2.5 z-10 px-4">
              <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-3 text-white text-xs">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-2.5 rounded-full transition-colors ${isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                    }`}
                  title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2.5 rounded-full transition-colors ${isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                    }`}
                  title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`p-2.5 rounded-full transition-colors ${isHandRaised ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  title="Raise Hand"
                >
                  <Hand className="w-4 h-4" />
                </button>

                <button
                  onClick={() => alert('Leaving simulated call.')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-full text-white font-bold flex items-center gap-1.5 transition-colors"
                  title="Leave Call"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT EXTENSION SIDEBAR OVERLAY (Tactiq Style from Pages 57, 59, 60, 64) */}
          {!isMinimized && (
            <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col justify-between text-xs text-white z-20">
              {/* Extension Top Header (Competitor Page 59) */}
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-[11px] text-slate-200">SellMore Live Assist</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">10 free meetings left</span>
                </div>

                {/* Subtabs: Live Transcript | Ask Tactiq AI */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setSideTab('transcript')}
                    className={`flex-1 py-1.5 rounded-md transition-colors text-center ${sideTab === 'transcript' ? 'bg-slate-800 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Live Transcript
                  </button>
                  <button
                    onClick={() => setSideTab('ask_ai')}
                    className={`flex-1 py-1.5 rounded-md transition-colors text-center flex items-center justify-center gap-1 ${sideTab === 'ask_ai' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Sparkles className="w-3 h-3" /> Ask Copilot AI
                  </button>
                </div>

                {/* Language Banner (Competitor Page 59) */}
                <div className="p-2 bg-blue-950/80 rounded-lg border border-blue-800/60 flex items-center justify-between text-[10px] text-blue-200 font-mono">
                  <span>Transcribing: English (United Kingdom)</span>
                  <button className="text-white hover:underline font-sans font-bold">Change</button>
                </div>
              </div>

              {/* Side Tab 1: Live Transcript with Subtabs (Transcript / Notes) */}
              {sideTab === 'transcript' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Content Area */}
                  {bottomTab === 'transcript' ? (
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[380px] font-sans">
                      {liveTranscript.map((t, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="font-bold text-blue-400 font-sans">{t.speaker}</span>
                            <span>{t.time}</span>
                          </div>
                          <p className="text-slate-200 text-xs leading-relaxed">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 space-y-2 flex-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Meeting Notes:</span>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={12}
                        className="w-full h-64 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden font-mono leading-relaxed resize-none"
                      />
                    </div>
                  )}

                  {/* Bottom Subtabs & Tool Buttons (Competitor Page 59) */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] font-semibold">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBottomTab('transcript')}
                          className={`transition-colors ${bottomTab === 'transcript' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
                        >
                          TRANSCRIPT
                        </button>
                        <button
                          onClick={() => setBottomTab('notes')}
                          className={`transition-colors ${bottomTab === 'notes' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
                        >
                          NOTES
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <button
                          onClick={() => alert('Transcript copied to clipboard!')}
                          title="Copy Transcript"
                          className="p-1 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => alert('Screenshot captured!')}
                          title="Take Screenshot"
                          className="p-1 hover:text-white"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Side Tab 2: Ask Tactiq / SellMore AI (Competitor Page 60, 64) */}
              {sideTab === 'ask_ai' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden p-3.5 space-y-3">
                  {/* 4 Auto Suggested Buttons (Competitor Page 64) */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                    <button
                      onClick={() => handleAskPreset(
                        'Suggest Questions',
                        'Ask Dr. Wright: "What is your drawing freeze deadline for the 10-unit prototype split shipment?"'
                      )}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-left transition-colors"
                    >
                      Suggest Questions
                    </button>
                    <button
                      onClick={() => handleAskPreset(
                        'Catch up (Last 1 min)',
                        'Sarah Jenkins questioned the $8,500 dedicated carbide tooling surcharge. She benchmarked against Vanguard Precision\'s zero-tooling quote.'
                      )}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-left transition-colors"
                    >
                      Catch up (Last 1 min)
                    </button>
                    <button
                      onClick={() => handleAskPreset(
                        'Summarize so far',
                        'Agreement reached on 10-unit prototype split delivery in 3 weeks. Outstanding contention is dedicated tooling amortization.'
                      )}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-left transition-colors"
                    >
                      Summarize so far
                    </button>
                    <button
                      onClick={() => handleAskPreset(
                        'Action items',
                        '1. Send titanium mill certs. 2. Propose $85/unit tooling amortization model before Thursday.'
                      )}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-left transition-colors"
                    >
                      Action items
                    </button>
                  </div>

                  {/* AI Responses Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[260px] pr-1">
                    {aiResponses.map((res, i) => (
                      <div key={i} className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-indigo-300 font-mono">
                          <span className="font-bold">{res.q}</span>
                          <span>{res.time}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-sans whitespace-pre-line text-[11px]">
                          {res.a}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Query Input Box (Competitor Page 63, 64) */}
                  <form onSubmit={handleSendQuery} className="pt-2 border-t border-slate-800">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask anything about the meeting..."
                        value={aiQuestion}
                        onChange={e => setAiQuestion(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PlanUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureTitle="Live Assist In-Call Copilot Locked"
        featureDescription="Real-time meeting audio capture and automated objection suggestions are available on Growth and Enterprise plans."
      />
    </div>
  );
};
