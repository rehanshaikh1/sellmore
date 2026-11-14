import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  User, 
  UserRole, 
  PlanTier, 
  TeamMember, 
  MeetingRecord, 
  DealRecord, 
  DealCoachingProgram, 
  CoachingLesson,
  CuePrompt,
  CueInput,
  AutomationWorkflow, 
  KnowledgeSource, 
  MockMeetingHistoryItem, 
  CreditTransaction, 
  CompanyDocument 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_TEAM_MEMBERS, 
  INITIAL_MEETINGS, 
  INITIAL_DEALS, 
  INITIAL_COACHING_PROGRAMS, 
  INITIAL_AUTOMATIONS, 
  INITIAL_KNOWLEDGE_SOURCES, 
  INITIAL_COMPANY_DOCUMENTS, 
  INITIAL_MOCK_MEETINGS, 
  INITIAL_CREDIT_TRANSACTIONS, 
  INITIAL_INVOICES,
  SAMPLE_CUES_MET1 
} from '../data/mockData';
import {
  SALESFORCE_ACTIVITIES,
  SALESFORCE_OPPORTUNITIES,
  SalesforceOpportunity,
  SALESFORCE_ORG_NAME,
  SALESFORCE_SOURCE_DETAIL,
  mapSalesforceStage,
  resolveSalesforceOwner
} from '../lib/salesforce';
import { getDealMeetings } from '../lib/deals';
import { buildMockAnalysis, withMockAnalysis } from '../data/mockAnalysis';
import { createDefaultPlatformCues } from '../lib/cues';
import { PRACTICE_INSTRUCTION, practiceScenarioFor } from '../lib/coachingPractice';

// Groups of mock data that start empty and are loaded on demand via a "Populate" button.
export type DataKey =
  | 'team'
  | 'meetings'
  | 'deals'
  | 'automations'
  | 'knowledge'
  | 'documents'
  | 'mockMeetings'
  | 'coaching'
  | 'billing';

export const ALL_DATA_KEYS: DataKey[] = [
  'team', 'meetings', 'deals', 'automations',
  'knowledge', 'documents', 'mockMeetings', 'coaching', 'billing'
];

const EMPTY_POPULATED = ALL_DATA_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as Record<DataKey, boolean>
);

// The team (managers + their reps) is the backbone every page filters on, so it is
// predefined from the start. All other data groups begin empty until populated.
const DEFAULT_POPULATED: Record<DataKey, boolean> = { ...EMPTY_POPULATED, team: true };

