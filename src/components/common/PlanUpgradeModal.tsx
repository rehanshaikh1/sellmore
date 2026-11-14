import React from 'react';
import { X, Lock, Check, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  featureTitle = 'Enterprise Sales Feature Locked',
  featureDescription = 'This module requires a paid subscription plan.'
}) => {
  const navigate = useNavigate();
  const { setPlan } = useStore();

  if (!isOpen) return null;

  const handleInstantUpgrade = () => {
    setPlan('growth');
    onClose();
  };

  const handleGoToPricing = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Lock className="w-5 h-5" />
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">{featureTitle}</h3>
            <p className="text-sm text-slate-600 mt-1">{featureDescription}</p>
          </div>

          <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Unlocked on Growth Plan ($249/mo):
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Unlimited Meeting Analysis & Global Library (removes 10-cap)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Salesforce V1 CRM integration & Google Drive sync</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Live Assist real-time in-meeting Chrome extension</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Interactive Practice with timed prompts & Mock Roleplay AI</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>500 monthly AI Credits + custom QA prompt editing</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleInstantUpgrade}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Zap className="w-4 h-4" />
              Instant Upgrade to Growth (Demo)
            </button>
            <button
              onClick={handleGoToPricing}
              className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors"
            >
              Compare Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
