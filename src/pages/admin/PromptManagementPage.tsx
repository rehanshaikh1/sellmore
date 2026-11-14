
import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Search, Plus, Pencil, Trash2, Copy, X, Save,
    MessageSquareText, Filter, RotateCcw, CheckCircle2,
    AlertCircle, Download, Upload
} from 'lucide-react';

import { useStore } from '../../store/useStore';
import { CUE_CATEGORIES, getEffectiveCues } from '../../lib/cues';
import { CueInput, EffectiveCue } from '../../types';

/** One row in the list: a cue as this audience sees it, with its position among the platform defaults. */
type CueRow = EffectiveCue & { cueNumber: number | null };

const categories = CUE_CATEGORIES;

const buildMarkdownTemplate = (items: CueRow[]) => {
    const header = [
        '# SellMore QA Cue Prompts',
        '',
        '> Downloaded from SellMore Prompt Management. Edit the cues below, then upload this file.',
        '> Keep the headings and metadata labels unchanged so SellMore can read the file.',
        ''
    ];

    const sections = items.map(prompt => [
        `## Cue: ${prompt.cueName}`,
        `Category: ${prompt.category}`,
        `Description: ${prompt.description || ''}`,
        `Enabled: ${prompt.enabled ? 'true' : 'false'}`,
        '',
        '### AI Evaluation Instructions',
        '```text',
        prompt.instructions || 'Write the AI evaluation instructions here.',
        '```',
        ''
    ].join('\n'));

    return [...header, ...sections].join('\n');
};

