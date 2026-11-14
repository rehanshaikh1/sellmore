import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Check, X, Zap, Shield, ArrowRight } from 'lucide-react';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlan, setPlan } = useStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'free') {
      setPlan('free');
      navigate('/admin/dashboard');
    } else {
      navigate(`/checkout?plan=${planKey}&cycle=${billingCycle}`);
    }
  };

  return (
    <div className="py-6 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Transparent, Scalable Intelligence Plans
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl mx-auto">
          Start free with 10 meeting analyses or unlock Salesforce CRM context, Chrome extension Live Assist, and AI Deal Coaching.
        </p>

        {/* Billing Cadence Selector */}
        <div className="mt-6 inline-flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Annual Billing
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Free Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Evaluation</div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Free Plan</h3>
            <p className="text-xs text-slate-500 mt-2">For early exploration of 12-cue speech analysis.</p>

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
                <span>Manual File Upload (MP4, MP3, TXT)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Company Docs & View Predefined QA</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 Workspace Team Seats</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>No CRM or Google Drive Sync</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>No Practice or Mock Roleplays</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelectPlan('free')}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                currentPlan === 'free'
                  ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-default'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900'
              }`}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>
        </div>

        {/* Starter Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Small Teams</div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Starter</h3>
            <p className="text-xs text-slate-500 mt-2">For growing sales teams automating meeting capture.</p>

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
                <span>Practice & Timed Prompts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10 Workspace Team Seats</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Salesforce CRM Disabled</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Live Assist Chrome Extension</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelectPlan('starter')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900 transition-colors"
            >
              Choose Starter
            </button>
          </div>
        </div>

        {/* Growth Plan (Featured) */}
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-xl relative scale-102 z-10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-xs flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> Most Popular
          </div>

          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Fast Scaling</div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Growth</h3>
            <p className="text-xs text-slate-500 mt-2">Full intelligence stack, CRM context, coaching & live assist.</p>

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
                <span className="font-semibold text-blue-700">Live Assist In-Meeting Extension</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI Mock Meeting Roleplay Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Deal Coaching Multi-Lesson Program</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono">500 Monthly AI Credits</span>
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
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{currentPlan === 'growth' ? 'Current Plan (Active)' : 'Choose Growth Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Volume</div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise</h3>
            <p className="text-xs text-slate-500 mt-2">Custom security, unlimited seats, and dedicated tenant routing.</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                ${billingCycle === 'monthly' ? '799' : '649'}
              </span>
              <span className="text-xs text-slate-500">/ mo</span>
            </div>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everything in Growth</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited Team Seats</span>
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
                <span>Dedicated Enterprise SLAs</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSelectPlan('enterprise')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-900 transition-colors"
            >
              Choose Enterprise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
