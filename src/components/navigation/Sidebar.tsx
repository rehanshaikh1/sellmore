
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

import {
  LayoutDashboard,
  Video,
  Database,
  FolderSync,
  HelpCircle,
  GraduationCap,
  Workflow,
  BookOpen,
  FileText,
  BarChart3,
  Building2,
  Bot,
  Dumbbell,
  Headphones,
  Radio,
  Users,
  CreditCard,
  Settings,
  Briefcase,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenUpgradeModal?: (
    featureTitle: string,
    featureDesc: string
  ) => void;
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  lockedOnFree?: boolean;
  /** Only shown once a CRM is connected. */
  crm?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  onOpenUpgradeModal,
  collapsed = false
}) => {
  const { currentRole, currentPlan, currentUser, crmConnected } = useStore();
  const location = useLocation();

  const isFreePlan = currentPlan === 'free';

  const getNavSections = (): NavSection[] => {
    if (currentRole === 'super_admin') {
      return [
        {
          title: 'Platform Management',
          items: [
            { label: 'Platform Dashboard', to: '/platform/dashboard', icon: LayoutDashboard },
            { label: 'Client Tenants', to: '/platform/clients', icon: Building2 },
            { label: 'Plan Catalogue', to: '/platform/plans', icon: Layers },
            { label: 'Default Cues', to: '/platform/cues', icon: FileText },
            { label: 'Integrations & Limits', to: '/platform/integrations', icon: Database },
            { label: 'Usage Telemetry', to: '/platform/analytics', icon: BarChart3 },
            { label: 'Platform Settings', to: '/platform/settings', icon: Settings }
          ]
        }
      ];
    }

    if (currentRole === 'manager') {
      return [
        {
          title: 'Overview',
          items: [
            { label: 'Manager Dashboard', to: '/manager/dashboard', icon: LayoutDashboard }
          ]
        },
        {
          title: 'Assigned Team Scope',
          items: [
            { label: 'Assigned Reps', to: '/manager/team', icon: Users },
            { label: 'Team Deals', to: '/manager/deals', icon: Briefcase, lockedOnFree: true, crm: true },
            { label: 'Meetings & Analysis', to: '/manager/meetings', icon: Video },
            { label: 'Deal Coaching (Manager)', to: '/manager/deal-coaching', icon: GraduationCap, lockedOnFree: true, crm: true }
          ]
        },
        {
          title: 'Analytics',
          items: [
            { label: 'Company Intelligence', to: '/manager/company-intelligence', icon: Building2, crm: true },
            { label: 'Team Analytics', to: '/manager/analytics', icon: BarChart3 }
          ]
        },
        {
          title: 'Practice & AI',
          items: [
            { label: 'Practice & Lessons', to: '/manager/practice', icon: Dumbbell, lockedOnFree: true },
            { label: 'Mock Meetings', to: '/manager/mock-meetings', icon: Headphones, lockedOnFree: true },
            { label: 'AI Chat Assistant', to: '/manager/ai-chat', icon: Bot }
          ]
        },
        {
          title: 'Account',
          items: [
            { label: 'Settings', to: '/manager/settings', icon: Settings }
          ]
        }
      ];
    }

    if (currentRole === 'sales_rep') {
      return [
        {
          title: 'Overview',
          items: [
            { label: 'My Sales Dashboard', to: '/sales/dashboard', icon: LayoutDashboard }
          ]
        },
        {
          title: 'My Sales Pipeline',
          items: [
            { label: 'My Deals', to: '/sales/my-deals', icon: Briefcase, lockedOnFree: true, crm: true },
            { label: 'Deal Workspace', to: '/sales/deals', icon: Briefcase, lockedOnFree: true, crm: true },
            { label: 'Meeting Library', to: '/sales/meetings', icon: Video },
            { label: 'Deal Assistance', to: '/sales/deal-assistance', icon: HelpCircle, lockedOnFree: true, crm: true },
            { label: 'Deal Coaching (Rep)', to: '/sales/deal-coaching', icon: GraduationCap, lockedOnFree: true, crm: true }
          ]
        },
        {
          title: 'Practice & Skills',
          items: [
            { label: 'Practice / Lessons', to: '/sales/practice', icon: Dumbbell, lockedOnFree: true },
            { label: 'Mock Meetings & Roleplay', to: '/sales/mock-meetings', icon: Headphones, lockedOnFree: true },
            { label: 'Live Assist Extension', to: '/sales/live-assist', icon: Radio, lockedOnFree: true }
          ]
        },
        {
          title: 'Intelligence & Performance',
          items: [
            { label: 'AI Chat Assistant', to: '/sales/ai-chat', icon: Bot },
            { label: 'My Performance Analytics', to: '/sales/analytics', icon: BarChart3 },
            { label: 'Settings', to: '/sales/settings', icon: Settings }
          ]
        }
      ];
    }

    // CLIENT ADMIN
    return [
      {
        title: 'Overview',
        items: [
          { label: 'Company Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }
        ]
      },
      {
        title: 'Analyse & Operations',
        items: [
          { label: 'Meeting Analyse / Library', to: '/admin/meetings', icon: Video },
          { label: 'Deal Workspace', to: '/admin/deals', icon: Briefcase, lockedOnFree: true, crm: true },
          { label: 'Deal Assistance', to: '/admin/deal-assistance', icon: HelpCircle, lockedOnFree: true, crm: true },
          { label: 'Deal Coaching', to: '/admin/deal-coaching', icon: GraduationCap, lockedOnFree: true, crm: true },
        ]
      },
      {
        title: 'CRM & Integrations',
        items: [
          { label: 'CRM Integration', to: '/admin/crm', icon: Database, lockedOnFree: true },
          { label: 'Google Drive Sync', to: '/admin/drive', icon: FolderSync, lockedOnFree: true }
        ]
      },
      {
        title: 'Knowledge Base',
        items: [
          { label: 'Knowledge Base', to: '/admin/knowledge-base', icon: BookOpen }
        ]
      },
      {
        title: 'Sales Training',
        items: [
          { label: 'Practice / Lessons', to: '/admin/practice', icon: Dumbbell, lockedOnFree: true },
          { label: 'Mock Meetings', to: '/admin/mock-meetings', icon: Headphones, lockedOnFree: true },
          { label: 'Live Assist Simulator', to: '/admin/live-assist', icon: Radio, lockedOnFree: true }
        ]
      },
      {
        title: 'Analytics',
        items: [
          { label: 'Company Intelligence', to: '/admin/company-intelligence', icon: Building2, crm: true },
          { label: 'Team Analytics', to: '/admin/analytics', icon: BarChart3 }
        ]
      },
      {
        title: 'Administration',
        items: [
          { label: 'Team Management', to: '/admin/team', icon: Users },
          { label: 'Billing & Invoices', to: '/admin/billing', icon: CreditCard },
          { label: 'Company Settings', to: '/admin/settings', icon: Settings }
        ]
      },
      {
        title: 'Configuration',
        items: [
          { label: 'Prompt Management', to: '/admin/prompt-management', icon: FileText },
          { label: 'Company Documents', to: '/admin/company-docs', icon: FileText }
        ]
      }
    ];
  };

  // Salesforce-backed features (deals, coaching, ...) stay hidden until Salesforce is connected.
  const navSections = getNavSections()
    .map(section => ({
      ...section,
      items: section.items.filter(item => crmConnected || !item.crm)
    }))
    .filter(section => section.items.length > 0);

  const getActiveSection = () => {
    return navSections.find(section =>
      section.items.some(item =>
        location.pathname === item.to ||
        location.pathname.startsWith(item.to + '/')
      )
    )?.title || navSections[0]?.title;
  };

  const [openSections, setOpenSections] = useState<string[]>([
    getActiveSection()
  ].filter(Boolean) as string[]);

  // Automatically expand the section containing the active route.
  useEffect(() => {
    const activeSection = getActiveSection();

    if (activeSection) {
      setOpenSections(previous =>
        previous.includes(activeSection)
          ? previous
          : [...previous, activeSection]
      );
    }
  }, [location.pathname, currentRole]);

  const toggleSection = (title: string) => {
    setOpenSections(previous =>
      previous.includes(title)
        ? previous.filter(section => section !== title)
        : [...previous, title]
    );
  };

  const initials = currentUser.name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavItem = (item: NavItem, index: number) => {
    const Icon = item.icon;
    const isLocked = isFreePlan && item.lockedOnFree;

    const itemClasses = `
      w-full min-h-[42px]
      flex items-center
      rounded-lg
      transition-all duration-200
      group
      ${collapsed ? 'justify-center px-2' : 'justify-between px-3'}
    `;

    const iconAndLabel = (
      <div className={`flex items-center min-w-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <Icon className="w-[18px] h-[18px] shrink-0 opacity-85 group-hover:opacity-100" />

        {!collapsed && (
          <span className="text-[13px] font-medium truncate">
            {item.label}
          </span>
        )}
      </div>
    );

    if (isLocked) {
      return (
        <li key={item.to || index}>
          <button
            type="button"
            title={collapsed ? `${item.label} · Upgrade required` : undefined}
            onClick={() =>
              onOpenUpgradeModal?.(
                item.label,
                `${item.label} is locked on the Free Plan. Upgrade to access.`
              )
            }
            className={`
              ${itemClasses}
              text-slate-500
              hover:text-slate-300
              hover:bg-slate-800/70
            `}
          >
            {iconAndLabel}

            {!collapsed && (
              <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0 ml-2" />
            )}
          </button>
        </li>
      );
    }

    return (
      <li key={item.to || index}>
        <NavLink
          to={item.to}
          onClick={onCloseMobile}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) => `
            ${itemClasses}
            ${isActive
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }
          `}
        >
          {iconAndLabel}
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className={`
        h-full min-h-0 shrink-0
        flex flex-col overflow-hidden
        bg-slate-900 text-slate-300
        border-r border-slate-800
        select-none
        transition-[width] duration-300 ease-in-out
        ${collapsed ? 'w-[76px]' : 'w-64'}
      `}
    >
      {/* BRAND */}
      <div className={`
        shrink-0 min-h-[78px]
        flex items-center
        border-b border-slate-800
        ${collapsed ? 'justify-center px-2' : 'px-5'}
      `}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="
            w-10 h-10 shrink-0 rounded-xl
            bg-gradient-to-br from-blue-500 to-blue-700
            text-white flex items-center justify-center
            font-bold text-sm shadow-sm
          ">
            SM
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-bold text-lg leading-tight tracking-tight">
                SellMore
              </div>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5 whitespace-nowrap">
                Sales Intelligence SaaS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE */}
      {!collapsed && (
        <div className="
          shrink-0 px-5 py-3.5
          bg-slate-950/50 border-b border-slate-800
          flex items-center justify-between gap-2
        ">
          <div className="truncate min-w-0">
            <span className="text-slate-500 text-[10px] block mb-1">
              Workspace
            </span>
            <span className="text-slate-200 font-semibold truncate block text-[13px]">
              {currentUser.companyName}
            </span>
          </div>

          <span className={`
            text-[10px] px-2 py-1 rounded-md
            font-bold tracking-wider shrink-0
            ${isFreePlan
              ? 'text-amber-400 bg-amber-950/80 border border-amber-800/60'
              : 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
            }
          `}>
            {currentPlan}
          </span>
        </div>
      )}

      {collapsed && (
        <div className="shrink-0 flex justify-center py-3 border-b border-slate-800">
          <div
            title={`${currentUser.companyName} · ${currentPlan}`}
            className={`
              w-9 h-9 rounded-lg
              flex items-center justify-center
              text-[10px] font-bold
              ${isFreePlan
                ? 'bg-amber-950 text-amber-400'
                : 'bg-emerald-950 text-emerald-400'
              }
            `}
          >
            {currentUser.companyName?.slice(0, 2) || 'WS'}
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <div className="
        flex-1 min-h-0
        overflow-y-auto overflow-x-hidden
        overscroll-contain
        px-3 py-4 space-y-2
        sidebar-scroll
      ">
        {navSections.map((section, sectionIndex) => {
          const isOpen = openSections.includes(section.title);

          const hasActiveItem = section.items.some(item =>
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/')
          );

          return (
            <div key={section.title || sectionIndex}>
              {!collapsed ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isOpen}
                    className={`
                      w-full min-h-[42px]
                      flex items-center justify-between
                      px-3 py-2 rounded-lg
                      transition-all duration-200
                      ${hasActiveItem
                        ? 'bg-slate-800/80 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }
                    `}
                  >
                    <span className="text-[13px] font-semibold tracking-normal text-left">
                      {section.title}
                    </span>

                    <ChevronDown
                      className={`
                        w-4 h-4 shrink-0
                        transition-transform duration-200
                        ${isOpen ? 'rotate-180' : ''}
                      `}
                    />
                  </button>

                  <div className={`
                    grid transition-all duration-200 ease-in-out
                    ${isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                    }
                  `}>
                    <div className="overflow-hidden">
                      <ul className="space-y-1 pt-1">
                        {section.items.map((item, itemIndex) =>
                          renderNavItem(item, itemIndex)
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="mx-auto mb-3 w-7 border-t border-slate-700" />
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) =>
                      renderNavItem(item, itemIndex)
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* USER PROFILE */}
      <div className={`
        shrink-0 p-3
        border-t border-slate-800
        bg-slate-950/70
        ${collapsed ? 'flex justify-center' : ''}
      `}>
        <div className={`
          flex items-center p-2.5 rounded-xl
          bg-slate-900 border border-slate-800
          ${collapsed ? 'justify-center' : 'gap-3'}
        `}>
          <div className="
            w-9 h-9 shrink-0 rounded-full
            bg-slate-800 text-blue-400
            font-bold text-xs
            flex items-center justify-center
            border border-slate-700
          ">
            {currentUser.avatar || initials}
          </div>

          {!collapsed && (
            <div className="truncate flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-400 capitalize truncate mt-0.5">
                {currentUser.title || currentRole.replace('_', ' ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