const parseMarkdownPrompts = (markdown: string): CueInput[] => {
    const sections = markdown.split(/^## Cue:\s*/m).slice(1);

    return sections.map(section => {
        const lines = section.split(/\r?\n/);
        const cueName = (lines[0] || '').trim();
        const category = section.match(/^Category:\s*(.*)$/m)?.[1]?.trim() || 'Custom';
        const description = section.match(/^Description:\s*(.*)$/m)?.[1]?.trim() || '';
        const enabledValue = section.match(/^Enabled:\s*(true|false)\s*$/im)?.[1]?.toLowerCase();
        const instructionMatch = section.match(/### AI Evaluation Instructions\s*\n```(?:text)?\s*\n([\s\S]*?)\n```/i);
        const instructions = instructionMatch?.[1]?.trim() || '';

        if (!cueName || !instructions) return null;

        return {
            cueName,
            category: categories.includes(category) ? category : 'Custom',
            description,
            instructions,
            enabled: enabledValue !== 'false'
        };
    }).filter((prompt): prompt is NonNullable<typeof prompt> => prompt !== null);
};

const emptyPrompt = {
    cueName: '',
    category: 'Custom',
    description: '',
    instructions: '',
    enabled: true
};

/**
 * Cue prompt management, in two modes.
 *   platform: the super admin edits the default cues that apply to every business.
 *   company:  the client admin sees those defaults, can replace any of them for their own
 *             business, switch them off, reset them, and add cues only their business uses.
 */
export const PromptManagementPage: React.FC<{ mode?: 'company' | 'platform' }> = ({ mode = 'company' }) => {
    const {
        currentRole, platformCues, companyCues,
        addPlatformCue, updatePlatformCue, deletePlatformCue, resetPlatformCues,
        saveCompanyCue, deleteCompanyCue, resetCompanyCue, resetAllCompanyCues
    } = useStore();
    const isPlatform = mode === 'platform';

    const prompts: CueRow[] = useMemo(() => {
        const order = new Map(platformCues.map((cue, index) => [cue.id, index + 1]));
        const list: EffectiveCue[] = isPlatform
            ? platformCues.map(cue => ({ ...cue, origin: 'default' as const, platformId: cue.id }))
            : getEffectiveCues(platformCues, companyCues);
        return list.map(cue => ({
            ...cue,
            cueNumber: cue.platformId ? order.get(cue.platformId) ?? null : null
        }));
    }, [isPlatform, platformCues, companyCues]);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<CueRow | null>(null);
    const [formData, setFormData] = useState(emptyPrompt);

    const [deleteTarget, setDeleteTarget] = useState<CueRow | null>(null);
    const [notification, setNotification] = useState('');
    const markdownInputRef = React.useRef<HTMLInputElement>(null);

    const filteredPrompts = useMemo(() => {
        return prompts.filter(prompt => {
            const searchMatch = [
                prompt.cueName,
                prompt.description,
                prompt.instructions,
                prompt.category
            ].join(' ').toLowerCase().includes(search.toLowerCase());

            const categoryMatch =
                categoryFilter === 'All' ||
                prompt.category === categoryFilter;

            const statusMatch =
                statusFilter === 'All' ||
                (statusFilter === 'Enabled' && prompt.enabled) ||
                (statusFilter === 'Disabled' && !prompt.enabled);

            return searchMatch && categoryMatch && statusMatch;
        });
    }, [prompts, search, categoryFilter, statusFilter]);

    const enabledCount = prompts.filter(p => p.enabled).length;
    const defaultCount = prompts.filter(p => p.origin === 'default').length;
    const changedCount = prompts.filter(p => p.origin !== 'default').length;
    const categoryCount = new Set(prompts.map(p => p.category)).size;

    const showNotification = (message: string) => {
        setNotification(message);
        window.setTimeout(() => setNotification(''), 3000);
    };

    const report = (result: { success: boolean; error?: string }, okMessage: string) => {
        showNotification(result.success ? okMessage : result.error || 'Something went wrong.');
        return result.success;
    };

    /** Save one cue for the current audience: a platform default, or this business's version of it. */
    const saveFor = (input: CueInput, target?: CueRow | null) => {
        if (isPlatform) {
            return target ? updatePlatformCue(target.id, input) : addPlatformCue(input);
        }
        return saveCompanyCue({
            ...input,
            id: target?.origin === 'custom' ? target.id : undefined,
            platformId: target && target.origin !== 'custom' ? target.platformId : undefined
        });
    };

    const openCreateModal = () => {
        setEditingPrompt(null);
        setFormData({ ...emptyPrompt });
        setModalOpen(true);
    };

    const openEditModal = (prompt: CueRow) => {
        setEditingPrompt(prompt);

        setFormData({
            cueName: prompt.cueName,
            category: prompt.category,
            description: prompt.description,
            instructions: prompt.instructions,
            enabled: prompt.enabled
        });

        setModalOpen(true);
    };

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.cueName.trim() || !formData.instructions.trim()) {
            showNotification('Cue name and AI instructions are required.');
            return;
        }

        const result = saveFor(formData, editingPrompt);
        const okMessage = !editingPrompt
            ? (isPlatform ? 'Default cue added. It now applies to every business.' : 'Custom cue created.')
            : isPlatform
                ? 'Default cue updated.'
                : editingPrompt.origin === 'default'
                    ? 'Saved. Your business now uses its own version of this cue.'
                    : 'Cue updated.';

        if (report(result, okMessage)) setModalOpen(false);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        const result = isPlatform ? deletePlatformCue(deleteTarget.id) : deleteCompanyCue(deleteTarget.id);
        report(result, isPlatform ? 'Default cue deleted.' : 'Cue deleted.');
        setDeleteTarget(null);
    };

    const toggleStatus = (prompt: CueRow) => {
        const next = !prompt.enabled;
        const result = saveFor({
            cueName: prompt.cueName,
            category: prompt.category,
            description: prompt.description,
            instructions: prompt.instructions,
            enabled: next
        }, prompt);

        report(result, next ? 'Cue enabled.' : 'Cue disabled.');
    };

    const resetToDefault = (prompt: CueRow) => {
        if (!prompt.platformId) return;
        resetCompanyCue(prompt.platformId);
        showNotification('Reset. The platform default applies again.');
    };

    const copyPrompt = async (prompt: CueRow) => {
        try {
            await navigator.clipboard.writeText(prompt.instructions);
            showNotification('AI instructions copied.');
        } catch {
            showNotification('Unable to copy instructions.');
        }
    };

    const resetFilters = () => {
        setSearch('');
        setCategoryFilter('All');
        setStatusFilter('All');
    };

    const downloadMarkdownSample = () => {
        const markdown = buildMarkdownTemplate(prompts);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'sellmore-qa-cue-prompts-sample.md';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        showNotification('Markdown sample downloaded.');
    };

    const importMarkdownFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (!file.name.toLowerCase().endsWith('.md')) {
                showNotification('Please upload a Markdown (.md) file.');
                return;
            }

            const markdown = await file.text();
            const imported = parseMarkdownPrompts(markdown);

            if (!imported.length) {
                showNotification('No valid cues found. Use the downloaded sample format.');
                return;
            }

            // Merge by cue name: a matching cue is updated (for a business, that means its own version
            // of a default), anything else is added.
            let saved = 0;
            imported.forEach(item => {
                const existing = prompts.find(p => p.cueName.trim().toLowerCase() === item.cueName.trim().toLowerCase());
                if (saveFor(item, existing).success) saved++;
            });
            showNotification(`${saved} cue(s) imported from Markdown.`);
        } catch {
            showNotification('Unable to read this Markdown file.');
        } finally {
            event.target.value = '';
        }
    };

    const restoreDefaults = () => {
        if (isPlatform) {
            if (!window.confirm(
                'Restore the original 12 default cues? This replaces the current platform defaults, including any you added.'
            )) return;
            resetPlatformCues();
            showNotification('Original 12 default cues restored.');
            return;
        }

        if (!window.confirm(
            'Remove all your changes to platform default cues? Your own custom cues are kept.'
        )) return;
        resetAllCompanyCues();
        showNotification('Platform defaults apply again.');
    };

    if (isPlatform ? currentRole !== 'super_admin' : currentRole !== 'client_admin') {
        return <Navigate to={isPlatform ? '/platform/dashboard' : '/admin/dashboard'} replace />;
    }

    return (
        <div className="min-h-full bg-slate-50 p-5 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <span>{isPlatform ? 'Platform' : 'Configuration'}</span>
                        <span>/</span>
                        <span className="text-blue-600 font-medium">{isPlatform ? 'Default Cues' : 'Prompt Management'}</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {isPlatform ? 'Default Sales Cues' : 'Cue Prompt Management'}
                    </h1>

                    <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                        {isPlatform
                            ? 'Add, edit or delete the default sales evaluation cues. They apply to every business unless that business replaces a cue with its own version.'
                            : 'These are the sales evaluation cues your business uses. Platform defaults apply automatically; edit one to use your own version, or add cues only your business needs.'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        ref={markdownInputRef}
                        type="file"
                        accept=".md,text/markdown"
                        className="hidden"
                        onChange={importMarkdownFile}
                    />
                    <button
                        onClick={downloadMarkdownSample}
                        className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold"
                    >
                        <Download size={16} />
                        Download Sample .md
                    </button>
                    <button
                        onClick={() => markdownInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold"
                    >
                        <Upload size={16} />
                        Upload .md
                    </button>
                    <button
                        onClick={restoreDefaults}
                        className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold"
                    >
                        <RotateCcw size={16} />
                        {isPlatform ? 'Restore Original 12' : 'Reset to Platform Defaults'}
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm"
                    >
                        <Plus size={18} />
                        {isPlatform ? 'Add Default Cue' : 'Add Custom Cue'}
                    </button>
                </div>
            </div>

            {/* INFORMATION */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-7">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">
                        {isPlatform ? 'Platform default cues' : 'Platform defaults and your changes'}
                    </p>
                    <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        {isPlatform
                            ? 'A change here reaches every business that has not replaced that cue. A business that already has its own version keeps it. Deleting a default removes it for businesses that never changed it.'
                            : 'Cues marked "Platform default" are managed by SellMore and update automatically. When you edit or disable one, your business keeps its own version until you reset it. Custom cues exist only for your business.'}
                    </p>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                <SummaryCard label={isPlatform ? 'Default Cues' : 'Total Cues'} value={prompts.length} color="blue" />
                {isPlatform ? (
                    <>
                        <SummaryCard label="Enabled" value={enabledCount} color="green" />
                        <SummaryCard label="Disabled" value={prompts.length - enabledCount} color="amber" />
                        <SummaryCard label="Categories" value={categoryCount} color="purple" />
                    </>
                ) : (
                    <>
                        <SummaryCard label="Platform Defaults" value={defaultCount} color="purple" />
                        <SummaryCard label="Changed or Custom" value={changedCount} color="amber" />
                        <SummaryCard label="Enabled Cues" value={enabledCount} color="green" />
                    </>
                )}
            </div>

            {/* FILTERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex flex-col xl:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search cue name or evaluation instructions..."
                        className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="h-11 pl-9 pr-8 w-full sm:w-52 border border-slate-200 rounded-xl text-sm bg-white"
                        >
                            <option value="All">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-11 px-3 w-full sm:w-40 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                        <option value="All">All Status</option>
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                    </select>

                    <button
                        onClick={resetFilters}
                        className="h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={15} />
                        Reset
                    </button>
                </div>
            </div>

            {/* CUE LIST */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-bold text-slate-900">Sales Evaluation Cues</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {filteredPrompts.length} cue(s) displayed
                        </p>
                    </div>

                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                        {isPlatform ? 'Applies to all businesses' : 'Defaults + your changes'}
                    </span>
                </div>

                {filteredPrompts.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <MessageSquareText size={30} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="font-semibold text-slate-900">No matching cues</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredPrompts.map(prompt => (
                            <div key={prompt.id} className="p-5 hover:bg-slate-50/70 transition">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

                                    <div className="flex gap-3 min-w-0 flex-1">
                                        <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {prompt.cueNumber ?? '＋'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">
                                                    {prompt.cueName}
                                                </h3>

                                                <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                                                    {prompt.category}
                                                </span>

                                                {!isPlatform && prompt.origin === 'default' && (
                                                    <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                                                        Platform default
                                                    </span>
                                                )}
                                                {!isPlatform && prompt.origin === 'customised' && (
                                                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md">
                                                        Your version
                                                    </span>
                                                )}
                                                {!isPlatform && prompt.origin === 'custom' && (
                                                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                                                        Custom
                                                    </span>
                                                )}

                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${prompt.enabled
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {prompt.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-500 mt-2">
                                                {prompt.description}
                                            </p>

                                            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                                    AI Evaluation Instructions
                                                </p>
                                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                    {prompt.instructions}
                                                </p>
                                            </div>

                                            <p className="text-[11px] text-slate-400 mt-3">
                                                Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        <button onClick={() => copyPrompt(prompt)} className="action-button">
                                            <Copy size={15} /> Copy
                                        </button>

                                        <button onClick={() => toggleStatus(prompt)} className="action-button">
                                            {prompt.enabled ? 'Disable' : 'Enable'}
                                        </button>

                                        <button onClick={() => openEditModal(prompt)} className="action-button text-blue-600">
                                            <Pencil size={15} /> Edit
                                        </button>

                                        {!isPlatform && prompt.origin === 'customised' && (
                                            <button onClick={() => resetToDefault(prompt)} className="action-button">
                                                <RotateCcw size={15} /> Reset to default
                                            </button>
                                        )}

                                        {(isPlatform || prompt.origin === 'custom') && (
                                            <button onClick={() => setDeleteTarget(prompt)} className="action-button text-red-600">
                                                <Trash2 size={15} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {editingPrompt ? 'Edit Cue Prompt' : isPlatform ? 'Add Default Cue' : 'Create Custom Cue'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {!isPlatform && editingPrompt?.origin === 'default'
                                        ? 'Saving gives your business its own version of this platform default.'
                                        : 'Configure how AI evaluates this sales behavior.'}
                                </p>
                            </div>

                            <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <FormField label="Cue Name" required>
                                <input
                                    required
                                    value={formData.cueName}
                                    onChange={e => setFormData({ ...formData, cueName: e.target.value })}
                                    placeholder="Enter sales cue name"
                                    className="form-input"
                                />
                            </FormField>

                            <FormField label="Cue Category" required>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="form-input"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Description">
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what this cue evaluates..."
                                    className="form-input resize-y"
                                />
                            </FormField>

                            <FormField label="AI Evaluation Instructions" required>
                                <textarea
                                    required
                                    rows={9}
                                    value={formData.instructions}
                                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                    placeholder="Enter detailed instructions for the AI..."
                                    className="form-input resize-y font-mono text-xs leading-relaxed"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    These instructions define what the AI should evaluate for this cue.
                                </p>
                            </FormField>

                            <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Enable this cue</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Keep this cue active in the configuration.
                                    </p>
                                </div>
                            </label>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">
                                    Cancel
                                </button>

                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2">
                                    <Save size={16} />
                                    {editingPrompt ? 'Save Changes' : 'Create Cue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[60] bg-slate-950/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                            <Trash2 size={21} />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">Delete Cue?</h3>

                        <p className="text-sm text-slate-500 mt-2">
                            Delete <strong>{deleteTarget.cueName}</strong>?
                            {isPlatform
                                ? ' Businesses that never changed it will stop using it. Businesses with their own version keep that version as a custom cue.'
                                : ''}
                            {' '}This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
                                Delete Cue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICATION */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-[70] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    {notification}
                </div>
            )}

            <style>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 13px;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          background: white;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          transition: background 0.2s;
        }

        .action-button:hover {
          background: #f8fafc;
        }
      `}</style>
        </div>
    );
};

const SummaryCard = ({
    label,
    value,
    color
}: {
    label: string;
    value: number;
    color: 'blue' | 'purple' | 'amber' | 'green';
}) => {
    const styles = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
        green: 'bg-emerald-50 text-emerald-600'
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">{label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles[color]}`}>
                    <MessageSquareText size={19} />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">{value}</div>
        </div>
    );
};

const FormField = ({
    label,
    required,
    children
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);
