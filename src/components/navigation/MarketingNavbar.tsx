
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export const MarketingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 xl:px-10">

        <div className="flex items-center justify-between min-h-[76px] gap-6">

          {/* BRAND LOGO */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-3 shrink-0"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white flex items-center justify-center font-extrabold text-base shadow-md">
              SM
            </div>

            <div className="flex flex-col">
              <span className="text-[23px] font-extrabold text-slate-950 tracking-tight leading-none">
                SellMore
              </span>

              <span className="text-[10px] font-bold text-blue-600 tracking-[1.5px] uppercase mt-1.5 whitespace-nowrap">
                AI Sales Intelligence
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden lg:flex items-center gap-3">

            <Link
              to="/"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              Home
            </Link>

            <Link
              to="/pricing"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>


          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden lg:flex items-center gap-5">


            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              Start Free Evaluation
              <ArrowRight size={17} />
            </Link>

          </div>

          {/* MOBILE CONTROLS */}
          <div className="flex lg:hidden items-center gap-3">

            <Link
              to="/register"
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold whitespace-nowrap"
            >
              Start Free
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

          </div>

        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-lg">
          <div className="px-5 py-5 space-y-3">

            <Link
              to="/"
              onClick={closeMenu}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Home
            </Link>

            <Link
              to="/pricing"
              onClick={closeMenu}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Pricing
            </Link>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">

              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold"
              >
                Start Free
                <ArrowRight size={15} />
              </Link>

            </div>
          </div>
        </div>
      )}

    </header>
  );
};
