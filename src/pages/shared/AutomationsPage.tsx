import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Workflow, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  Sparkles,
  Zap,
  Mail,
  FileText,
  AlertCircle,
  Radio,
  Sliders,
  Send,
  Check,
  PhoneCall,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import { AutomationWorkflow } from '../../types';
import confetti from 'canvas-confetti';

export const AutomationsPage: React.FC = () => {
  const { automations, toggleAutomationStatus, runAutomation } = useStore();

  const [activeBuilderView, setActiveBuilderView] = useState<'templates' | 'builder'>('templates');
  const [templateTab, setTemplateTab] = useState<'All' | 'Summary' | 'Prompt' | 'Email'>('All');
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow>(automations[0]);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Visual builder state (Competitor Page 2)
  const [triggerCategory, setTriggerCategory] = useState<'Real Calls' | 'Meetings' | 'AI Roleplays' | 'Deals' | 'Learning Modules' | 'Time'>('Real Calls');
  const [selectedTriggerEvent, setSelectedTriggerEvent] = useState('After a real call ends - When a rep completes a call');
  const [conditionText, setConditionText] = useState('Economic buyer not identified');
  const [actionText, setActionText] = useState('Alert #deal-alerts (Slack notification)');
  const [isPublished, setIsPublished] = useState(false);

  const handleRun = (id: string) => {
    setRunningId(id);
    setTimeout(() => {
      runAutomation(id);
      setRunningId(null);
      try { confetti({ particleCount: 50, spread: 50 }); } catch (e) {}
    }, 800);
  };

  const handlePublish = () => {
    setIsPublished(true);
    try { confetti({ particleCount: 60, spread: 60 }); } catch (e) {}
    setTimeout(() => setIsPublished(false), 2500);
  };

  const filteredAutomations = automations.filter(a => 
    templateTab === 'All' || a.category === templateTab
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Workflows & Automations</h1>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-mono uppercase">
              Kota / Workflow Builder
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build repeatable trigger &rarr; condition &rarr; prompt &rarr; action workflows across calls, CRM context, and follow-up emails. (PRD Section 10.8)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveBuilderView(activeBuilderView === 'builder' ? 'templates' : 'builder')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            {activeBuilderView === 'builder' ? <FileText className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {activeBuilderView === 'builder' ? 'Browse Template Library' : 'Create Custom Automation'}
          </button>
        </div>
      </div>

      {/* VISUAL WORKFLOW BUILDER (Exact Competitor Page 2) */}
      {activeBuilderView === 'builder' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                Automation Builder
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">New Deal Alert & Follow-Up Automation</h2>
            </div>

            <button
              onClick={handlePublish}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isPublished ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isPublished ? 'Published & Active!' : 'Publish Workflow'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Left Node Flow Canvas (Competitor Page 2) */}
            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Workflow Node Flow
              </span>

              {/* Node 1: START */}
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase">START TRIGGER</span>
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="font-bold text-slate-900 text-sm">After a real call ends</div>
                <p className="text-[11px] text-slate-500">Real Calls trigger · Fires automatically on call finish</p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-400">
                <span className="text-lg">&darr;</span>
              </div>

              {/* Node 2: CONDITION */}
              <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-indigo-800 uppercase">AI CONDITION</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{conditionText}</div>
                <p className="text-[11px] text-slate-500">Authority cue check in meeting transcript</p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-400">
                <span className="text-lg">&darr;</span>
              </div>

              {/* Node 3: ACTION */}
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-800 uppercase">ACTION DISPATCH</span>
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{actionText}</div>
                <p className="text-[11px] text-slate-500">Posts deal context and suggested rep coaching to team</p>
              </div>
            </div>

            {/* Right Trigger Configuration Panel (Competitor Page 2) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Trigger Configuration</h3>
                <p className="text-slate-500 text-xs mt-0.5">Select type and configure filters for this automation.</p>
              </div>

              {/* Trigger Category Selection Grid (Competitor Page 2) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block text-xs">Trigger Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Real Calls', icon: PhoneCall },
                    { id: 'Meetings', icon: Calendar },
                    { id: 'AI Roleplays', icon: Sparkles },
                    { id: 'Deals', icon: FileText },
                    { id: 'Learning Modules', icon: BookOpen },
                    { id: 'Time', icon: Clock }
                  ].map(cat => {
                    const Icon = cat.icon;
                    const isSelected = triggerCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setTriggerCategory(cat.id as any)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-blue-50/80 border-blue-500 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                            {cat.id}
                          </span>
                        </div>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Dropdown */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-xs">Trigger Event</label>
                <select
                  value={selectedTriggerEvent}
                  onChange={e => setSelectedTriggerEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 text-xs focus:outline-hidden"
                >
                  <option value="After a real call ends - When a rep completes a call">After a real call ends — When a rep completes a real call</option>
                  <option value="When deal stage changes - Triggered on CRM sync">When deal stage changes — Triggered on CRM opportunity stage change</option>
                  <option value="When customer objection raised - sales cue detected">When customer objection raised — Unhandled pricing/lead time objection</option>
                </select>
              </div>

              {/* Condition Editor */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-xs">Filter / Condition</label>
                <input
                  type="text"
                  value={conditionText}
                  onChange={e => setConditionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 text-xs focus:outline-hidden"
                />
              </div>

              {/* Action Dispatch */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-xs">Action Dispatch</label>
                <input
                  type="text"
                  value={actionText}
                  onChange={e => setActionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 text-xs focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE LIBRARY (Competitor Page 19) */}
      {activeBuilderView === 'templates' && (
        <div className="space-y-6">
          {/* Subtabs: All | Summary | Prompt | Email (Competitor Page 19) */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
            <div className="flex gap-4 font-semibold">
              {(['All', 'Summary', 'Prompt', 'Email'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTemplateTab(tab)}
                  className={`pb-1 transition-colors ${
                    templateTab === tab ? 'border-b-2 border-slate-900 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab} Workflows
                </button>
              ))}
            </div>

            <span className="font-mono text-slate-400 text-[11px]">
              {filteredAutomations.length} Active Templates
            </span>
          </div>

          {/* Templates Grid (Pre-meeting brief, Deal Summary, Autofill, Forecast) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {filteredAutomations.map(wf => (
              <div
                key={wf.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase">
                      {wf.category}
                    </span>
                    <button
                      onClick={() => toggleAutomationStatus(wf.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono transition-colors ${
                        wf.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {wf.status}
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{wf.name}</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{wf.description}</p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono text-[10px]">
                    <div className="text-slate-500">Trigger: <span className="text-slate-800 font-semibold">{wf.trigger}</span></div>
                    <div className="text-slate-500">Action: <span className="text-blue-700 font-semibold">{wf.action}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Ran {wf.lastRunDate || 'Never'}</span>
                  <button
                    onClick={() => handleRun(wf.id)}
                    disabled={runningId === wf.id}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Play className={`w-3 h-3 ${runningId === wf.id ? 'animate-spin' : 'fill-current'}`} />
                    {runningId === wf.id ? 'Running...' : 'Run Test'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
