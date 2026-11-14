import React from 'react';
import { Outlet } from 'react-router-dom';
import { DemoSwitcherBar } from '../components/common/DemoSwitcherBar';
import { MarketingNavbar } from '../components/navigation/MarketingNavbar';
import { MarketingFooter } from '../components/navigation/MarketingFooter';

export const MarketingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Demo Controls Bar across top for interactive testing */}
      <DemoSwitcherBar />

      {/* Main Public Navbar */}
      <MarketingNavbar />

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <MarketingFooter />
    </div>
  );
};

