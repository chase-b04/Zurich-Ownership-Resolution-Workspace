import "server-only";

import {
  ActivityEntry,
  AnalyticsData,
  CmdbHealthMetrics,
  DashboardSummary,
  DecisionRequest,
  DecisionResponse,
  DetectionRunResult,
  EvidenceItem,
  GroupRef,
  GuardrailResult,
  GuardrailStatus,
  IssueCategory,
  IssueFilters,
  IssueListItem,
  OwnershipIssue,
  RelationshipChange,
  ReviewStatus,
  SeverityBand,
} from "@/lib/types";
import {
  categoryForIssueType,
  deriveGuardrails,
  guardrailRollup,
  inferIssueType,
  normalizeRecommendationSource,
  severityBandFromScore,
  severityForIssueType,
} from "@/lib/risk";
import {
  computeAnalytics,
  computeDashboardSummary,
  computeHealthMetrics,
  deriveActivityFromIssues,
} from "./derive";
import * as mock from "./mock-store";

// Server-only integration layer. When SERVICENOW_URL/USERNAME/PASSWORD are
// configured, calls hit the real "Ownership API" Scripted REST Service
// (GET /groups, GET /issues, GET /issues/{sys_id}, PATCH /issues/{sys_id}/decision).
// Otherwise everything falls back to the in-memory mock store so the UI
// runs standalone for local development and demos.

const SERVICENOW_URL = process.env.SERVICENOW_URL;
const SERVICENOW_USERNAME = process.env.SERVICENOW_USERNAME;
const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD;
const SERVICENOW_API_PATH = process.env.SERVICENOW_API_PATH || "/api/x_cmdb_ownership/ownership";
const SERVICENOW_DETECTION_ENABLED =
  process.env.SERVICENOW_DETECTION_ENABLED?.toLowerCase() === "true";

export class ServiceNowApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isLiveConfigured(): boolean {
  return Boolean(SERVICENOW_URL && SERVICENOW_USERNAME && SERVICENOW_PASSWORD);
}

export function isUsingMockData(): boolean {
  return !isLiveConfigured();
}

export function isDetectionAvailable(): boolean {
  return !isLiveConfigured() || SERVICENOW_DETECTION_ENABLED;
}

