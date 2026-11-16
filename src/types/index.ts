export type UserRole = 'client_admin' | 'manager' | 'sales_rep' | 'super_admin';

export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  companyName: string;
  title: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'sales_rep';
  status: 'active' | 'inactive';
  invitationStatus: 'accepted' | 'pending' | 'expired';
  dateJoined: string;
  /** Sales reps only: the one primary manager this rep reports to. The only stored assignment. */
  managerId?: string;
  dealsCount: number;
  meetingsCount: number;
}

export interface SalesCue {
  id: number;
  name: string;
  evaluationFocus: string;
  score: number; // 0 - 5
  percentage: number; // 0 - 100
  observation: string;
  improvement: string;
  evidence: string;
  severity?: 'critical' | 'warning' | 'positive';
  isAssessable: boolean;
}

export interface MeetingObjection {
  id: string;
  timestamp: string;
  objection: string;
  repResponse: string;
  status: 'Resolved' | 'Partially Resolved' | 'Unresolved';
  strongerResponseSuggestion: string;
}

export interface TranscriptSnippet {
  id: string;
  speaker: string;
  role: 'rep' | 'prospect';
  timestamp: string;
  text: string;
  cuesMentioned?: string[];
}

export interface MeetingRecord {
  id: string;
  name: string;
  representativeId: string;
  representativeName: string;
  uploadDate: string;
  duration: string;
  processingStatus: 'Analysed' | 'Processing' | 'Failed';
  associatedDealId?: string;
  associatedDealName?: string;
  /** Where the recording came from: manual upload, CRM auto-fetch or Google Drive auto-fetch. */
  source?: 'upload' | 'crm' | 'drive';
  sourceDetail?: string;
  /** Salesforce Activity (Task/Event) id this recording was imported from. Prevents duplicate imports. */
  crmActivityId?: string;
  /** Salesforce Opportunity id the Activity pointed at (its WhatId), if any. */
  crmOpportunityId?: string;
  overallScorePercent?: number;
  summary?: string;
  whatWentWell?: string[];
  whereRepStruggled?: string[];
  whatCouldBeBetter?: string[];
  recommendedNextSteps?: string[];
  cues?: SalesCue[];
  objections?: MeetingObjection[];
  transcript?: TranscriptSnippet[];
  fileFormat?: 'MP4' | 'MP3' | 'TXT';
  fileSize?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  company: string;
  sentiment: 'Champion' | 'Neutral' | 'Skeptic' | 'Decision Maker';
  lastSpoke: string;
  avatar?: string;
}

export interface DealTimelineEvent {
  id: string;
  date: string;
  type: 'meeting' | 'email' | 'stage_change' | 'note';
  title: string;
  description: string;
  meetingId?: string;
  author: string;
}

export type DealStage = 'Discovery' | 'Technical Review' | 'Commercial Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface DealRecord {
  id: string;
  name: string;
  companyName: string;
  stage: DealStage;
  /** Salesforce Opportunity id. Absent on a draft deal that has no Opportunity yet. */
  crmId?: string;
  crmSystem?: 'salesforce';
  /** 'crm' = synced from a Salesforce Opportunity, 'draft' = created in SellMore, not in the CRM yet. */
  source: 'crm' | 'draft';
  /** The stage name exactly as Salesforce reports it, before mapping to SellMore's stages. */
  rawStage?: string;
  /** Salesforce user id of the Opportunity owner. */
  ownerCrmId?: string;
  crmLastSyncedAt?: string;
  amount: number;
  ownerId: string;
  ownerName: string;
  closeDate: string;
  lastMeetingDate: string;
  nextMeetingDate?: string;
  timeInStage: string;
  callCount: number;
  emailCount: number;
  risks: string[];
  stakeholders: Stakeholder[];
  timeline: DealTimelineEvent[];
}

/** One typed reply to a lesson's practice situation. */
export interface PracticeAttempt {
  id: string;
  response: string;
  /** 0 to 100, from the practice check. */
  score: number;
  createdAt: string;
}

export interface CoachingLesson {
  id: string;
  title: string;
  order: number;
  objective: string;
  relevanceToDeal: string;
  evidenceSourceCall: string;
  tailoredExplanation: string;
  recommendedTalkTrack: string[];
  practiceActivity: string;
  /** The situation the rep writes a reply to: usually the buyer's line. */
  practiceScenario?: string;
  /** The rep's typed replies, oldest first. */
  practiceAttempts?: PracticeAttempt[];
  expectedOutcome: string;
  /** The call this lesson comes from, so the evidence can be opened. */
  evidenceMeetingId?: string;
  completed: boolean;
  managerFeedback?: string;
  managerFeedbackBy?: string;
  managerFeedbackAt?: string;
}

/**
 * A practice lesson made by a user from the cues they fell short on. It is stored as this small spec
 * and turned into a playable conversation by lib/lessonBuilder.
 */
