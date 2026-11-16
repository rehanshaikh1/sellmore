import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { 
  Check, 
  X, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Lock, 
  Activity, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlan, setPlan } = useStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'free') {
      setPlan('free');
      navigate('/admin/dashboard');
    } else {
      navigate(`/checkout?plan=${planKey}&cycle=${billingCycle}`);
    }
  };

  const comparisonRows = [
    {
      category: 'Meeting Analysis & Volume',
      features: [
        { name: 'Monthly Meeting Volume', free: '10 Total', starter: '35 / mo', growth: 'Unlimited', enterprise: 'Unlimited' },
        { name: '12 Sales Cues', free: true, starter: true, growth: true, enterprise: true },
        { name: 'Manual Audio/Video Upload (MP4, MP3, TXT)', free: true, starter: true, growth: true, enterprise: true },
        { name: 'Bot Calendar Recording (Zoom, Teams, Meet)', free: false, starter: true, growth: true, enterprise: true },
        { name: 'Audio Spectrogram & Waveform Playback', free: true, starter: true, growth: true, enterprise: true },
        { name: 'Monthly AI Credit Allocation', free: '25 credits', starter: '100 credits', growth: '500 credits', enterprise: '2,500 credits' },
      ]
    },
    {
      category: 'Real-Time & Live Assist',
      features: [
        { name: 'Chrome Extension Whisper Assist', free: false, starter: false, growth: true, enterprise: true },
        { name: 'In-Call Objection Battlecards', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Live Assist Call Simulator', free: false, starter: true, growth: true, enterprise: true },
        { name: 'Real-Time Prosody & Pitch Detection', free: false, starter: false, growth: true, enterprise: true },
      ]
    },
    {
      category: 'CRM & Integrations',
      features: [
        { name: 'Salesforce V1 Bidirectional Sync', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Autonomous CRM Auto-Fill', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Google Drive Document Indexing', free: false, starter: true, growth: true, enterprise: true },
        { name: 'HubSpot Integration', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Custom CRM Field Mapping', free: false, starter: false, growth: false, enterprise: true },
      ]
    },
    {
      category: 'Coaching & Enablement',
      features: [
        { name: 'AI Mock Meeting Voice Roleplay', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Lead Coaching Multi-Lesson Tracks', free: false, starter: false, growth: true, enterprise: true },
        { name: 'AI Deal Doctor & Win Probability', free: false, starter: true, growth: true, enterprise: true },
        { name: 'Rep Scorecards & Talk-to-Listen Ratio', free: false, starter: true, growth: true, enterprise: true },
      ]
    },
    {
      category: 'Security & Team Governance',
      features: [
        { name: 'Workspace Team Seats', free: '5 seats', starter: '10 seats', growth: '25 seats', enterprise: 'Unlimited' },
        { name: 'Client Admin & Manager RBAC', free: true, starter: true, growth: true, enterprise: true },
        { name: 'SOC 2 Type II Compliance & Audit Logs', free: false, starter: false, growth: true, enterprise: true },
        { name: 'Single Sign-On (SAML/Okta)', free: false, starter: false, growth: false, enterprise: true },
        { name: 'Dedicated Customer Success Architect', free: false, starter: false, growth: false, enterprise: true },
      ]
    }
  ];

  const pricingFaqs = [
    {
      q: 'Can I start free without entering a credit card?',
      a: 'Yes. The Free Evaluation plan gives you 10 complete meeting analyses and access to all 12 sales cues with zero credit card required.'
    },
    {
      q: 'Can I upgrade or downgrade at any time?',
      a: 'Yes, you can upgrade, downgrade, or add additional rep seats at any time from your Billing Settings page. Prorated credits will automatically be applied.'
    },
    {
      q: 'What happens when I reach my monthly meeting limit?',
      a: 'You can either upgrade to a higher tier or purchase additional pay-as-you-go meeting credit packs directly from your admin dashboard without interruption.'
    },
    {
      q: 'How does annual billing work?',
      a: 'Annual billing provides an immediate 20% discount compared to month-to-month billing. You will be billed annually upfront with priority customer support.'
    },
    {
      q: 'Do you offer custom enterprise pricing for large sales forces?',
      a: 'Yes, for teams over 50 seats requiring custom CRM field mapping, private cloud deployment, or dedicated fine-tuned models, our Enterprise tier offers custom terms and dedicated SLA guarantees.'
    }
  ];

  return (
    <div className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Sales Enablement Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Predictable Plans for High-Performance Teams
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Start free with 10 meeting analyses or unlock Salesforce CRM sync, in-meeting Live Assist, and AI Lead Coaching.
          </p>

          {/* Billing Cadence Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-white rounded-2xl border border-slate-300 shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-20">
          {/* 1. Free Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation</div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Free Plan</h3>
              <p className="text-xs text-slate-500 mt-2">Explore 12-cue speech analysis with no commitments.</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">$0</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">10 Meeting Total Cap</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 12 Sales Cues</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Manual Audio/Video Upload</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5 Workspace Team Seats</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>No Salesforce CRM Sync</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>No In-Call Live Assist</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectPlan('free')}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border transition-colors ${
                  currentPlan === 'free'
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900'
                }`}
              >
                {currentPlan === 'free' ? 'Current Plan (Active)' : 'Start Free Evaluation'}
              </button>
            </div>
          </div>

          {/* 2. Starter Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Small Teams</div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Starter</h3>
              <p className="text-xs text-slate-500 mt-2">For growing sales teams capturing meeting audio.</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  ${billingCycle === 'monthly' ? '99' : '79'}
                </span>
                <span className="text-xs text-slate-500">/ mo</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>35 Meetings / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100 Monthly AI Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Google Drive Folder Retrieval</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Practice Prompts & Lessons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10 Workspace Team Seats</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Salesforce CRM Disabled</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectPlan('starter')}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border transition-colors ${
                  currentPlan === 'starter'
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900'
                }`}
              >
                {currentPlan === 'starter' ? 'Current Plan (Active)' : 'Choose Starter Plan'}
              </button>
            </div>
          </div>

          {/* 3. Growth Plan (Featured) */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-xl relative scale-102 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-xs flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-current" /> Most Popular
            </div>

            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Fast Scaling</div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Growth</h3>
              <p className="text-xs text-slate-500 mt-2">Full intelligence stack with CRM sync & in-call Live Assist.</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  ${billingCycle === 'monthly' ? '249' : '199'}
                </span>
                <span className="text-xs text-slate-500">/ mo</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Unlimited Meeting Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Salesforce V1 CRM Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Google Drive Folder Retrieval</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-blue-700">Live Assist Chrome Extension</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AI Mock Meeting Roleplay Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>25 Workspace Team Seats</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectPlan('growth')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <span>{currentPlan === 'growth' ? 'Current Plan (Active)' : 'Choose Growth Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Enterprise Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Volume</div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-2">Dedicated tenant routing, unlimited seats, and custom SLAs.</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  ${billingCycle === 'monthly' ? '799' : '649'}
                </span>
                <span className="text-xs text-slate-500">/ mo</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Everything in Growth</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Workspace Seats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom CRM Write-Back Rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2,500 Monthly AI Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Enterprise SLAs & SSO</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectPlan('enterprise')}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border transition-colors ${
                  currentPlan === 'enterprise'
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900'
                }`}
              >
                {currentPlan === 'enterprise' ? 'Current Plan (Active)' : 'Choose Enterprise Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* DETAILED COMPARISON TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-20">
          <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-2xl font-bold text-slate-900">
              Detailed Plan Feature Comparison
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Compare limits, features, and capabilities across all 4 SellMore tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-6 font-bold text-slate-900 w-2/5">Platform Feature</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-center w-1/6">Free Plan</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-center w-1/6">Starter</th>
                  <th className="py-4 px-4 font-bold text-blue-600 text-center w-1/6 bg-blue-50/50">Growth (Popular)</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-center w-1/6">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-slate-100/70">
                      <td colSpan={5} className="py-2.5 px-6 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.features.map((feat, featIdx) => (
                      <tr key={featIdx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-6 text-slate-700 font-medium">{feat.name}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof feat.free === 'boolean' ? (
                            feat.free ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                          ) : (
                            <span className="font-semibold text-slate-700">{feat.free}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feat.starter === 'boolean' ? (
                            feat.starter ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                          ) : (
                            <span className="font-semibold text-slate-700">{feat.starter}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-blue-50/20">
                          {typeof feat.growth === 'boolean' ? (
                            feat.growth ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                          ) : (
                            <span className="font-bold text-blue-700">{feat.growth}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feat.enterprise === 'boolean' ? (
                            feat.enterprise ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                          ) : (
                            <span className="font-semibold text-slate-700">{feat.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRICING FAQ */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Billing Questions</h2>
          </div>
          <div className="space-y-3">
            {pricingFaqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left font-bold text-slate-900 text-xs sm:text-sm flex justify-between items-center"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Guarantee Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-4xl mx-auto shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">Need a Custom Enterprise Agreement?</h3>
            <p className="text-xs text-slate-500 mt-1">
              We offer dedicated multi-tenant VPC instances, custom security reviews, and custom SLA contracts.
            </p>
          </div>
          <button
            onClick={() => handleSelectPlan('enterprise')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Contact Sales Architecture
          </button>
        </div>
      </div>
    </div>
  );
};

