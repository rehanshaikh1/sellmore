
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

import {
  Menu,
  Bell,
  ChevronRight,
  CreditCard,
  Plus,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface TopBarProps {
  onToggleMobileMenu: () => void;
  onOpenUploadModal?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileMenu,
  onOpenUploadModal,
  onToggleSidebar,
  sidebarCollapsed = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentUser,
    currentRole,
    currentPlan,
    creditBalance,
    logout
  } = useStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click and Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/^([a-z])/, match => match.toUpperCase());

    return {
      name: formatted,
      path: '/' + pathSegments.slice(0, index + 1).join('/')
    };
  });

  const roleLabel = currentRole.replace(/_/g, ' ');

  // Role-specific account settings
  const settingsPath =
    currentRole === 'super_admin'
      ? '/platform/settings'
      : currentRole === 'client_admin'
        ? '/admin/settings'
        : currentRole === 'manager'
          ? '/manager/settings'
          : '/sales/settings';

  const avatarText =
    currentUser.avatar ||
    currentUser.name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <header
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="
        h-[68px] shrink-0 w-full
        bg-white border-b border-slate-200
        px-4 sm:px-6 lg:px-8
        flex items-center justify-between gap-3
        relative z-30
      "
    >
      {/* LEFT: SIDEBAR TOGGLE + BREADCRUMBS */}
      <div className="flex items-center gap-3 min-w-0 flex-1">

        {/* DESKTOP SIDEBAR TOGGLE */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="
            hidden lg:flex shrink-0
            w-9 h-9 items-center justify-center
            rounded-lg text-slate-500
            hover:text-blue-600 hover:bg-blue-50
            transition-colors
          "
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={sidebarCollapsed}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* MOBILE MENU */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="
            lg:hidden shrink-0
            p-2 rounded-lg
            text-slate-500
            hover:text-slate-900 hover:bg-slate-100
            transition-colors
          "
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* BREADCRUMBS */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 min-w-0 text-[13px]"
        >
          <span className="font-semibold text-slate-800 capitalize whitespace-nowrap">
            {roleLabel}
          </span>

          {breadcrumbItems.slice(1).map((item, index) => {
            const isLast = index === breadcrumbItems.length - 2;

            return (
              <React.Fragment key={item.path}>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

                {isLast ? (
                  <span className="font-semibold text-slate-900 truncate">
                    {item.name}
                  </span>
                ) : (
                  <span className="hidden sm:inline text-slate-500 truncate">
                    {item.name}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* CENTER: PLAN / CREDITS */}
      <div className="hidden md:flex items-center justify-center shrink-0">
        {currentPlan === 'free' ? (
          <div className="
            flex items-center gap-2
            px-3.5 py-2
            bg-amber-50 border border-amber-200
            rounded-lg text-[12px]
          ">
            <span className="font-semibold text-amber-900">
              Free Evaluation
            </span>

            <span className="text-amber-300">•</span>

            <span className="text-amber-800">
              10 Meeting Cap
            </span>

            <Link
              to="/pricing"
              className="text-blue-600 hover:text-blue-700 font-bold ml-1"
            >
              Upgrade
            </Link>
          </div>
        ) : (
          <div className="
            flex items-center gap-2.5
            px-4 py-2
            bg-slate-50 border border-slate-200
            rounded-lg text-[13px]
          ">
            <span className="text-slate-500 font-medium whitespace-nowrap">
              Available AI Credits:
            </span>

            <span className="font-bold text-slate-900 tabular-nums">
              {creditBalance.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* UPLOAD MEETING */}
        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="
              hidden sm:inline-flex
              items-center justify-center gap-2
              px-4 py-2.5
              bg-blue-600 hover:bg-blue-700
              text-white text-[13px] font-semibold
              rounded-xl shadow-sm
              hover:shadow-md transition-all
              whitespace-nowrap
            "
          >
            <Plus className="w-4 h-4" />
            Upload Meeting
          </button>
        )}

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(previous => !previous);
              setShowProfileMenu(false);
            }}
            className="
              relative p-2.5 rounded-lg
              text-slate-500
              hover:text-slate-900 hover:bg-slate-100
              transition-colors
            "
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-[19px] h-[19px]" />

            <span className="
              absolute top-2 right-2
              w-2 h-2 bg-blue-600
              rounded-full ring-2 ring-white
            " />
          </button>

          {showNotifications && (
            <div className="
              absolute right-0 top-full mt-3
              w-[min(340px,calc(100vw-24px))]
              bg-white border border-slate-200
              rounded-xl shadow-xl py-2 z-50
            ">
              <div className="
                px-4 py-3 border-b border-slate-100
                flex items-center justify-between
              ">
                <span className="text-sm font-bold text-slate-900">
                  Recent Notifications
                </span>

                <button
                  type="button"
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="text-[13px] font-semibold text-slate-900">
                    Meeting Analysed: AeroDynamics UK
                  </div>

                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    12 sales cues scored with 78% overall performance.
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2">
                    10 mins ago
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="text-[13px] font-semibold text-slate-900">
                    New Recording Imported
                  </div>

                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    A call was imported from Salesforce, analysed and linked to its deal.
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2">
                    1 hour ago
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(previous => !previous);
              setShowNotifications(false);
            }}
            className="
              flex items-center gap-2.5
              p-1.5 rounded-xl
              hover:bg-slate-100
              transition-colors
            "
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="
              w-9 h-9 rounded-full
              bg-slate-900 text-white
              font-bold text-xs
              flex items-center justify-center
              shadow-sm shrink-0
            ">
              {avatarText}
            </div>

            <span className="hidden sm:block text-[13px] font-semibold text-slate-800 whitespace-nowrap">
              {currentUser.name}
            </span>
          </button>

          {showProfileMenu && (
            <div className="
              absolute right-0 top-full mt-3
              w-[min(260px,calc(100vw-24px))]
              bg-white border border-slate-200
              rounded-xl shadow-xl py-2 z-50
            ">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900">
                  {currentUser.name}
                </div>

                <div className="text-xs text-slate-500 truncate mt-1">
                  {currentUser.email}
                </div>

                <div className="text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-wider">
                  {currentUser.title || roleLabel}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to={settingsPath}
                  onClick={() => setShowProfileMenu(false)}
                  className="
                    px-4 py-2.5 text-[13px]
                    text-slate-700 hover:bg-slate-50
                    flex items-center gap-3
                    font-medium transition-colors
                  "
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account Settings
                </Link>

                <Link
                  to="/pricing"
                  onClick={() => setShowProfileMenu(false)}
                  className="
                    px-4 py-2.5 text-[13px]
                    text-slate-700 hover:bg-slate-50
                    flex items-center gap-3
                    font-medium transition-colors
                  "
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Plans & Billing
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="
                    w-full text-left
                    px-4 py-2.5 text-[13px]
                    text-rose-600 hover:bg-rose-50
                    flex items-center gap-3
                    font-semibold transition-colors
                  "
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