export interface LessonSpec {
  id: string;
  title: string;
  cueIds: number[];
  /** 'meeting': built from one call. 'lead': built from every analysed call on a lead. */
  origin: 'meeting' | 'lead';
  /** 'checklist': the user ticked the points. 'ai': taken from the suggested plan. */
  method: 'checklist' | 'ai';
  meetingId?: string;
  meetingName?: string;
  leadId?: string;
  leadName?: string;
  /** One line on what the lesson was built from. */
  context: string;
  /** The rep who practises it. */
  ownerId: string;
  /** Set when a manager created the lesson on behalf of the rep. */
  assignedByName?: string;
  createdAt: string;
}

export interface DealCoachingProgram {
  dealId: string;
  dealName: string;
  representativeId: string;
  representativeName: string;
  status: 'In Progress' | 'Completed' | 'Ready to Start';
  progressPercentage: number;
  updatedAt: string;
  /** Analysed calls the lessons were built from. A call not listed here is new since the programme was built. */
  sourceMeetingIds?: string[];
  lessons: CoachingLesson[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  category: 'Summary' | 'Prompt' | 'Email' | 'Diagnostic';
  status: 'Active' | 'Draft' | 'Paused';
  runsCount: number;
  lastRunDate?: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'TXT' | 'Website' | 'YouTube' | 'Manual QA';
  sizeOrUrl: string;
  dateAdded: string;
  status: 'Indexed' | 'Processing' | 'Failed';
  qaAssessmentTag?: string; // e.g. "Product Knowledge QA"
  consideredForQA: boolean;
  queriesCount: number;
}

export interface PracticeLessonCatalog {
  id: string;
  title: string;
  category: string;
  description: string;
  recommendedTime: string;
  level: 'Foundational' | 'Advanced' | 'Mastery';
  promptsCountDefault: number;
  intervalSecondsDefault: number;
  samplePrompts: string[];
}

export interface MockMeetingHistoryItem {
  id: string;
  startedAt: string;
  duration: string;
  representativeId?: string;
  representativeName: string;
  buyerName: string;
  buyerRole: string;
  roleplayType: string;
  domain: string;
  score: number; // 0 - 100
  summary: string;
  talkListenRatio: string;
  fillerWordsPerMin: number;
  talkSpeedWpm: number;
  longestMonologue: string;
  whatWentWell: string[];
  pointsToImprove: string[];
  rescoreStatus?: 'idle' | 'processing' | 'rescored';
  /** The analysed meeting this mock was built from. */
  sourceMeetingId?: string;
  sourceMeetingName?: string;
  focusCueIds?: number[];
}

export interface CreditTransaction {
  id: string;
  activity: string;
  date: string;
  creditsConsumed: number;
  remainingBalance: number;
}

export interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  purpose: string;
  status: 'Paid' | 'Processing' | 'Failed';
  pdfDownloadUrl?: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  taggedAssessment: string;
  considered: boolean;
  status: 'Ready' | 'Processing';
}

/**
 * A sales evaluation cue prompt.
 * Platform defaults are managed by the super admin and apply to every business.
 * A company cue either replaces a platform default for that business (`overridesId` set)
 * or is a custom cue only that business has.
 */
export interface CuePrompt {
  id: string;
  cueName: string;
  category: string;
  description: string;
  instructions: string;
  enabled: boolean;
  updatedAt: string;
  /** Company cues only: the id of the platform default this cue replaces. */
  overridesId?: string;
}

/** default = unchanged platform default; customised = company replaced a default; custom = company-only cue. */
export type CueOrigin = 'default' | 'customised' | 'custom';

export interface EffectiveCue extends CuePrompt {
  origin: CueOrigin;
  /** The platform default this cue comes from or replaces. */
  platformId?: string;
}

export type CueInput = Pick<CuePrompt, 'cueName' | 'category' | 'description' | 'instructions' | 'enabled'>;

/* ---------------- Platform (super admin) ---------------- */

export type TenantStatus = 'Active' | 'Suspended';

/** A customer business on the platform. */
export interface PlatformTenant {
  id: string;
  name: string;
  adminName: string;
  adminEmail: string;
  plan: PlanTier;
  seatsUsed: number;
  meetingsUsed: number;
  status: TenantStatus;
  /** Free text, "Perpetual" for the free plan. */
  renewal: string;
  createdAt: string;
  notes?: string;
}

/** A commercial plan the super admin sells. `null` limits mean unlimited. */
export interface PlatformPlan {
  id: PlanTier;
  name: string;
  priceMonthly: number;
  seats: number | null;
  meetingQuota: number | null;
  credits: number;
  features: string[];
  active: boolean;
}

export interface PlatformLimits {
  formats: string;
  maxFileSizeMb: number;
  maxDurationMin: number;
  inviteExpiryHours: number;
}

export interface PlatformActivity {
  id: string;
  at: string;
  text: string;
}