function authHeader(): string {
  const token = Buffer.from(`${SERVICENOW_USERNAME}:${SERVICENOW_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

async function snFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${SERVICENOW_URL}${SERVICENOW_API_PATH}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message =
        body?.error?.details ??
        body?.error?.detail ??
        body?.error?.message ??
        message;
    } catch {
      // response body wasn't JSON, fall back to statusText
    }
    throw new ServiceNowApiError(res.status, message);
  }

  const json = await res.json();
  // ServiceNow Scripted REST wraps responses in a { result: ... } envelope
  return (json && typeof json === "object" && "result" in json
    ? (json as Record<string, unknown>).result
    : json) as T;
}

// ---- Mapping: ServiceNow Ownership API shapes -> app domain types ----

const STATUS_MAP: Record<string, ReviewStatus> = {
  flagged: "open",
  in_review: "in_review",
  resolved: "resolved",
  deferred: "deferred",
};

function toReviewStatus(s: string | null | undefined): ReviewStatus {
  const normalized = s?.trim().toLowerCase().replaceAll(" ", "_") ?? "";
  return STATUS_MAP[normalized] ??
    (normalized === "closed_complete" || normalized === "complete" ? "resolved" : "open");
}

function toDecision(
  value: string | null | undefined,
  status: ReviewStatus
): OwnershipIssue["decision"] {
  const normalized = value?.trim().toLowerCase().replaceAll(" ", "_");
  if (normalized === "accepted" || normalized === "approved") return "accepted";
  if (normalized === "overridden" || normalized === "override") return "overridden";
  if (normalized === "deferred") return "deferred";
  // The current ServiceNow detail resource returns status but omits decision.
  // Preserve a meaningful display until that resource exposes the exact field.
  if (status === "resolved") return "accepted";
  if (status === "deferred") return "deferred";
  return null;
}

function toEvidenceItems(ev: unknown): EvidenceItem[] {
  if (!ev || typeof ev !== "object") return [];
  return Object.entries(ev as Record<string, unknown>).map(([type, value]) => ({
    type,
    value: typeof value === "object" ? JSON.stringify(value) : String(value),
    weight: 0,
  }));
}

interface SnListItem {
  sys_id: string; ci_name: string; ci_class: string; issue_type: string;
  current_owner: string | null; managed_by: string | null;
  recommended_owner: string | null; confidence: number | null;
  ai_rationale: string | null; evidence: unknown;
  number?: string; ownership_status?: string; date_identified?: string;
  current_owner_id?: string; recommended_owner_id?: string;
  issue_category?: IssueCategory; severity_score?: number; severity_band?: SeverityBand;
  environment?: string; team_identifier?: string; recommendation_source?: string;
  guardrail_results?: unknown;
  recommended_change?: unknown;
}
interface SnIssueDetail extends SnListItem {
  ownership_status: string; created?: string; created_by?: string; updated?: string;
  updated_by?: string; decision?: OwnershipIssue["decision"]; decision_notes?: string;
  final_owner?: string; final_owner_id?: string;
  review_decision?: string; decision_reason?: string; notes?: string; close_notes?: string;
  sys_created_on?: string; sys_created_by?: string; sys_updated_on?: string;
  sys_updated_by?: string; created_on?: string; updated_on?: string;
}

function parseGuardrailResults(value: unknown): GuardrailResult[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((g: unknown, i: number) => {
    const item = g as { key?: string; check?: string; label?: string; result?: string; status?: string; note?: string; detail?: string };
    return {
      key: String(item.key ?? i),
      label: item.check ?? item.label ?? `Guardrail ${i + 1}`,
      status: (item.result ?? item.status ?? "warn") as GuardrailStatus,
      detail: item.note ?? item.detail ?? "",
    };
  });
}

function parseRelationshipChange(value: unknown): RelationshipChange | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  const record = parsed as Record<string, unknown>;
  if (record.action !== "delete_relationship") return null;

  const parent = (record.parentCi ?? record.parent_ci) as Record<string, unknown> | undefined;
  const child = (record.childCi ?? record.child_ci) as Record<string, unknown> | undefined;
  const relationshipSysId = String(record.relationshipSysId ?? record.relationship_sys_id ?? "");
  if (!relationshipSysId || !parent || !child) return null;

  return {
    action: "delete_relationship",
    relationshipSysId,
    relationshipType: String(record.relationshipType ?? record.relationship_type ?? "Related to"),
    parentCi: { sys_id: String(parent.sys_id ?? ""), name: String(parent.name ?? "") },
    childCi: { sys_id: String(child.sys_id ?? ""), name: String(child.name ?? "") },
  };
}

function riskFields(r: SnListItem, evidence: EvidenceItem[], recommendedOwner: GroupRef | null) {
  const issueType = r.issue_type || inferIssueType(r.ai_rationale, r.current_owner);
  const issueCategory = r.issue_category ?? categoryForIssueType(issueType);
  const severityScore = Number.isFinite(Number(r.severity_score))
    ? Number(r.severity_score)
    : severityForIssueType(issueType);
  const teamIdentifier = r.team_identifier || null;
  const recommendedChange = parseRelationshipChange(r.recommended_change);
  const storedGuardrails = parseGuardrailResults(r.guardrail_results);
  const guardrailResults = storedGuardrails.length
    ? storedGuardrails
    : deriveGuardrails({
        issueCategory,
        confidence: Number(r.confidence ?? 0),
        rationale: r.ai_rationale ?? "",
        evidence,
        recommendedOwner,
        recommendedChange,
        teamIdentifier,
      });

  return {
    issueCategory,
    issueType,
    severityScore,
    severityBand: r.severity_band ?? severityBandFromScore(severityScore),
    environment: r.environment || "Not specified",
    teamIdentifier,
    recommendationSource: normalizeRecommendationSource(r.recommendation_source),
    recommendedChange,
    guardrailResults,
  };
}

function mapListItem(r: SnListItem): IssueListItem {
  const evidence = toEvidenceItems(r.evidence);
  const recommendedOwner = r.recommended_owner
    ? { sys_id: r.recommended_owner_id ?? "", name: r.recommended_owner }
    : null;
  const risk = riskFields(r, evidence, recommendedOwner);
  return {
    sys_id: r.sys_id,
    number: r.number || r.sys_id.slice(0, 8),
    ciName: r.ci_name ?? "",
    ciClass: r.ci_class ?? "",
    issueCategory: risk.issueCategory,
    issueType: risk.issueType,
    severityScore: risk.severityScore,
    severityBand: risk.severityBand,
    environment: risk.environment,
    currentOwner: r.current_owner,
    recommendedOwnerName: r.recommended_owner,
    recommendedChangeSummary: risk.recommendedChange
      ? `Remove ${risk.recommendedChange.relationshipType} self-reference`
      : null,
    aiConfidence: r.confidence ?? 0,
    reviewStatus: toReviewStatus(r.ownership_status),
    dateIdentified: r.date_identified ?? "",
    currentSupportGroupName: r.current_owner,
    guardrailStatus: guardrailRollup(risk.guardrailResults),
  };
}

function mapIssue(r: SnIssueDetail): OwnershipIssue {
  const evidence = toEvidenceItems(r.evidence);
  const recommendedOwner = r.recommended_owner
    ? { sys_id: r.recommended_owner_id ?? "", name: r.recommended_owner }
    : null;
  const risk = riskFields(r, evidence, recommendedOwner);
  const reviewStatus = toReviewStatus(r.ownership_status);
  return {
    sys_id: r.sys_id,
    number: r.number || r.sys_id.slice(0, 8),
    childCi: { sys_id: r.sys_id, name: r.ci_name ?? "", ciClass: r.ci_class ?? "" },
    relationshipType: r.issue_type ?? "",
    currentOwner: r.current_owner,
    currentSupportGroup: r.current_owner
      ? { sys_id: r.current_owner_id ?? "", name: r.current_owner }
      : null,
    managedBy: r.managed_by,
    issueCategory: risk.issueCategory,
    issueType: risk.issueType,
    severityScore: risk.severityScore,
    severityBand: risk.severityBand,
    environment: risk.environment,
    teamIdentifier: risk.teamIdentifier,
    evidence,
    aiReason: r.issue_type ?? "",
    aiRationale: r.ai_rationale ?? "",
    aiConfidence: r.confidence ?? 0,
    recommendedOwner,
    recommendedChange: risk.recommendedChange,
    recommendationSource: risk.recommendationSource,
    guardrailResults: risk.guardrailResults,
    reviewStatus,
    decision: toDecision(r.decision ?? r.review_decision ?? r.decision_reason, reviewStatus),
    decisionNotes: r.decision_notes ?? r.notes ?? r.close_notes ?? null,
    finalOwner: r.final_owner
      ? { sys_id: r.final_owner_id ?? "", name: r.final_owner }
      : null,
    notes: null,
    dateIdentified: r.date_identified ?? r.created ?? r.sys_created_on ?? r.created_on ?? "",
    created: r.created ?? r.sys_created_on ?? r.created_on ?? r.date_identified ?? "",
    createdBy: r.created_by ?? r.sys_created_by ?? "",
    updated: r.updated ?? r.sys_updated_on ?? r.updated_on ?? "",
    updatedBy: r.updated_by ?? r.sys_updated_by ?? "",
  };
}

async function fetchAllFullIssues(): Promise<OwnershipIssue[]> {
  const summaries = await listIssues({});
  const detailed = await Promise.all(summaries.map((s) => getIssue(s.sys_id)));
  return detailed.filter((i): i is OwnershipIssue => i !== null);
}

export async function listIssues(filters: IssueFilters): Promise<IssueListItem[]> {
  if (!isLiveConfigured()) return mock.listIssues(filters);

  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, string][]
  ).toString();
  const data = await snFetch<{ items: SnListItem[] }>(`/issues${qs ? `?${qs}` : ""}`);
  return (data.items ?? []).map(mapListItem);
}

export async function getIssue(sysId: string): Promise<OwnershipIssue | null> {
  if (!isLiveConfigured()) return mock.getIssue(sysId);

  try {
    const data = await snFetch<{ record: SnIssueDetail }>(`/issues/${sysId}`);
    return mapIssue(data.record);
  } catch (err) {
    if (err instanceof ServiceNowApiError && err.status === 404) return null;
    throw err;
  }
}

export async function listGroups(): Promise<GroupRef[]> {
  if (!isLiveConfigured()) return mock.listGroups();

  const data = await snFetch<{ items: GroupRef[] }>("/groups");
  return data.items;
}

export async function submitDecision(
  sysId: string,
  payload: DecisionRequest
): Promise<DecisionResponse> {
  if (!isLiveConfigured()) {
    try {
      return mock.submitDecision(sysId, payload);
    } catch (err) {
      if (err instanceof mock.MockApiError) throw new ServiceNowApiError(err.status, err.message);
      throw err;
    }
  }

  const serviceNowPayload =
    payload.decision === "overridden" && payload.final_group_id
      ? {
          ...payload,
          // Existing implementations use different names for the selected
          // override group. Scripted REST resources ignore unused properties.
          final_owner_id: payload.final_group_id,
          override_group_id: payload.final_group_id,
        }
      : payload;

  return snFetch<DecisionResponse>(`/issues/${sysId}/decision`, {
    method: "PATCH",
    body: JSON.stringify(serviceNowPayload),
  });
}

export async function runDetection(): Promise<DetectionRunResult> {
  if (!isLiveConfigured()) return mock.runDetection();
  if (!SERVICENOW_DETECTION_ENABLED) {
    throw new ServiceNowApiError(
      501,
      "Live detection is not enabled because this ServiceNow API has no detection resource"
    );
  }

  const result = await snFetch<Omit<DetectionRunResult, "source">>("/detection/run", {
    method: "POST",
  });
  return { ...result, source: "servicenow" };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const issues = isLiveConfigured() ? await fetchAllFullIssues() : mock.getAllIssues();
  return computeDashboardSummary(issues);
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const issues = isLiveConfigured() ? await fetchAllFullIssues() : mock.getAllIssues();
  return computeAnalytics(issues);
}

export async function getHealthMetrics(): Promise<CmdbHealthMetrics> {
  const issues = isLiveConfigured() ? await fetchAllFullIssues() : mock.getAllIssues();
  return computeHealthMetrics(issues);
}

export async function listActivity(): Promise<ActivityEntry[]> {
  if (!isLiveConfigured()) return mock.listActivity();
  const issues = await fetchAllFullIssues();
  return deriveActivityFromIssues(issues);
}
