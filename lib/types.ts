// Domain types for the Ownership Resolution Workspace.
// Field names mirror the columns on the ServiceNow CMDB Ownership table
// (Number, Child CI, Relationship Type, Current Owner, Current Support Group,
// Managed By, CI Class, Evidence, AI Reason, AI Rationale, AI Confidence,
// Recommended Owner, Review Status, Decision Notes, Notes, Date Identified,
// Created/Created by/Updated/Updated by).

export type ReviewStatus = "open" | "in_review" | "resolved" | "deferred";

export type Decision = "accepted" | "overridden" | "deferred";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface GroupRef {
  sys_id: string;
  name: string;
}

export interface EvidenceItem {
  type: string;
  value: string;
  weight: number;
}

export interface OwnershipIssue {
  sys_id: string;
  number: string;
  childCi: {
    sys_id: string;
    name: string;
    ciClass: string;
  };
  relationshipType: string;
  currentOwner: string | null;
  currentSupportGroup: GroupRef | null;
  managedBy: string | null;
  evidence: EvidenceItem[];
  aiReason: string;
  aiRationale: string;
  aiConfidence: number;
  recommendedOwner: GroupRef | null;
  reviewStatus: ReviewStatus;
  decision: Decision | null;
  decisionNotes: string | null;
  finalOwner: GroupRef | null;
  notes: string | null;
  dateIdentified: string;
  created: string;
  createdBy: string;
  updated: string;
  updatedBy: string;
}

export interface IssueListItem {
  sys_id: string;
  number: string;
  ciName: string;
  ciClass: string;
  currentOwner: string | null;
  recommendedOwnerName: string | null;
  aiConfidence: number;
  reviewStatus: ReviewStatus;
  dateIdentified: string;
  currentSupportGroupName: string | null;
}

export interface IssueFilters {
  status?: ReviewStatus;
  confidence?: ConfidenceLevel;
  ciClass?: string;
  supportGroup?: string;
  q?: string;
}

export interface DashboardSummary {
  total: number;
  open: number;
  resolved: number;
  deferred: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export interface AnalyticsData {
  byClass: { ciClass: string; count: number }[];
  byConfidence: { level: ConfidenceLevel; count: number }[];
  byTeam: { team: string; count: number }[];
  resolutionTrend: { date: string; resolved: number }[];
}

export interface CiClassHealth {
  ciClass: string;
  total: number;
  unowned: number;
  resolved: number;
}

export interface CmdbHealthMetrics {
  totalFlagged: number;
  unowned: number;
  ownershipCoveragePct: number;
  resolutionRatePct: number;
  openBacklog: number;
  avgOpenAgeDays: number;
  oldestOpenAgeDays: number;
  healthScore: number;
  byClass: CiClassHealth[];
}

export type ActivityType =
  | "recommendation_generated"
  | "decision_submitted"
  | "ownership_changed";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  issueNumber: string;
  issueSysId: string;
  ciName: string;
  message: string;
  actor: string;
  timestamp: string;
}

export interface DecisionRequest {
  decision: Decision;
  final_group_id?: string;
  notes?: string;
}

export interface DecisionResponse {
  issue_id: string;
  status: ReviewStatus;
  final_group_id?: string;
  ci_updated: boolean;
  audit_record_id: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface DetectionRunResult {
  run_id: string;
  scanned: number;
  created: number;
  skipped_existing: number;
  source: "servicenow" | "mock";
  message: string;
}

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  return "low";
}
