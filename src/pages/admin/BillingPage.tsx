import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Zap,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { INITIAL_INVOICES } from '../../data/mockData';

export const BillingPage: React.FC = () => {
  const { currentPlan, creditBalance, creditTransactions, topUpCredits, setPlan, currentUser } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'invoices' | 'methods'>('overview');
  const [topUpSuccess, setTopUpSuccess] = useState('');

  const TOP_UP_PACKAGES = [
    { credits: 500, price: 49, desc: 'Ideal for ~30 additional meeting analyses' },
    { credits: 1000, price: 89, desc: 'Most popular top-up package with 10% bonus' },
    { credits: 2500, price: 199, desc: 'Volume package for high-frequency call teams' }
  ];

  const handleBuyCredits = (credits: number, price: number) => {
    topUpCredits(credits, price);
    setTopUpSuccess(`Added +${credits.toLocaleString()} AI credits to your workspace balance!`);
    setTimeout(() => setTopUpSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Subscriptions</h1>

        </div>

        <Link
          to="/pricing"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Compare & Change Plan</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 tracking-tight ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Plan Overview
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`pb-3 transition-colors border-b-2 tracking-tight ${activeTab === 'credits' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          AI Credits & Usage ({creditBalance})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 transition-colors border-b-2 tracking-tight ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Invoices & Receipts
        </button>
        <button
          onClick={() => setActiveTab('methods')}
          className={`pb-3 transition-colors border-b-2 tracking-tight ${activeTab === 'methods' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Payment Methods
        </button>
      </div>

      {/* Tab 1: Plan Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Plan</span>
                  <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-md ${currentPlan === 'free' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                    {currentPlan}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1 capitalize tracking-tight">
                  {currentPlan === 'free' ? 'Free Evaluation Plan' : `${currentPlan} Tier Plan`}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentPlan === 'free'
                    ? '10 meeting analyses maximum, manual upload, predefined QA prompts view-only.'
                    : 'Unlimited meeting analysis, Salesforce CRM integration, Live Assist extension, and 500 AI credits/mo.'
                  }
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
                  {currentPlan === 'free' ? '$0' : '$249'}
                  <span className="text-xs text-slate-400 font-normal"> / month</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {currentPlan === 'free' ? 'No renewal required' : 'Next renewal: December 1, 2026'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Included Team Seats</div>
                <div className="font-semibold text-slate-900 mt-1 font-mono text-sm tracking-tight">
                  {currentPlan === 'free' ? '5 Seats' : '25 Seats Allocated'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Meeting Analyse Allowance</div>
                <div className="font-semibold text-slate-900 mt-1 font-mono text-sm tracking-tight">
                  {currentPlan === 'free' ? '10 Records Total' : 'Unlimited Continuous'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">CRM & Live Assist Access</div>
                <div className="font-semibold text-slate-900 mt-1 text-sm tracking-tight">
                  {currentPlan === 'free' ? (
                    <span className="text-amber-700 font-semibold">Disabled (Free)</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Full Entitlement Active</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Credits Top-Up & Usage */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          {topUpSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{topUpSuccess}</span>
            </div>
          )}

          {/* Balance Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace AI Credit Balance</div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                {creditBalance.toLocaleString()} <span className="text-xs font-normal text-slate-500">Credits</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Used for deep speech cue scoring (15 credits/call), mock roleplays (25 credits), and real-time Live Assist in meetings.
              </p>
            </div>
          </div>

          {/* Top-up Packages */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Purchase Instant Credit Top-Up Packages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOP_UP_PACKAGES.map((pkg, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold text-slate-900 tracking-tight">+{pkg.credits.toLocaleString()} Credits</span>
                      <span className="font-mono text-sm font-bold text-blue-600">${pkg.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pkg.desc}</p>
                  </div>
                  <button
                    onClick={() => handleBuyCredits(pkg.credits, pkg.price)}
                    className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Purchase for ${pkg.price}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Credit Consumption Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-slate-500">Activity / Service</th>
                    <th className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-slate-500">Date</th>
                    <th className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-slate-500 text-right">Credits Consumed</th>
                    <th className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-slate-500 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {creditTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900 tracking-tight">{tx.activity}</td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">{tx.date}</td>
                      <td className={`py-2.5 px-4 text-right font-bold text-[11px] ${tx.creditsConsumed < 0 ? 'text-emerald-700' : 'text-slate-800'
                        }`}>
                        {tx.creditsConsumed < 0 ? `+${Math.abs(tx.creditsConsumed)}` : `-${tx.creditsConsumed}`}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 text-[11px]">{tx.remainingBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment History & Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Invoice ID</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Billing Date</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Description / Purpose</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Amount</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500">Status</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-500 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_INVOICES.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-[11px]">{inv.id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{inv.date}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{inv.purpose}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">${inv.amount}.00</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        <Check className="w-3 h-3 text-emerald-600" /> {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading official PDF for ${inv.id}`)}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Payment Methods */}
      {activeTab === 'methods' && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs shadow-xs">
                  VISA
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs tracking-tight">Corporate Visa ending in 4242</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Expires 08/29 · Default</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Primary
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => alert('Editing payment method')}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Update Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
