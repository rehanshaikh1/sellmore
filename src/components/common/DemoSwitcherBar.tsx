import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole, PlanTier } from '../../types';
import { Users, Shield, RotateCcw, Check, Sparkles, ChevronDown, Award } from 'lucide-react';
import { AuditCoverageModal } from './AuditCoverageModal';

export const DemoSwitcherBar: React.FC = () => {
  const { currentRole, currentPlan, switchRole, setPlan, resetAllData, currentUser, creditBalance, freeMeetingQuota, meetings, teamMembers, switchUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    if (role === 'client_admin') {
      navigate('/admin/dashboard');
    } else if (role === 'manager') {
      navigate('/manager/dashboard');
    } else if (role === 'sales_rep') {
      navigate('/sales/dashboard');
    } else if (role === 'super_admin') {
      navigate('/platform/dashboard');
    }
  };

  const handlePlanToggle = (plan: PlanTier) => {
    setPlan(plan);
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-3 right-3 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition-all"
        >
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>Demo Controls ({currentRole.replace('_', ' ')})</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
        {/* Left: Role Switching */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Switch Role:
          </span>
          <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700/80">
            <button
              onClick={() => handleRoleChange('client_admin')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${currentRole === 'client_admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Client Admin
            </button>
            <button
              onClick={() => handleRoleChange('manager')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${currentRole === 'manager'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Manager
            </button>
            <button
              onClick={() => handleRoleChange('sales_rep')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${currentRole === 'sales_rep'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Sales Rep
            </button>
            <button
              onClick={() => handleRoleChange('super_admin')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${currentRole === 'super_admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* Act as a specific manager / rep (to test team scoping) */}
        {(currentRole === 'manager' || currentRole === 'sales_rep') && teamMembers.some(m => m.role === currentRole) && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium shrink-0">Acting as:</span>
            <select
              value={currentUser.id}
              onChange={e => switchUser(e.target.value)}
              aria-label="Act as team member"
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100"
            >
              {!teamMembers.some(m => m.id === currentUser.id) && <option value={currentUser.id}>{currentUser.name}</option>}
              {teamMembers.filter(m => m.role === currentRole).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Middle: Plan Toggle & Usage */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium shrink-0">Plan:</span>
          <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700/80">
            <button
              onClick={() => handlePlanToggle('free')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${currentPlan === 'free'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Free Plan (10 Meeting Cap)
            </button>
            <button
              onClick={() => handlePlanToggle('growth')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${currentPlan === 'growth'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
            >
              Growth Plan (Full Access)
            </button>
          </div>

          {currentPlan === 'free' ? (
            <span className="font-mono text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
              Usage: {meetings.length}/{freeMeetingQuota} meetings
            </span>
          ) : (
            <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              Credits: {creditBalance}
            </span>
          )}
        </div>

        {/* Right: Traceability Audit & Reset */}
        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded text-xs font-medium transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>PRD Audit Matrix</span>
          </button> */}

          <button
            onClick={() => resetAllData()}
            title="Reset to default mock dataset"
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="text-slate-500 hover:text-slate-300 p-1 rounded"
            title="Minimize demo bar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AuditCoverageModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </>
  );
};