export type SyncInterval = 'manual' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';
export const SYNC_INTERVAL_OPTIONS: { value: SyncInterval; label: string }[] = [
  { value: 'manual', label: 'Manual only' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '30m', label: 'Every 30 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '24h', label: 'Once a day' }
];
export const syncIntervalLabel = (v: SyncInterval) => SYNC_INTERVAL_OPTIONS.find(o => o.value === v)?.label ?? v;

const SYNC_POOL = {
  drive: ['Northwind Components — Customer Discovery Call', 'Brightline Aerospace — Product Demo Session', 'Cobalt Medical — Onboarding Kickoff']
};

interface AppState {
  // Current session
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  populated: Record<DataKey, boolean>;
  currentUser: User;
  currentRole: UserRole;
  currentPlan: PlanTier;
  creditBalance: number;
  freeMeetingQuota: number;

  // Integrations state
  crmConnected: boolean;
  crmOrgName: string;
  crmSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  crmLastSync: string;
  /** What the last Salesforce sync did, in plain words. */
  crmLastSyncResult: string;
  crmSyncInterval: SyncInterval;
  driveConnected: boolean;
  driveSelectedFolder: string;
  driveSyncStatus: 'idle' | 'retrieving' | 'synced';
  driveLastSync: string;
  driveSyncInterval: SyncInterval;

  // Core entities
  teamMembers: TeamMember[];
  meetings: MeetingRecord[];
  deals: DealRecord[];
  /** One coaching programme per deal, keyed by deal id. */
  coachingPrograms: Record<string, DealCoachingProgram>;
  /** Default sales cue prompts, managed by the super admin. They apply to every business. */
  platformCues: CuePrompt[];
  /** This business's own cues: replacements for platform defaults, and custom cues. */
  companyCues: CuePrompt[];
  automations: AutomationWorkflow[];
  knowledgeSources: KnowledgeSource[];
  companyDocuments: CompanyDocument[];
  mockMeetings: MockMeetingHistoryItem[];
  creditTransactions: CreditTransaction[];

  // Session & Demo Actions
  login: (role: UserRole) => void;
  logout: () => void;
  completeOnboarding: () => void;
  populate: (keys: DataKey[]) => void;
  switchRole: (role: UserRole) => void;
  /** Demo: act as a specific team member (e.g. Manager A vs Manager B). */
  switchUser: (memberId: string) => void;
  setPlan: (plan: PlanTier) => void;
  resetAllData: () => void;

  // Team Actions
  inviteTeamMember: (name: string, email: string, role: 'manager' | 'sales_rep', managerId?: string) => { success: boolean; error?: string };
  /** Client Admin only. Assign / reassign a sales rep to a manager, or pass null to unassign. */
  assignManager: (repId: string, managerId: string | null) => { success: boolean; error?: string };
  toggleMemberStatus: (memberId: string) => void;
  resendInvite: (memberId: string) => void;

  // Meeting Actions
  uploadMeeting: (name: string, repId: string, repName: string, format?: 'MP4' | 'MP3' | 'TXT', dealId?: string) => { success: boolean; error?: string; meetingId?: string };
  deleteMeeting: (meetingId: string) => void;
  retryMeetingAnalysis: (meetingId: string) => void;
  associateMeetingToDeal: (meetingId: string, dealId: string) => void;

  // Deal Actions (deals are read-only copies of Salesforce Opportunities; only drafts are created here)
  /** For a call with no Opportunity yet: create a SellMore-only draft deal and link the call to it. */
  createDraftDeal: (meetingId: string, dealName: string, companyName: string) => { success: boolean; error?: string; dealId?: string };

  // Coaching Actions (per deal)
  generateCoachingProgram: (dealId: string) => { success: boolean; error?: string };
  /** Add lessons for analysed calls that arrived after the programme was built. */
  refreshCoachingProgram: (dealId: string) => { success: boolean; error?: string; added?: number };
  toggleLessonCompleted: (dealId: string, lessonId: string) => void;
  addManagerFeedback: (dealId: string, lessonId: string, feedback: string) => void;
  /** Save one typed practice reply and its score on a lesson. */
  addPracticeAttempt: (dealId: string, lessonId: string, response: string, score: number) => void;

  // Cue prompt actions. Platform defaults: super admin only. Company cues: client admin only.
  addPlatformCue: (input: CueInput) => { success: boolean; error?: string };
  updatePlatformCue: (id: string, input: Partial<CueInput>) => { success: boolean; error?: string };
  deletePlatformCue: (id: string) => { success: boolean; error?: string };
  resetPlatformCues: () => void;
  /** Create or update a company cue. With `platformId` it replaces that platform default for this business. */
  saveCompanyCue: (input: CueInput & { id?: string; platformId?: string }) => { success: boolean; error?: string };
  deleteCompanyCue: (id: string) => { success: boolean; error?: string };
  /** Drop this business's replacement of a platform default, so the default applies again. */
  resetCompanyCue: (platformId: string) => void;
  /** Drop every replacement of a platform default. Company custom cues are kept. */
  resetAllCompanyCues: () => void;

  // Automation Actions
  toggleAutomationStatus: (id: string) => void;
  runAutomation: (id: string) => void;

  // Knowledge & Doc Actions
  addKnowledgeSource: (name: string, type: KnowledgeSource['type'], sizeOrUrl: string, qaTag?: string) => void;
  toggleSourceConsidered: (id: string) => void;
  addCompanyDocument: (name: string, size: string, taggedAssessment: string) => void;
  toggleDocumentConsidered: (id: string) => void;

  // Mock Meeting Actions
  addMockMeetingRecord: (item: MockMeetingHistoryItem) => void;
  rescoreMockMeeting: (id: string) => void;

  // Billing Actions
  topUpCredits: (amount: number, cost: number) => void;
  consumeCredits: (amount: number, activity: string) => boolean;

  // CRM & Drive Actions
  connectSalesforce: () => void;
  disconnectSalesforce: () => void;
  triggerCRMSync: () => void;
  setSyncInterval: (source: 'crm' | 'drive', interval: SyncInterval) => void;
  /** Manual sync: pulls any new recordings from the connected source into the Meeting Library. */
  syncSource: (source: 'crm' | 'drive') => void;
  connectDrive: (folderName: string) => void;
  disconnectDrive: () => void;
}

/**
 * A deal cannot exist without meeting history. Drops every deal that has no meeting left,
 * together with its coaching programme.
 */
const pruneEmptyDeals = (
  deals: DealRecord[],
  meetings: MeetingRecord[],
  programs: Record<string, DealCoachingProgram>
) => {
  const kept = deals.filter(d => getDealMeetings(d, meetings).length > 0);
  const keptIds = new Set(kept.map(d => d.id));
  return {
    deals: kept,
    coachingPrograms: Object.fromEntries(Object.entries(programs).filter(([id]) => keptIds.has(id)))
  };
};

interface CoachingEvidence {
  text: string;
  call: string;
  meetingId: string;
  suggestion?: string;
  /** The buyer's objection, when the evidence is an unresolved objection. */
  objection?: string;
}

/** What the rep struggled with, and the objections that were not resolved, across a deal's analysed calls. */
const collectCoachingEvidence = (analysed: MeetingRecord[]): CoachingEvidence[] => {
  const evidence: CoachingEvidence[] = [];
  analysed.forEach(m => {
    (m.whereRepStruggled || []).forEach(text => evidence.push({ text, call: m.name, meetingId: m.id }));
    (m.objections || [])
      .filter(o => o.status !== 'Resolved')
      .forEach(o => evidence.push({
        text: `Handle the objection: ${o.objection}`,
        call: m.name,
        meetingId: m.id,
        suggestion: o.strongerResponseSuggestion,
        objection: o.objection
      }));
  });
  return evidence.filter((e, i) => evidence.findIndex(x => x.text === e.text) === i);
};

const buildCoachingLessons = (deal: DealRecord, evidence: CoachingEvidence[], firstOrder: number): CoachingLesson[] =>
  evidence.map((e, i) => ({
    id: `lsn_${deal.id}_${firstOrder + i}`,
    title: e.text.length > 80 ? `${e.text.slice(0, 77)}...` : e.text,
    order: firstOrder + i,
    objective: `Improve this before the next conversation with ${deal.companyName}: ${e.text}`,
    relevanceToDeal: `Found in "${e.call}" on ${deal.name} (${deal.stage}).`,
    evidenceSourceCall: e.call,
    evidenceMeetingId: e.meetingId,
    tailoredExplanation: e.suggestion
      ? e.suggestion
      : 'Review this moment in the call report, agree what a stronger approach looks like, and rehearse it before the next meeting.',
    recommendedTalkTrack: e.suggestion
      ? [e.suggestion]
      : ["Restate the buyer's concern in your own words, then propose one specific next step with an owner and a date."],
    practiceActivity: 'Write your reply to the situation below, then check it against the criteria.',
    practiceScenario: e.objection
      ? `${deal.companyName} says: "${e.objection}"`
      : `You are on a call with ${deal.companyName} (${deal.stage}). Write what you would say to address this: ${e.text}`,
    expectedOutcome: 'A clear, confident response on this point in the next buyer conversation.',
    completed: false
  }));

const analysedCallsOf = (deal: DealRecord, meetings: MeetingRecord[]) =>
  getDealMeetings(deal, meetings).filter(m => m.processingStatus === 'Analysed');

type StoreGet = () => AppState;
type StoreSet = (partial: Partial<AppState>) => void;

/**
 * One read-only Salesforce pull (mock). A sync imports the next two call recordings that have not
 * been imported yet. Each recording is linked to its Opportunity's deal:
 *
 *  - SellMore already has that deal  -> the call joins its meeting history
 *  - SellMore does not have it yet   -> the deal is created from the Opportunity (Contact Roles
 *    become stakeholders), or merged into a draft deal for the same account so its calls are kept
 *  - the Activity has no Opportunity -> the call is marked "No deal linked"
 *
 * A deal is therefore only ever created together with a meeting: it never exists without history.
 * Deals are matched by Opportunity id and recordings by Activity id, so repeating a sync never
 * duplicates anything.
 */
const syncSalesforce = (get: StoreGet, set: StoreSet) => {
  const { meetings, deals, teamMembers, currentUser } = get();
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const today = new Date().toISOString().split('T')[0];

  let nextDeals = deals.map(d => d.source === 'crm' ? { ...d, crmLastSyncedAt: stamp } : d);
  let nextMeetings = [...meetings];
  const createdDeals: string[] = [];
  const mergedDrafts: string[] = [];
  const importedCalls: string[] = [];

  /** Bring one Opportunity in: create its deal, or merge it into a draft deal for the same account. */
  const importOpportunity = (opp: SalesforceOpportunity): DealRecord => {
    const owner = resolveSalesforceOwner(opp.ownerCrmId, teamMembers);
    const stage = mapSalesforceStage(opp.rawStage);
    const stakeholders = opp.contactRoles.map((c, i) => ({
      id: `stk_sf_${opp.id}_${i}`,
      name: c.name,
      role: c.role,
      company: opp.accountName,
      sentiment: c.sentiment,
      lastSpoke: 'Not yet'
    }));
    const event = {
      id: `tl_sf_${opp.id}`,
      date: today,
      type: 'stage_change' as const,
      title: 'Opportunity synced from Salesforce',
      description: `${opp.name} · ${opp.rawStage}`,
      author: 'Salesforce'
    };

    const draft = nextDeals.find(d => d.source === 'draft' && d.companyName.toLowerCase() === opp.accountName.toLowerCase());
    if (draft) {
      const merged: DealRecord = {
        ...draft,
        name: opp.name,
        crmId: opp.id,
        crmSystem: 'salesforce',
        source: 'crm',
        rawStage: opp.rawStage,
        ownerCrmId: opp.ownerCrmId,
        stage,
        amount: opp.amount,
        closeDate: opp.closeDate,
        ownerId: owner?.id ?? draft.ownerId,
        ownerName: owner?.name ?? draft.ownerName,
        crmLastSyncedAt: stamp,
        stakeholders: draft.stakeholders.length ? draft.stakeholders : stakeholders,
        timeline: [{ ...event, title: 'Matched to Salesforce Opportunity' }, ...draft.timeline]
      };
      nextDeals = nextDeals.map(d => d.id === draft.id ? merged : d);
      mergedDrafts.push(`"${draft.name}" matched to "${opp.name}"`);
      return merged;
    }

    const created: DealRecord = {
      id: opp.dealId ?? `deal_sf_${opp.id}`,
      name: opp.name,
      companyName: opp.accountName,
      stage,
      crmId: opp.id,
      crmSystem: 'salesforce',
      source: 'crm',
      rawStage: opp.rawStage,
      ownerCrmId: opp.ownerCrmId,
      crmLastSyncedAt: stamp,
      amount: opp.amount,
      ownerId: owner?.id ?? currentUser.id,
      ownerName: owner?.name ?? currentUser.name,
      closeDate: opp.closeDate,
      lastMeetingDate: '',
      timeInStage: `${opp.daysInStage} days`,
      callCount: 0,
      emailCount: 0,
      risks: [],
      stakeholders,
      timeline: [event]
    };
    nextDeals = [...nextDeals, created];
    createdDeals.push(opp.name);
    return created;
  };

  const batch = SALESFORCE_ACTIVITIES
    .filter(a => !nextMeetings.some(m => m.crmActivityId === a.id))
    .slice(0, 2);

  batch.forEach(activity => {
    let deal: DealRecord | undefined = activity.opportunityId
      ? nextDeals.find(d => d.crmId === activity.opportunityId)
      : undefined;
    if (!deal && activity.opportunityId) {
      const opp = SALESFORCE_OPPORTUNITIES.find(o => o.id === activity.opportunityId);
      if (opp) deal = importOpportunity(opp);
    }

    const owner = resolveSalesforceOwner(activity.ownerCrmId, teamMembers);
    const meetingName = `${activity.accountName} — ${activity.name}`;
    const meetingId = `met_sf_${activity.id}`;
    const analysis = buildMockAnalysis({
      seed: meetingId,
      repName: owner?.name ?? deal?.ownerName ?? currentUser.name,
      accountName: activity.accountName,
      buyerName: deal?.stakeholders[0]?.name,
      durationSeconds: activity.durationMinutes * 60 + 12
    });
    const meeting: MeetingRecord = {
      id: meetingId,
      name: meetingName,
      representativeId: owner?.id ?? deal?.ownerId ?? currentUser.id,
      representativeName: owner?.name ?? deal?.ownerName ?? currentUser.name,
      uploadDate: 'Just now',
      duration: `${activity.durationMinutes}m 12s`,
      processingStatus: 'Analysed',
      associatedDealId: deal?.id,
      associatedDealName: deal?.name,
      source: 'crm',
      sourceDetail: SALESFORCE_SOURCE_DETAIL,
      crmActivityId: activity.id,
      crmOpportunityId: activity.opportunityId ?? undefined,
      fileFormat: 'MP4',
      fileSize: '96 MB',
      ...analysis
    };
    nextMeetings = [meeting, ...nextMeetings];

    if (deal) {
      const target = deal;
      nextDeals = nextDeals.map(d => d.id === target.id ? {
        ...d,
        callCount: d.callCount + 1,
        lastMeetingDate: today,
        timeline: [
          {
            id: `tl_${meetingId}`,
            date: today,
            type: 'meeting' as const,
            title: meetingName,
            description: 'Call recording imported from Salesforce.',
            meetingId,
            author: 'Salesforce'
          },
          ...d.timeline
        ]
      } : d);
      importedCalls.push(`"${meetingName}" linked to "${deal.name}"`);
    } else {
      importedCalls.push(`"${meetingName}" has no Opportunity, so it is marked No deal linked`);
    }
  });

  // What the admin sees on the CRM page.
  const parts: string[] = [];
  if (createdDeals.length) {
    parts.push(`Created ${createdDeals.length} deal${createdDeals.length === 1 ? '' : 's'} from Salesforce Opportunities: ${createdDeals.join(', ')}.`);
  }
  if (mergedDrafts.length) parts.push(`Merged draft deals: ${mergedDrafts.join('; ')}. Their calls were kept.`);
  if (importedCalls.length) {
    parts.push(`Imported ${importedCalls.length} recording${importedCalls.length === 1 ? '' : 's'}: ${importedCalls.join('; ')}.`);
  }

  set({
    meetings: nextMeetings,
    deals: nextDeals,
    crmSyncStatus: 'synced',
    crmLastSync: 'Just now',
    crmLastSyncResult: parts.length ? parts.join(' ') : 'Already up to date. No new recordings in Salesforce.'
  });
};

export const useStore = create<AppState>()(persist((set, get) => ({
  isAuthenticated: false,
  onboardingComplete: false,
  populated: { ...DEFAULT_POPULATED },
  currentUser: INITIAL_USERS.client_admin,
  currentRole: 'client_admin',
  currentPlan: 'growth', // default to Growth so full feature set is immediately exploreable, with instant 1-click toggle to Free Plan
  creditBalance: 355,
  freeMeetingQuota: 10,

  crmConnected: false,
  crmOrgName: '',
  crmSyncStatus: 'idle',
  crmLastSync: '',
  crmLastSyncResult: '',
  crmSyncInterval: '1h',

  driveConnected: false,
  driveSelectedFolder: '',
  driveSyncStatus: 'idle',
  driveLastSync: '',
  driveSyncInterval: '1h',

  teamMembers: INITIAL_TEAM_MEMBERS,
  meetings: [],
  deals: [],
  coachingPrograms: {},
  platformCues: createDefaultPlatformCues(),
  companyCues: [],
  automations: [],
  knowledgeSources: [],
  companyDocuments: [],
  mockMeetings: [],
  creditTransactions: [],

  login: (role: UserRole) => {
    set({
      isAuthenticated: true,
      currentRole: role,
      currentUser: INITIAL_USERS[role] || INITIAL_USERS.client_admin
    });
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
  },

  populate: (requested: DataKey[]) => {
    const { crmConnected } = get();
    // A deal cannot exist without meeting history, so sample deals always come with their meetings.
    const keys: DataKey[] = requested.includes('deals') && !requested.includes('meetings')
      ? [...requested, 'meetings']
      : requested;
    const patch: Partial<AppState> = {};
    const populated = { ...get().populated };

    keys.forEach(key => {
      populated[key] = true;
      switch (key) {
        case 'team': patch.teamMembers = INITIAL_TEAM_MEMBERS; break;
        case 'meetings': {
          // Without a CRM there are no deals to associate meetings with.
          // Keep meetings imported or uploaded after the sample set was loaded.
          const sampleIds = new Set(INITIAL_MEETINGS.map(m => m.id));
          const kept = get().meetings.filter(m => !sampleIds.has(m.id));
          patch.meetings = [...kept, ...INITIAL_MEETINGS.map(m => {
            const next = { ...m };
            if (!crmConnected) { next.associatedDealId = undefined; next.associatedDealName = undefined; }
            if ((m.source === 'crm' && !crmConnected) || (m.source === 'drive' && !get().driveConnected)) {
              next.source = 'upload'; next.sourceDetail = undefined;
            }
            return next;
          })];
          break;
        }
        case 'deals': {
          // Keep deals created after the sample set was loaded (synced Opportunities, drafts).
          const sampleIds = new Set(INITIAL_DEALS.map(d => d.id));
          patch.deals = [...get().deals.filter(d => !sampleIds.has(d.id)), ...INITIAL_DEALS];
          break;
        }
        case 'automations': patch.automations = INITIAL_AUTOMATIONS; break;
        case 'knowledge': patch.knowledgeSources = INITIAL_KNOWLEDGE_SOURCES; break;
        case 'documents': patch.companyDocuments = INITIAL_COMPANY_DOCUMENTS; break;
        case 'mockMeetings': patch.mockMeetings = INITIAL_MOCK_MEETINGS; break;
        case 'coaching': patch.coachingPrograms = { ...INITIAL_COACHING_PROGRAMS, ...get().coachingPrograms }; break;
        case 'billing': patch.creditTransactions = INITIAL_CREDIT_TRANSACTIONS; break;
      }
    });

    set({ ...patch, populated });
  },

  switchRole: (role: UserRole) => {
    const user = INITIAL_USERS[role] || INITIAL_USERS.client_admin;
    set({
      currentRole: role,
      currentUser: user
    });
  },

  switchUser: (memberId: string) => {
    const { teamMembers } = get();
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    const base = INITIAL_USERS[member.role] || INITIAL_USERS.client_admin;
    set({
      currentRole: member.role,
      currentUser: {
        ...base,
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
        title: INITIAL_USERS[member.role]?.id === member.id ? base.title : (member.role === 'manager' ? 'Sales Manager' : 'Sales Representative')
      }
    });
  },

  assignManager: (repId: string, managerId: string | null) => {
    const { teamMembers, currentRole } = get();
    if (currentRole !== 'client_admin') {
      return { success: false, error: 'Only a Client Admin can assign sales representatives to managers.' };
    }
    const rep = teamMembers.find(m => m.id === repId);
    if (!rep || rep.role !== 'sales_rep') {
      return { success: false, error: 'Only sales representatives can be assigned to a manager.' };
    }
    if (managerId !== null) {
      const manager = teamMembers.find(m => m.id === managerId);
      if (!manager || manager.role !== 'manager') {
        return { success: false, error: 'Please choose a valid manager from this workspace.' };
      }
      if (manager.status !== 'active') {
        return { success: false, error: 'Inactive managers cannot be assigned new representatives.' };
      }
    }
    set({
      teamMembers: teamMembers.map(m =>
        m.id === repId ? { ...m, managerId: managerId ?? undefined } : m
      )
    });
    return { success: true };
  },

  setPlan: (plan: PlanTier) => {
    set({ currentPlan: plan });
  },

  resetAllData: () => {
    set({
      onboardingComplete: false,
      populated: { ...DEFAULT_POPULATED },
      currentPlan: 'growth',
      creditBalance: 355,
      crmConnected: false,
      crmOrgName: '',
      crmSyncStatus: 'idle',
      crmLastSync: '',
      crmLastSyncResult: '',
      crmSyncInterval: '1h',
      driveConnected: false,
      driveSelectedFolder: '',
      driveSyncStatus: 'idle',
      driveLastSync: '',
      driveSyncInterval: '1h',
      teamMembers: INITIAL_TEAM_MEMBERS,
      meetings: [],
      deals: [],
      coachingPrograms: {},
      platformCues: createDefaultPlatformCues(),
      companyCues: [],
      automations: [],
      knowledgeSources: [],
      companyDocuments: [],
      mockMeetings: [],
      creditTransactions: []
    });
  },

  inviteTeamMember: (name: string, email: string, role: 'manager' | 'sales_rep', managerId?: string) => {
    const { teamMembers, currentPlan, currentRole } = get();
    // Client Admin may invite anyone. A Manager may only invite sales reps, who
    // are always assigned to that manager (never to someone else).
    if (currentRole !== 'client_admin' && currentRole !== 'manager') {
      return { success: false, error: 'You do not have permission to invite team members.' };
    }
    if (currentRole === 'manager') {
      if (role !== 'sales_rep') {
        return { success: false, error: 'Managers can only invite sales representatives.' };
      }
      managerId = get().currentUser.id;
    }
    if (managerId && !teamMembers.some(m => m.id === managerId && m.role === 'manager')) {
      return { success: false, error: 'The selected manager does not exist in this workspace.' };
    }
    // In Free Plan, seat limit is configured to 5
    const seatLimit = currentPlan === 'free' ? 5 : 25;
    const activeSeats = teamMembers.filter(m => m.status === 'active' || m.invitationStatus === 'pending').length;

    if (activeSeats >= seatLimit) {
      return { success: false, error: `Seat limit of ${seatLimit} reached on your current plan. Please upgrade to add more team members.` };
    }

    if (teamMembers.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'A user with this business email already exists in your workspace.' };
    }

    const newMember: TeamMember = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      status: 'inactive',
      invitationStatus: 'pending',
      dateJoined: new Date().toISOString().split('T')[0],
      managerId: role === 'sales_rep' ? managerId : undefined,
      dealsCount: 0,
      meetingsCount: 0
    };

    set({ teamMembers: [newMember, ...teamMembers] });
    return { success: true };
  },

  toggleMemberStatus: (memberId: string) => {
    set(state => ({
      teamMembers: state.teamMembers.map(m => {
        if (m.id === memberId) {
          const nextStatus = m.status === 'active' ? 'inactive' : 'active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    }));
  },

  resendInvite: (memberId: string) => {
    set(state => ({
      teamMembers: state.teamMembers.map(m => {
        if (m.id === memberId) {
          return { ...m, invitationStatus: 'pending' };
        }
        return m;
      })
    }));
  },

  uploadMeeting: (name: string, repId: string, repName: string, format = 'MP4', dealId?: string) => {
    const { meetings, currentPlan, freeMeetingQuota, consumeCredits, deals } = get();

    // Check Free Plan 10-meeting cap
    if (currentPlan === 'free' && meetings.length >= freeMeetingQuota) {
      return {
        success: false,
        error: `Free Plan limit of ${freeMeetingQuota} meetings reached. Upgrade to a paid plan or delete an existing recording to release a slot.`
      };
    }

    // On Paid, consume 15 credits
    if (currentPlan !== 'free') {
      consumeCredits(15, `Meeting Analysis (${name})`);
    }

    const newMeetingId = `met_${Date.now()}`;
    const newMeeting: MeetingRecord = {
      id: newMeetingId,
      name,
      representativeId: repId,
      representativeName: repName,
      uploadDate: 'Just now',
      duration: '32m 45s',
      processingStatus: 'Processing',
      source: 'upload',
      fileFormat: format,
      fileSize: '142 MB',
      ...buildMockAnalysis({
        seed: newMeetingId,
        repName,
        accountName: (dealId && deals.find(d => d.id === dealId)?.companyName) || name.split(' — ')[0],
        buyerName: dealId ? deals.find(d => d.id === dealId)?.stakeholders[0]?.name : undefined,
        durationSeconds: 32 * 60 + 45
      })
    };

    set({ meetings: [newMeeting, ...meetings] });
    if (dealId && deals.some(d => d.id === dealId)) get().associateMeetingToDeal(newMeetingId, dealId);

    // Simulate completion after 3 seconds
    setTimeout(() => {
      set(state => ({
        meetings: state.meetings.map(m => m.id === newMeetingId ? { ...m, processingStatus: 'Analysed' } : m)
      }));
    }, 3500);

    return { success: true, meetingId: newMeetingId };
  },

  deleteMeeting: (meetingId: string) => {
    set(state => {
      const remaining = state.meetings.filter(m => m.id !== meetingId);
      return { meetings: remaining, ...pruneEmptyDeals(state.deals, remaining, state.coachingPrograms) };
    });
  },

  retryMeetingAnalysis: (meetingId: string) => {
    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, processingStatus: 'Processing' } : m)
    }));
    setTimeout(() => {
      set(state => ({
        meetings: state.meetings.map(m => m.id === meetingId
          ? withMockAnalysis({ ...m, processingStatus: 'Analysed', overallScorePercent: undefined, cues: [] })
          : m)
      }));
    }, 2500);
  },

  associateMeetingToDeal: (meetingId: string, dealId: string) => {
    const { deals, meetings, currentUser } = get();
    const deal = deals.find(d => d.id === dealId);
    const meeting = meetings.find(m => m.id === meetingId);
    if (!deal || !meeting || meeting.associatedDealId === dealId) return;

    const previousDealId = meeting.associatedDealId;
    const today = new Date().toISOString().split('T')[0];

    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? {
        ...m,
        associatedDealId: dealId,
        associatedDealName: deal.name
      } : m),
      deals: state.deals.map(d => {
        // Moving a call off another deal takes it out of that deal's history.
        if (d.id === previousDealId) {
          return {
            ...d,
            callCount: Math.max(0, d.callCount - 1),
            timeline: d.timeline.filter(t => t.meetingId !== meetingId)
          };
        }
        if (d.id === dealId) {
          return {
            ...d,
            callCount: d.callCount + 1,
            lastMeetingDate: today,
            timeline: [
              {
                id: `tl_${Date.now()}`,
                date: today,
                type: 'meeting' as const,
                title: meeting.name,
                description: 'Call recording linked to this deal.',
                meetingId,
                author: currentUser.name
              },
              ...d.timeline
            ]
          };
        }
        return d;
      })
    }));
    // The deal the call moved away from may now have no meeting history.
    set(state => pruneEmptyDeals(state.deals, state.meetings, state.coachingPrograms));
  },

  createDraftDeal: (meetingId: string, dealName: string, companyName: string) => {
    const { meetings, deals } = get();
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return { success: false, error: 'Meeting not found.' };
    if (meeting.associatedDealId) return { success: false, error: 'This call is already linked to a deal.' };
    if (!dealName.trim() || !companyName.trim()) return { success: false, error: 'Enter a deal name and a company.' };

    const dealId = `deal_draft_${Date.now()}`;
    const draft: DealRecord = {
      id: dealId,
      name: dealName.trim(),
      companyName: companyName.trim(),
      stage: 'Discovery',
      source: 'draft',
      amount: 0,
      ownerId: meeting.representativeId,
      ownerName: meeting.representativeName,
      closeDate: '',
      lastMeetingDate: new Date().toISOString().split('T')[0],
      timeInStage: '0 days',
      callCount: 0,
      emailCount: 0,
      risks: [],
      stakeholders: [],
      timeline: []
    };
    set({ deals: [draft, ...deals] });
    get().associateMeetingToDeal(meetingId, dealId);
    return { success: true, dealId };
  },

  generateCoachingProgram: (dealId: string) => {
    const { deals, meetings, coachingPrograms } = get();
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return { success: false, error: 'Deal not found.' };
    if (coachingPrograms[dealId]) return { success: false, error: 'This deal already has a coaching programme.' };

    const analysed = analysedCallsOf(deal, meetings);
    if (analysed.length === 0) {
      return { success: false, error: 'Coaching is built from analysed calls. Link at least one analysed call to this deal first.' };
    }

    const evidence = collectCoachingEvidence(analysed).slice(0, 4);
    if (evidence.length === 0) {
      return { success: false, error: 'The analysed calls on this deal show nothing to coach on yet.' };
    }

    set({
      coachingPrograms: {
        ...coachingPrograms,
        [dealId]: {
          dealId,
          dealName: deal.name,
          representativeId: deal.ownerId,
          representativeName: deal.ownerName,
          status: 'Ready to Start',
          progressPercentage: 0,
          updatedAt: new Date().toISOString().split('T')[0],
          sourceMeetingIds: analysed.map(m => m.id),
          lessons: buildCoachingLessons(deal, evidence, 1)
        }
      }
    });
    return { success: true };
  },

  refreshCoachingProgram: (dealId: string) => {
    const { deals, meetings, coachingPrograms } = get();
    const deal = deals.find(d => d.id === dealId);
    const program = coachingPrograms[dealId];
    if (!deal || !program) return { success: false, error: 'This deal has no coaching programme to update.' };

    const known = new Set(program.sourceMeetingIds ?? []);
    const newCalls = analysedCallsOf(deal, meetings).filter(m => !known.has(m.id));
    if (newCalls.length === 0) return { success: false, error: 'There are no new analysed calls on this deal.' };

    // Only points the programme does not already cover become lessons.
    const covered = (e: CoachingEvidence) =>
      program.lessons.some(l => l.objective.includes(e.text) || l.title === e.text);
    const fresh = collectCoachingEvidence(newCalls).filter(e => !covered(e)).slice(0, 3);
    const lessons = [...program.lessons, ...buildCoachingLessons(deal, fresh, program.lessons.length + 1)];
    const completed = lessons.filter(l => l.completed).length;
    const progressPercentage = Math.round((completed / lessons.length) * 100);

    set({
      coachingPrograms: {
        ...coachingPrograms,
        [dealId]: {
          ...program,
          lessons,
          progressPercentage,
          status: progressPercentage === 100 ? 'Completed' : progressPercentage === 0 ? 'Ready to Start' : 'In Progress',
          updatedAt: new Date().toISOString().split('T')[0],
          sourceMeetingIds: [...known, ...newCalls.map(m => m.id)]
        }
      }
    });
    return { success: true, added: fresh.length };
  },

  toggleLessonCompleted: (dealId: string, lessonId: string) => {
    set(state => {
      const program = state.coachingPrograms[dealId];
      if (!program) return {};
      const lessons = program.lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l);
      const completedCount = lessons.filter(l => l.completed).length;
      const progressPercentage = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
      return {
        coachingPrograms: {
          ...state.coachingPrograms,
          [dealId]: {
            ...program,
            lessons,
            progressPercentage,
            status: progressPercentage === 100 ? 'Completed' : progressPercentage === 0 ? 'Ready to Start' : 'In Progress'
          }
        }
      };
    });
  },

  addManagerFeedback: (dealId: string, lessonId: string, feedback: string) => {
    const { currentUser } = get();
    const today = new Date().toISOString().split('T')[0];
    set(state => {
      const program = state.coachingPrograms[dealId];
      if (!program) return {};
      return {
        coachingPrograms: {
          ...state.coachingPrograms,
          [dealId]: {
            ...program,
            lessons: program.lessons.map(l => l.id === lessonId
              ? { ...l, managerFeedback: feedback, managerFeedbackBy: currentUser.name, managerFeedbackAt: today }
              : l)
          }
        }
      };
    });
  },

  addPracticeAttempt: (dealId: string, lessonId: string, response: string, score: number) => {
    const attempt = {
      id: `att_${Date.now()}`,
      response,
      score,
      createdAt: new Date().toISOString()
    };
    set(state => {
      const program = state.coachingPrograms[dealId];
      if (!program) return {};
      return {
        coachingPrograms: {
          ...state.coachingPrograms,
          [dealId]: {
            ...program,
            lessons: program.lessons.map(l => l.id === lessonId
              ? { ...l, practiceAttempts: [...(l.practiceAttempts ?? []), attempt].slice(-10) }
              : l)
          }
        }
      };
    });
  },

  addPlatformCue: (input: CueInput) => {
    if (get().currentRole !== 'super_admin') return { success: false, error: 'Only a Super Admin can change platform default cues.' };
    if (!input.cueName.trim() || !input.instructions.trim()) return { success: false, error: 'Cue name and AI instructions are required.' };
    const cue: CuePrompt = {
      id: `platform-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cueName: input.cueName.trim(),
      category: input.category,
      description: input.description,
      instructions: input.instructions,
      enabled: input.enabled,
      updatedAt: new Date().toISOString()
    };
    set({ platformCues: [...get().platformCues, cue] });
    return { success: true };
  },

  updatePlatformCue: (id: string, input: Partial<CueInput>) => {
    if (get().currentRole !== 'super_admin') return { success: false, error: 'Only a Super Admin can change platform default cues.' };
    if (input.cueName !== undefined && !input.cueName.trim()) return { success: false, error: 'Cue name is required.' };
    if (input.instructions !== undefined && !input.instructions.trim()) return { success: false, error: 'AI instructions are required.' };
    set({
      platformCues: get().platformCues.map(c => c.id === id
        ? { ...c, ...input, cueName: input.cueName !== undefined ? input.cueName.trim() : c.cueName, updatedAt: new Date().toISOString() }
        : c)
    });
    return { success: true };
  },

  deletePlatformCue: (id: string) => {
    if (get().currentRole !== 'super_admin') return { success: false, error: 'Only a Super Admin can change platform default cues.' };
    set({ platformCues: get().platformCues.filter(c => c.id !== id) });
    return { success: true };
  },

  resetPlatformCues: () => {
    if (get().currentRole !== 'super_admin') return;
    set({ platformCues: createDefaultPlatformCues() });
  },

  saveCompanyCue: (input) => {
    if (get().currentRole !== 'client_admin') return { success: false, error: 'Only a Client Admin can change company cues.' };
    if (!input.cueName.trim() || !input.instructions.trim()) return { success: false, error: 'Cue name and AI instructions are required.' };
    const { companyCues } = get();
    const fields = {
      cueName: input.cueName.trim(),
      category: input.category,
      description: input.description,
      instructions: input.instructions,
      enabled: input.enabled,
      updatedAt: new Date().toISOString()
    };
    const newId = () => `company-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (input.platformId) {
      const existing = companyCues.find(c => c.overridesId === input.platformId);
      set({
        companyCues: existing
          ? companyCues.map(c => c.id === existing.id ? { ...c, ...fields } : c)
          : [...companyCues, { id: newId(), overridesId: input.platformId, ...fields }]
      });
    } else if (input.id) {
      set({ companyCues: companyCues.map(c => c.id === input.id ? { ...c, ...fields } : c) });
    } else {
      set({ companyCues: [...companyCues, { id: newId(), ...fields }] });
    }
    return { success: true };
  },

  deleteCompanyCue: (id: string) => {
    if (get().currentRole !== 'client_admin') return { success: false, error: 'Only a Client Admin can change company cues.' };
    set({ companyCues: get().companyCues.filter(c => c.id !== id) });
    return { success: true };
  },

  resetCompanyCue: (platformId: string) => {
    if (get().currentRole !== 'client_admin') return;
    set({ companyCues: get().companyCues.filter(c => c.overridesId !== platformId) });
  },

  resetAllCompanyCues: () => {
    if (get().currentRole !== 'client_admin') return;
    set({ companyCues: get().companyCues.filter(c => !c.overridesId) });
  },

  toggleAutomationStatus: (id: string) => {
    set(state => ({
      automations: state.automations.map(a => a.id === id ? {
        ...a,
        status: a.status === 'Active' ? 'Paused' : 'Active'
      } : a)
    }));
  },

  runAutomation: (id: string) => {
    set(state => ({
      automations: state.automations.map(a => a.id === id ? {
        ...a,
        runsCount: a.runsCount + 1,
        lastRunDate: 'Just now'
      } : a)
    }));
  },

  addKnowledgeSource: (name: string, type: KnowledgeSource['type'], sizeOrUrl: string, qaTag = 'Product Knowledge QA') => {
    const newSource: KnowledgeSource = {
      id: `ks_${Date.now()}`,
      name,
      type,
      sizeOrUrl,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'Indexed',
      qaAssessmentTag: qaTag,
      consideredForQA: true,
      queriesCount: 0
    };
    set(state => ({ knowledgeSources: [newSource, ...state.knowledgeSources] }));
  },

  toggleSourceConsidered: (id: string) => {
    set(state => ({
      knowledgeSources: state.knowledgeSources.map(s => s.id === id ? { ...s, consideredForQA: !s.consideredForQA } : s)
    }));
  },

  addCompanyDocument: (name: string, size: string, taggedAssessment: string) => {
    const newDoc: CompanyDocument = {
      id: `doc_${Date.now()}`,
      name,
      size,
      uploadDate: new Date().toISOString().split('T')[0],
      taggedAssessment,
      considered: true,
      status: 'Ready'
    };
    set(state => ({ companyDocuments: [newDoc, ...state.companyDocuments] }));
  },

  toggleDocumentConsidered: (id: string) => {
    set(state => ({
      companyDocuments: state.companyDocuments.map(d => d.id === id ? { ...d, considered: !d.considered } : d)
    }));
  },

  addMockMeetingRecord: (item: MockMeetingHistoryItem) => {
    set(state => ({
      mockMeetings: [item, ...state.mockMeetings]
    }));
  },

  rescoreMockMeeting: (id: string) => {
    set(state => ({
      mockMeetings: state.mockMeetings.map(m => m.id === id ? { ...m, rescoreStatus: 'processing' } : m)
    }));

    setTimeout(() => {
      set(state => ({
        mockMeetings: state.mockMeetings.map(m => m.id === id ? {
          ...m,
          rescoreStatus: 'rescored',
          score: Math.min(100, m.score + 5),
          whatWentWell: [...m.whatWentWell, 'Rescored with revised GD&T precision tolerances.'],
          summary: `${m.summary} [Rescored with updated Rubric v1.2: +5 pts]`
        } : m)
      }));
    }, 2000);
  },

  topUpCredits: (amount: number, cost: number) => {
    set(state => ({
      creditBalance: state.creditBalance + amount,
      creditTransactions: [
        {
          id: `ctx_${Date.now()}`,
          activity: `Manual Credit Top-Up (+${amount.toLocaleString()} AI Credits)`,
          date: new Date().toISOString().split('T')[0],
          creditsConsumed: -amount,
          remainingBalance: state.creditBalance + amount
        },
        ...state.creditTransactions
      ]
    }));
  },

  consumeCredits: (amount: number, activity: string) => {
    const { creditBalance, creditTransactions } = get();
    if (creditBalance < amount) return false;

    set({
      creditBalance: creditBalance - amount,
      creditTransactions: [
        {
          id: `ctx_${Date.now()}`,
          activity,
          date: new Date().toISOString().split('T')[0],
          creditsConsumed: amount,
          remainingBalance: creditBalance - amount
        },
        ...creditTransactions
      ]
    });
    return true;
  },

  connectSalesforce: () => {
    set({
      crmConnected: true,
      crmOrgName: SALESFORCE_ORG_NAME,
      crmSyncStatus: 'synced',
      crmLastSync: 'Just now',
      crmLastSyncResult: 'Connected. Click Sync now to import recordings and the deals they belong to.'
    });
  },

  disconnectSalesforce: () => {
    set({
      crmConnected: false,
      crmSyncStatus: 'idle'
    });
  },

  triggerCRMSync: () => {
    get().syncSource('crm');
  },

  setSyncInterval: (source, interval) => {
    if (source === 'crm') set({ crmSyncInterval: interval });
    else set({ driveSyncInterval: interval });
  },

  syncSource: (source) => {
    const state = get();
    if (source === 'crm' ? !state.crmConnected : !state.driveConnected) return;
    if (source === 'crm' ? state.crmSyncStatus === 'syncing' : state.driveSyncStatus === 'retrieving') return;
    set(source === 'crm' ? { crmSyncStatus: 'syncing' } : { driveSyncStatus: 'retrieving' });

    setTimeout(() => {
      if (source === 'crm') {
        syncSalesforce(get, set);
        return;
      }
      const { meetings, currentUser, driveSelectedFolder } = get();
      const fetched = meetings.filter(m => m.id.startsWith('met_sync_drive_')).length;
      const pool = SYNC_POOL.drive;
      const driveId = `met_sync_drive_${Date.now()}`;
      const driveName = pool[fetched % pool.length];
      const driveAnalysis = buildMockAnalysis({
        seed: driveId,
        repName: currentUser.name,
        accountName: driveName.split(' — ')[0],
        durationSeconds: (20 + (fetched % 5) * 6) * 60 + 12
      });
      const newMeeting: MeetingRecord = {
        id: driveId,
        name: driveName,
        representativeId: currentUser.id,
        representativeName: currentUser.name,
        uploadDate: 'Just now',
        duration: `${20 + (fetched % 5) * 6}m 12s`,
        processingStatus: 'Analysed',
        source: 'drive',
        sourceDetail: driveSelectedFolder,
        fileFormat: 'MP3',
        fileSize: '96 MB',
        ...driveAnalysis
      };
      set({ meetings: [newMeeting, ...meetings], driveSyncStatus: 'synced', driveLastSync: 'Just now' });
    }, 1800);
  },

  connectDrive: (folderName: string) => {
    set({
      driveConnected: true,
      driveSelectedFolder: folderName,
      driveSyncStatus: 'synced'
    });
  },

  disconnectDrive: () => {
    set({
      driveConnected: false,
      driveSelectedFolder: '',
      driveSyncStatus: 'idle'
    });
  }
}), {
  name: 'sellmore-session',
  version: 6,
  // v1 stored the manager link as `assignedManagerId`; v2 uses `managerId`.
  // v3: tasks removed, coaching is per deal, deals carry Salesforce ids.
  migrate: (persisted: any, version: number) => {
    if (persisted && Array.isArray(persisted.teamMembers)) {
      persisted.teamMembers = persisted.teamMembers.map((m: any) => {
        const { assignedManagerId, ...rest } = m;
        return { ...rest, managerId: rest.managerId ?? assignedManagerId };
      });
    }
    if (persisted && version < 6 && persisted.coachingPrograms) {
      // v6: practice is typed inside each lesson. Lessons saved earlier carried "AI roleplay" wording
      // and no situation, so give them the standard instruction and a situation.
      const sampleLessons: Record<string, any> = {};
      Object.values(INITIAL_COACHING_PROGRAMS).forEach(p => p.lessons.forEach(l => { sampleLessons[l.id] = l; }));
      Object.values(persisted.coachingPrograms).forEach((program: any) => {
        program.lessons = (program.lessons || []).map((l: any) => ({
          ...l,
          practiceActivity: PRACTICE_INSTRUCTION,
          practiceScenario: l.practiceScenario ?? sampleLessons[l.id]?.practiceScenario ?? practiceScenarioFor(l, program.dealName)
        }));
      });
    }
    if (persisted && version < 5 && Array.isArray(persisted.meetings)) {
      // v5: every analysed call has data for all six report tabs.
      persisted.meetings = persisted.meetings.map((m: any) => withMockAnalysis(m));
    }
    if (persisted && version < 4 && version >= 3) {
      // v4: a deal cannot exist without meeting history.
      const savedMeetings: any[] = persisted.meetings || [];
      const keptDeals = (persisted.deals || []).filter((d: any) =>
        savedMeetings.some(m => m.associatedDealId === d.id) ||
        (d.timeline || []).some((t: any) => t.meetingId && savedMeetings.some(m => m.id === t.meetingId))
      );
      const keptIds = new Set(keptDeals.map((d: any) => d.id));
      persisted.deals = keptDeals;
      persisted.coachingPrograms = Object.fromEntries(
        Object.entries(persisted.coachingPrograms || {}).filter(([id]) => keptIds.has(id))
      );
      if (!keptDeals.length) persisted.populated = { ...(persisted.populated || {}), deals: false };
    }
    if (persisted && version < 3) {
      delete persisted.tasks;
      delete persisted.coachingProgram;
      persisted.coachingPrograms = {};
      persisted.deals = [];
      persisted.meetings = [];
      persisted.crmLastSyncResult = '';
      persisted.populated = { ...(persisted.populated || {}), deals: false, meetings: false, coaching: false };
      delete persisted.populated.tasks;
    }
    return persisted;
  },
  storage: createJSONStorage(() => localStorage),
  // Persist data only; actions are re-created on load.
  partialize: (state) => Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== 'function')
  ) as unknown as AppState
}));
