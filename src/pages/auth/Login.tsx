import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { UserRole } from '../../types';
import { ArrowRight, Lock, Mail, Shield, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, onboardingComplete } = useStore();

  const [email, setEmail] = useState('sarah.lin@apexengineering.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client_admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = (role: UserRole) => {
    login(role);
    if (role === 'client_admin') navigate(onboardingComplete ? '/admin/dashboard' : '/connect');
    else if (role === 'manager') navigate('/manager/dashboard');
    else if (role === 'sales_rep') navigate('/sales/dashboard');
    else if (role === 'super_admin') navigate('/platform/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      handleQuickLogin(selectedRole);
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to SellMore</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sales intelligence, meeting cue analysis, and team enablement
            </p>
          </div>

          {/* Quick Persona Picker for Evaluation */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Demo One-Click Persona Login
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('client_admin')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-blue-500 rounded-lg transition-colors shadow-2xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-blue-600">Sarah Lin</div>
                <div className="text-[10px] text-slate-400">Client Admin (Company)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-blue-500 rounded-lg transition-colors shadow-2xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-blue-600">David Miller</div>
                <div className="text-[10px] text-slate-400">Sales Manager (Team)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sales_rep')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-blue-500 rounded-lg transition-colors shadow-2xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-blue-600">Marcus Vance</div>
                <div className="text-[10px] text-slate-400">Sales Rep (Individual)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('super_admin')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-purple-500 rounded-lg transition-colors shadow-2xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-purple-600">Alexander Chen</div>
                <div className="text-[10px] text-slate-400">Super Admin (Platform)</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Recovery TBD</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tenant Target Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="client_admin">Client Admin (Company Operations)</option>
                <option value="manager">Manager (Assigned Team Pipeline)</option>
                <option value="sales_rep">Sales Representative (Personal Leads & Calls)</option>
                <option value="super_admin">Platform Super Admin (Cross-Tenant)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Start Free (10 Meetings)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
