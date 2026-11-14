import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { UserRole } from '../../types';
import { ShieldCheck, Lock, Activity, Sparkles, ArrowRight } from 'lucide-react';

export const MarketingFooter: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useStore();

  const handlePersonaClick = (role: UserRole) => {
    switchRole(role);
    if (role === 'client_admin') navigate('/admin/dashboard');
    else if (role === 'manager') navigate('/manager/dashboard');
    else if (role === 'sales_rep') navigate('/sales/dashboard');
    else if (role === 'super_admin') navigate('/platform/dashboard');
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-md">
                SM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-white tracking-tight leading-none">
                  SellMore
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase mt-0.5">
                  AI Sales Intelligence SaaS
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              SellMore empowers high-growth revenue organizations with real-time meeting cue detection, autonomous CRM data capture, and continuous rep coaching.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SOC 2 Type II
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                AES-256 Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                99.9% Uptime SLA
              </span>
            </div>
          </div>

          {/* Product & Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/#cues" className="hover:text-white transition-colors">
                  12 Sales Cues Engine
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Live Assist Simulator
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Autonomous CRM Autofill
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  AI Deal Doctor & Workspace
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Mock Roleplay & Coaching
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions & Roles */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/#solutions" className="hover:text-white transition-colors">
                  For Sales Reps & AEs
                </Link>
              </li>
              <li>
                <Link to="/#solutions" className="hover:text-white transition-colors">
                  For Sales Managers
                </Link>
              </li>
              <li>
                <Link to="/#solutions" className="hover:text-white transition-colors">
                  For RevOps & Admins
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Enterprise Plans & Billing
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Free 10-Meeting Evaluation
                </Link>
              </li>
            </ul>
          </div>

          {/* Interactive Demos & Quick Jump */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Interactive Demos
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => handlePersonaClick('client_admin')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">Sarah Lin</div>
                  <div className="text-[10px] text-slate-500">Client Admin Dashboard</div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              <button
                onClick={() => handlePersonaClick('manager')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">David Miller</div>
                  <div className="text-[10px] text-slate-500">Manager Team Dashboard</div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              <button
                onClick={() => handlePersonaClick('sales_rep')}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">Alex Chen</div>
                  <div className="text-[10px] text-slate-500">Sales Rep Dashboard</div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom divider and legal row */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SellMore Technologies Inc. All rights reserved. Built for B2B Revenue Excellence.
          </div>

          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-slate-300 transition-colors">
              Pricing
            </Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">
              Create Account
            </Link>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Status: Optimal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

