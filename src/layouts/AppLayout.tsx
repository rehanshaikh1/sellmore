
import React, { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { PlugZap, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';

import { Sidebar } from '../components/navigation/Sidebar';
import { TopBar } from '../components/navigation/TopBar';
import { DemoSwitcherBar } from '../components/common/DemoSwitcherBar';
import { PlanUpgradeModal } from '../components/common/PlanUpgradeModal';
import { MeetingUploadModal } from '../components/common/MeetingUploadModal';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, onboardingComplete, currentRole, meetings, crmConnected, driveConnected } = useStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [upgradeModalState, setUpgradeModalState] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
  }>({
    isOpen: false
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUpgrade = (
    title: string,
    description: string
  ) => {
    setUpgradeModalState({
      isOpen: true,
      title,
      description
    });
  };

  const handleCloseUpgrade = () => {
    setUpgradeModalState({
      isOpen: false
    });
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(previous => !previous);
  };

  const handleToggleMobileMenu = () => {
    setMobileMenuOpen(previous => !previous);
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // A role may only use its own route area (e.g. a manager cannot open /admin/* or /sales/*).
  const ROLE_HOME: Record<string, string> = {
    client_admin: '/admin', manager: '/manager', sales_rep: '/sales', super_admin: '/platform'
  };
  const area = '/' + location.pathname.split('/')[1];
  const ownHome = ROLE_HOME[currentRole];
  if (ownHome && Object.values(ROLE_HOME).includes(area) && area !== ownHome) {
    return <Navigate to={`${ownHome}/dashboard`} replace />;
  }
  if (currentRole === 'client_admin' && !onboardingComplete) return <Navigate to="/connect" replace />;

  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="
        h-dvh w-full
        flex flex-col
        overflow-hidden
        bg-slate-50
        text-slate-900
        antialiased
        selection:bg-blue-600
        selection:text-white
      "
    >
      {/* ================================================== */}
      {/* TOP DEMO SWITCHER BAR */}
      {/* ================================================== */}

      <div className="shrink-0 relative z-50">
        <DemoSwitcherBar />
      </div>

      {/* ================================================== */}
      {/* MAIN APPLICATION BODY */}
      {/* ================================================== */}

      <div className="
        flex flex-1
        min-h-0 min-w-0
        overflow-hidden
      ">

        {/* ================================================ */}
        {/* DESKTOP SIDEBAR */}
        {/* ================================================ */}

        <div
          className={`
            hidden lg:flex
            shrink-0 h-full min-h-0
            overflow-hidden
            transition-[width] duration-300 ease-in-out
            ${sidebarCollapsed ? 'w-[76px]' : 'w-64'}
          `}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onOpenUpgradeModal={handleOpenUpgrade}
          />
        </div>

        {/* ================================================ */}
        {/* MOBILE SIDEBAR DRAWER */}
        {/* ================================================ */}

        {mobileMenuOpen && (
          <div className="
            fixed inset-0
            z-[100]
            flex lg:hidden
          ">
            {/* BACKDROP */}
            <button
              type="button"
              aria-label="Close navigation menu"
              className="
                absolute inset-0
                bg-slate-950/60
                backdrop-blur-sm
                cursor-default
              "
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* MOBILE SIDEBAR */}
            <div className="
              relative z-10
              w-72 max-w-[85vw]
              h-full min-h-0
              flex flex-col
              bg-slate-900
              shadow-2xl
            ">
              <Sidebar
                collapsed={false}
                onCloseMobile={() => setMobileMenuOpen(false)}
                onOpenUpgradeModal={(title, description) => {
                  setMobileMenuOpen(false);
                  handleOpenUpgrade(title, description);
                }}
              />
            </div>
          </div>
        )}

        {/* ================================================ */}
        {/* MAIN APPLICATION COLUMN */}
        {/* ================================================ */}

        <div className="
          flex-1
          min-w-0 min-h-0
          flex flex-col
          overflow-hidden
          bg-slate-50
        ">

          {/* TOP NAVIGATION */}
          <div className="shrink-0 relative z-30">
            <TopBar
              onToggleMobileMenu={handleToggleMobileMenu}
              onToggleSidebar={handleToggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
              onOpenUploadModal={() =>
                setIsUploadModalOpen(true)
              }
            />
          </div>

          {/* FIRST-RUN PROMPT: shown until the workspace has at least one meeting */}
          {currentRole !== 'super_admin' && meetings.length === 0 && (
            <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-2.5 bg-blue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px]">
                <Upload className="w-4 h-4 shrink-0" />
                <span>
                  <strong className="font-semibold">Upload your first meeting</strong>
                  {' '}to get a scored analysis, objections and coaching tips. MP4, MP3 or TXT.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentRole === 'client_admin' && !crmConnected && !driveConnected && (
                  <Link
                    to="/admin/crm"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-1.5"
                  >
                    <PlugZap className="w-3.5 h-3.5" /> Connect CRM or Drive
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload meeting
                </button>
              </div>
            </div>
          )}

          {/* MAIN SCROLLABLE CONTENT */}
          <main className="
            flex-1
            min-h-0 min-w-0
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            bg-slate-50/70
            p-4 sm:p-6 lg:p-8
          ">
            <div className="
              w-full
              max-w-[1600px]
              mx-auto
              min-w-0
            ">
              <Outlet />
            </div>
          </main>

        </div>
      </div>

      {/* ================================================== */}
      {/* GLOBAL MODALS */}
      {/* ================================================== */}

      <PlanUpgradeModal
        isOpen={upgradeModalState.isOpen}
        onClose={handleCloseUpgrade}
        featureTitle={upgradeModalState.title}
        featureDescription={upgradeModalState.description}
      />

      <MeetingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

    </div>
  );
};
