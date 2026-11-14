import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { DemoSwitcherBar } from '../components/common/DemoSwitcherBar';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <DemoSwitcherBar />

      <header className="py-3.5 px-6 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
              SM
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                SellMore
              </span>
              <span className="text-[9px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
                Sales AI
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/pricing" className="text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
          <Link to="/login" className="text-slate-600 hover:text-slate-900">
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            Start Free
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-400 bg-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>SellMore Sales Intelligence & Enablement SaaS · B2B Enterprise Architecture</span>
        <span className="hidden sm:inline text-slate-300">·</span>
        <Link to="/" className="text-slate-500 hover:underline">
          Return to Home
        </Link>
        <span className="hidden sm:inline text-slate-300">·</span>
        <Link to="/pricing" className="text-slate-500 hover:underline">
          View Pricing Plans
        </Link>
      </footer>
    </div>
  );
};
