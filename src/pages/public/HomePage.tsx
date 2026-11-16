import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { UserRole } from '../../types';
import {
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Video,
  Database,
  GraduationCap,
  Workflow,
  Bot,
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  ChevronRight,
  FileText,
  Lock,
  HelpCircle,
  Headphones,
  Award,
  Radio,
  Star
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, setPlan } = useStore();

  const [activeDemoTab, setActiveDemoTab] = useState<'live' | 'cues' | 'crm' | 'coaching'>('live');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleLaunchRole = (role: UserRole) => {
    switchRole(role);
    if (role === 'client_admin') navigate('/admin/dashboard');
    else if (role === 'manager') navigate('/manager/dashboard');
    else if (role === 'sales_rep') navigate('/sales/dashboard');
    else if (role === 'super_admin') navigate('/platform/dashboard');
  };

  const cuesData = [
    {
      id: 1,
      title: 'Budget Hesitation',
      category: 'Financial Signal',
      cue: 'Detected vocal pauses and reluctance after price quotation',
      action: 'Triggers instant ROI justification card & flexible milestone financing options'
    },
    {
      id: 2,
      title: 'Competitor Threat',
      category: 'Competitive Defense',
      cue: 'Prospect mentions competitor name with positive inflection',
      action: 'Displays competitor battlecard with exact feature differentiators & switch credits'
    },
    {
      id: 3,
      title: 'Decision Maker Timeline',
      category: 'Deal Velocity',
      cue: 'Stakeholder mentions board approval deadlines or end-of-quarter budget cycles',
      action: 'Proposes Mutual Action Plan timeline and schedules executive alignment review'
    },
    {
      id: 4,
      title: 'Security & Compliance Gate',
      category: 'Risk Mitigation',
      cue: 'Questions regarding SOC2, HIPAA, data tenancy, or IT procurement hurdles',
      action: 'Provides pre-approved one-click security architecture whitepaper download'
    },
    {
      id: 5,
      title: 'Feature Gap Concern',
      category: 'Product Validation',
      cue: 'Prospect highlights a missing integration or niche workflow requirement',
      action: 'Surfaces API webhook workaround & live roadmap commitments'
    },
    {
      id: 6,
      title: 'Procurement Gatekeeper',
      category: 'Commercial Terms',
      cue: 'Mention of legal review, MSA revisions, or procurement discount thresholds',
      action: 'Generates standard enterprise redline guide and approval limits for the rep'
    },
    {
      id: 7,
      title: 'Urgency & Champion Buy-in',
      category: 'Champion Power',
      cue: 'Internal champion expressing enthusiasm and strategic team initiative alignment',
      action: 'Prompts rep to arm champion with internal deck to present to the CFO'
    },
    {
      id: 8,
      title: 'Pilot & POC Scope',
      category: 'Evaluation Phase',
      cue: 'Prospect asks about trial success criteria, test dataset, or duration',
      action: 'Auto-generates a 14-day scoped POC agreement with quantifiable KPI milestones'
    },
    {
      id: 9,
      title: 'Price Sensitivity Resistance',
      category: 'Discount Control',
      cue: 'Pushback on per-seat pricing or implementation cost',
      action: 'Displays tier trade-offs to protect deal margin without discounting ARR'
    },
    {
      id: 10,
      title: 'Technical Integration Confidence',
      category: 'Architecture',
      cue: 'Prospect engineer asks about SSO, webhooks, and REST rate limits',
      action: 'Whispers developer documentation link and answers technical spec in seconds'
    },
    {
      id: 11,
      title: 'Purchasing Authority Gap',
      category: 'Stakeholder Mapping',
      cue: 'Caller reveals "I need to check with our VP before signing"',
      action: 'Guides rep to schedule joint alignment call with the budget owner'
    },
    {
      id: 12,
      title: 'Contract Closing Signal',
      category: 'Close Execution',
      cue: 'Prospect asks for contract effective date and billing start schedules',
      action: 'Prepares DocuSign envelope and locks opportunity stage to Closing Won'
    }
  ];

  const faqs = [
    {
      q: 'How does SellMore analyze sales meetings in real time?',
      a: 'SellMore uses lightweight meeting bots or our browser extension to capture high-fidelity audio streams across Zoom, Microsoft Teams, and Google Meet. Our proprietary 12-cue model evaluates acoustic prosody, linguistic nuance, and semantic objection patterns to provide sub-second whisper assistance.'
    },
    {
      q: 'Does it write back into Salesforce and HubSpot automatically?',
      a: 'Yes! SellMore eliminates manual CRM note-taking by extracting MEDDPIC fields, next steps, competitor mentions, and stage updates, then pushes them directly to your CRM with client admin approval or full autonomy.'
    },
    {
      q: 'Can my sales team practice with AI Mock Meetings?',
      a: 'Absolutely. SellMore features a realistic AI Voice and Prompt Simulator where reps can rehearse objection handling against AI personas representing skeptical CFOs, demanding CTOs, or tough procurement officers.'
    },
    {
      q: 'What is included in the Free Evaluation plan?',
      a: 'The Free Evaluation includes full access to all 12 sales cues, 10 meeting analyses, manual file uploads (MP4, MP3, TXT), 5 team seats, and full company document QA.'
    },
    {
      q: 'How is enterprise customer data protected?',
      a: 'SellMore is built with strict enterprise tenant isolation. All audio and text data is encrypted at rest using AES-256 and in transit via TLS 1.3. We enforce zero data training on customer data and provide SOC2 Type II compliance.'
    }
  ];

  return (
    <div className="flex flex-col bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold shadow-xs mb-6 hover:bg-blue-100 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Meeting analysis, deal workspace and CRM sync in one platform</span>
            <ChevronRight className="w-3 h-3 text-blue-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Turn Every Sales Meeting Into{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Closed Revenue
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            SellMore decodes in-call buyer cues, whispers winning battlecards in real time, and autonomously updates your Salesforce CRM—giving your team an unfair advantage on every deal.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Start Free Evaluation (10 Calls)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => handleLaunchRole('client_admin')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span>Launch Live Interactive Demo</span>
            </button>

            <Link
              to="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 text-slate-600 hover:text-slate-900 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors"
            >
              View Pricing & Plans
            </Link>
          </div>

          {/* Trust Badges Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200/70 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                38%
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Faster Sales Cycle</div>
                <div className="text-slate-500 text-[11px]">Shorter time to close</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                94%
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">CRM Auto Accuracy</div>
                <div className="text-slate-500 text-[11px]">Zero manual notes</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                12
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Sales Cues</div>
                <div className="text-slate-500 text-[11px]">Acoustic & semantic</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                SOC2
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Type II Verified</div>
                <div className="text-slate-500 text-[11px]">Enterprise grade security</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PRODUCT SHOWCASE & SIMULATION */}
      <section id="features" className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Experience The Intelligence
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight sm:text-4xl">
              See SellMore in Action Inside a Live Meeting
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Watch how our sub-second acoustic model listens to buyer hesitation, triggers objection cards, and fills CRM fields without interrupting the flow.
            </p>

            {/* Interactive Mode Tabs */}
            <div className="mt-6 inline-flex p-1 bg-slate-800 rounded-xl border border-slate-700 max-w-full overflow-x-auto">
              <button
                onClick={() => setActiveDemoTab('live')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeDemoTab === 'live' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>1. Live Assist Simulator</span>
              </button>
              <button
                onClick={() => setActiveDemoTab('cues')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeDemoTab === 'cues' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>2. 12 Sales Cues</span>
              </button>
              <button
                onClick={() => setActiveDemoTab('crm')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeDemoTab === 'crm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Autonomous CRM Auto-Fill</span>
              </button>
              <button
                onClick={() => setActiveDemoTab('coaching')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeDemoTab === 'coaching' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>4. AI Rep Coaching</span>
              </button>
            </div>
          </div>

          {/* Interactive Window Card */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 lg:p-8">
            {activeDemoTab === 'live' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Meeting Video Mockup & Audio Stream */}
                <div className="lg:col-span-7 bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-200">
                        Acme Cloud vs Apex Engineering · $185,000 Deal
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">00:14:28 / 00:30:00</span>
                  </div>

                  {/* Simulated Transcript Dialogue */}
                  <div className="space-y-3 font-sans text-xs">
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      <div className="font-semibold text-blue-400 mb-1">Alex Chen (Account Executive):</div>
                      <p className="text-slate-300">
                        "Based on your requirements for high-precision CNC machining parts, our Tier-1 supply chain guarantees 99.8% on-time delivery across North America."
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-800/50 border border-rose-500/40 relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-rose-300">Markus Vance (VP Tech, Prospect):</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Cue: Budget Hesitation & Datadog Lock
                        </span>
                      </div>
                      <p className="text-slate-200">
                        "The platform looks impressive, Alex, but frankly we haven't budgeted for an enterprise overhaul this fiscal quarter, and we're currently under contract with Datadog for another 8 months."
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                    <span>⚡ Speech prosody pitch drop detected (-14Hz)</span>
                    <span className="text-blue-400 font-medium">Confidence: 96.8%</span>
                  </div>
                </div>

                {/* Right Side: SellMore Live Assist Card */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-850 rounded-xl border border-blue-500/50 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        SM
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        Live Whisper Assist (Instant)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Generated in 280ms
                    </span>
                  </div>

                  <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-lg space-y-2">
                    <div className="text-xs font-bold text-blue-300">
                      🎯 Recommended Objection Battlecard:
                    </div>
                    <ul className="text-xs text-slate-300 space-y-2">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Validate Contract Overlap:</strong> Don't argue. Offer the $25k Contract Buyout Credit program.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Pivot to Phased Rollout:</strong> Propose activating 5 seats today for free during the pilot, with billing starting upon Datadog contract expiration.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>ROI Proof:</strong> Reference our recent case study where PrecisionMach reduced tooling downtime by 34%.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => handleLaunchRole('sales_rep')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>Try Live Assist Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-slate-400">Available in Chrome Extension</span>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'cues' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  SellMore continuously scans audio streams for 12 key sales signals using acoustic analysis:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cuesData.slice(0, 6).map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">{c.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">#{c.id}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">"{c.cue}"</div>
                      <div className="text-[10px] text-emerald-400 font-medium">↳ {c.action}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-2">
                  <a href="#cues" className="text-xs text-blue-400 hover:underline">
                    View full 12 cues breakdown below ↓
                  </a>
                </div>
              </div>
            )}

            {activeDemoTab === 'crm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Autonomous CRM Sync Status: Connected (Salesforce)</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Opportunity:</span>
                      <span className="text-slate-200">Apex Aerospace Q3 Pilot</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Stage:</span>
                      <span className="text-emerald-400 font-bold">Proposal / Price Quote</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Deal Value:</span>
                      <span className="text-slate-200">$185,000 ARR</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Identified Competitor:</span>
                      <span className="text-rose-400">Datadog (8mo contract)</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Next Action:</span>
                      <span className="text-blue-400">Send Buyout Credit Addendum by Friday</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Zero Time Spent Entering Salesforce Data
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Reps spend up to 4.5 hours every week manually copy-pasting meeting notes into CRMs. SellMore extracts all MEDDPIC metrics, attendees, action items, and risk factors automatically after every call.
                  </p>
                  <button
                    onClick={() => handleLaunchRole('client_admin')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>Inspect CRM Auto-Fill Settings</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeDemoTab === 'coaching' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-800 text-[11px] font-semibold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    AI Deal Doctor & Win Probability
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Identify Deal Risks Before Deals Slip
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Our AI Deal Doctor analyzes rep talk-to-listen ratios, competitor mention density, and buyer commitment signals to assign predictive win probabilities and specific coaching actions.
                  </p>
                  <button
                    onClick={() => handleLaunchRole('manager')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>Open Manager Coaching Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Deal Health Scorecard</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                      78% Win Probability
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="text-[11px] font-bold text-amber-400 mb-0.5">⚠️ Risk Identified:</div>
                      <div className="text-slate-300 text-[11px]">CFO is not yet involved in legal review.</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="text-[11px] font-bold text-blue-400 mb-0.5">💡 Prescribed Rep Action:</div>
                      <div className="text-slate-300 text-[11px]">Send executive summary deck tailored to finance department.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. PLATFORM FEATURES */}
      <section id="platform-features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Everything In One Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Features Built For The Whole Revenue Team
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              From the moment a recording lands to the deal that closes, SellMore analyses every meeting, ties it to the Salesforce Opportunity and coaches reps on what to do next.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Video,
                tone: 'bg-blue-50 text-blue-600',
                title: 'Meeting Analysis & Scoring',
                text: 'Upload an MP4, MP3 or transcript and get a scored analysis in minutes: summary, objections, what went well, where the rep struggled and recommended next steps.'
              },
              {
                icon: Database,
                tone: 'bg-sky-50 text-sky-600',
                title: 'Auto-fetch From CRM & Google Drive',
                text: 'Connect Salesforce or a Google Drive folder and new recordings arrive on their own. Choose how often to check, or run Sync now. Every meeting shows where it came from.'
              },
              {
                icon: Zap,
                tone: 'bg-violet-50 text-violet-600',
                title: 'Lead Workspace',
                text: 'One page per deal with stakeholders, risks, timeline, next steps and every meeting held for that deal, so nothing is lost between calls.'
              },
              {
                icon: CheckCircle2,
                tone: 'bg-emerald-50 text-emerald-600',
                title: 'Salesforce CRM Auto-Fill',
                text: 'Key facts are pulled out of every call. Review the suggested field updates and push them to Salesforce, with no manual notes. Planned for V2.'
              },
              {
                icon: GraduationCap,
                tone: 'bg-purple-50 text-purple-600',
                title: 'Lead Coaching & Practice',
                text: 'Personalised coaching lessons based on real calls, plus mock meetings with an AI buyer so reps can rehearse a tough conversation before it happens.'
              },
              {
                icon: Headphones,
                tone: 'bg-rose-50 text-rose-600',
                title: 'Live Assist',
                text: 'In-call battlecards, objection responses and product answers on screen while the conversation is happening.'
              },
              {
                icon: FileText,
                tone: 'bg-amber-50 text-amber-600',
                title: 'Knowledge Base & Company Documents',
                text: 'Upload handbooks and product documents. Ask questions and get answers grounded in your own material.'
              },
              {
                icon: Workflow,
                tone: 'bg-indigo-50 text-indigo-600',
                title: 'Workflow Automations',
                text: 'Build trigger, condition and action flows for meeting summaries, pre-call briefs and follow-up email drafts.'
              },
              {
                icon: BarChart3,
                tone: 'bg-cyan-50 text-cyan-600',
                title: 'Team Analytics & Roles',
                text: 'Dashboards for admins, managers and reps. Managers see their own team, reps see their own deals, and admins control integrations and seats.'
              }
            ].map(f => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-200 transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.tone}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-4 text-center">
            {[
              ['1', 'Connect', 'Link Salesforce, Google Drive or both. Or skip and upload recordings by hand.'],
              ['2', 'Analyse', 'Recordings are scored, matched to the right Salesforce deal and turned into objections and deal risks.'],
              ['3', 'Act', 'Coach the rep, update the CRM and prepare the next call from one workspace.']
            ].map(([n, t, d]) => (
              <div key={n} className="flex flex-col items-center px-4">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">{n}</div>
                <div className="mt-3 font-bold text-slate-900">{t}</div>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg">
              Start Free Evaluation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ROLE-BASED SOLUTIONS */}
      <section id="solutions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Tailored For Every Role In Your Revenue Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              One Unified Sales Intelligence Platform
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Whether you are closing on the front lines, coaching reps, or managing enterprise CRM governance, SellMore delivers the exact workspace you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sales Rep Persona */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between hover:border-blue-400 transition-all shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Sales Reps & AEs</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Never freeze when a prospect challenges your pricing or brings up a rival vendor. Get real-time whisper battlecards and let the AI draft your post-call recap.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In-call objection battlecard overlays</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AI Mock Meeting roleplay practice</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero manual CRM update burden</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => handleLaunchRole('sales_rep')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 border border-slate-300 text-slate-900 hover:text-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Launch Rep Workspace (Alex Chen)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sales Manager Persona */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between hover:border-indigo-400 transition-all shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Sales Managers</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  You don't have 40 hours a week to listen to call recordings. SellMore synthesizes rep performance, flags deal slippage risk, and generates 1-on-1 coaching rubrics.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10x faster call review with key cue timestamps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated rep scorecards and skill benchmarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Assigned reps queue & deal risk alerts</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => handleLaunchRole('manager')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-900 hover:text-indigo-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Launch Manager Workspace (David Miller)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Client Admin / Executive Persona */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between hover:border-purple-400 transition-all shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For RevOps & Admins</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Eliminate CRM data decay and protect revenue forecasting. Set bidirectional Salesforce rules, manage Google Drive document context, and govern team licenses.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bidirectional Salesforce & HubSpot integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Company Drive sync & Knowledge Base indexing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Billing, seat management & enterprise audit log</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => handleLaunchRole('client_admin')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-purple-50 border border-slate-300 text-slate-900 hover:text-purple-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Launch Admin Workspace (Sarah Lin)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS 3-STEP PIPELINE */}
      <section id="how-it-works" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Seamless Integration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Up and Running in Less Than 5 Minutes
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Connect your calendar and video provider. No complicated infrastructure setup required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Connect Meetings & Documents</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invite our recording bot to your Zoom, Google Meet, or Microsoft Teams calls, or upload historical audio recordings. Sync company battlecards from Google Drive.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Sub-Second Cue Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                During the call, the SellMore engine detects 12 key sales cues and feeds live battlecards, ROI calculations, and objection responses to reps via our Chrome Extension.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Autonomous Sync & Coaching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The instant the meeting wraps, call summaries, MEDDPIC fields, and next steps populate your CRM, while managers receive automated coaching recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trusted by High-Velocity B2B Sales Teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "Our reps used to dread competitor questions against incumbent vendors. With SellMore's Live Assist whisper cards, win rates in competitive deals jumped from 28% to 54% in one quarter."
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  EM
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                  <div className="text-[10px] text-slate-500">VP of Global Sales, CloudMetrics</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "The automated CRM write-back alone is worth the investment. Reps save an entire Friday afternoon of note logging, and our Salesforce forecast hygiene is finally accurate."
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  TH
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Tyler Harrison</div>
                  <div className="text-[10px] text-slate-500">Head of Revenue Operations, NexaCorp</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "As a sales manager, reviewing calls was impossible with a team of 14 reps. SellMore brings me directly to the exact moments when budget hesitation occurred."
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  SL
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Samantha Lee</div>
                  <div className="text-[10px] text-slate-500">Director of Sales Enablement, Apex AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING TEASER SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Transparent Investment
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Plans Built for Every Stage of Sales Growth
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Start free with our 10-meeting evaluation. Upgrade as your team scales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation</div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Free Plan</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 Meeting Total Cap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All 12 Sales Cues</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>5 Team Seats</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full block py-2.5 px-3 text-center text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Small Teams</div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Starter</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">$79</span>
                  <span className="text-xs text-slate-500">/ mo</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>35 Meetings / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Drive Folder Retrieval</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 Team Seats</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/pricing"
                  className="w-full block py-2.5 px-3 text-center text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Growth Plan */}
            <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-xl relative scale-102">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> Most Popular
              </div>
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Fast Scaling</div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Growth</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">$199</span>
                  <span className="text-xs text-slate-500">/ mo</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Unlimited Meetings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Salesforce V1 Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live Assist In-Meeting Extension</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>25 Team Seats</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/pricing"
                  className="w-full block py-2.5 px-3 text-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Choose Growth Plan
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Volume</div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">$649</span>
                  <span className="text-xs text-slate-500">/ mo</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Everything in Growth</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Seats & SLAs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Instance & SAML</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/pricing"
                  className="w-full block py-2.5 px-3 text-center text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900 transition-colors"
                >
                  Explore Enterprise
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/pricing"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Compare all features in detailed pricing matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Answers & Clarifications
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                  <span className="text-slate-400 shrink-0 text-sm">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. HIGH CONVERSION BOTTOM CTA BANNER */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl text-white tracking-tight">
            Ready to Turn Every Sales Call Into Predictable Revenue?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto font-normal">
            Join enterprise revenue teams who use SellMore to detect acoustic buyer signals, automate CRM data entry, and equip reps with instant winning battlecards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              Start Free Evaluation (10 Meetings)
            </Link>
            <button
              onClick={() => handleLaunchRole('client_admin')}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-800/60 hover:bg-blue-800 border border-blue-400/40 text-white font-bold text-sm rounded-xl transition-all"
            >
              Launch Interactive Demo
            </button>
          </div>

          <div className="pt-4 text-xs text-blue-200">
            No credit card required · Instant setup in under 2 minutes · Cancel anytime
          </div>
        </div>
      </section>
    </div>
  );
};

