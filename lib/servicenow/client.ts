import "server-only";

import {
  ActivityEntry,
  AnalyticsData,
  CmdbHealthMetrics,
  DashboardSummary,
  DecisionRequest,
  DecisionResponse,
  EvidenceItem,
  GroupRef,
  IssueFilters,
  IssueListItem,
  OwnershipIssue,
  ReviewStatus,
} from "@/lib/types";
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
      message = body?.error?.message ?? message;
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
  return STATUS_MAP[s ?? ""] ?? "open";
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
}
interface SnIssueDetail extends SnListItem {
  ownership_status: string; current_owner_id?: string; recommended_owner_id?: string;
}

function mapListItem(r: SnListItem): IssueListItem {
  return {
    sys_id: r.sys_id,
    number: r.sys_id.slice(0, 8),
    ciName: r.ci_name ?? "",
    ciClass: r.ci_class ?? "",
    currentOwner: r.current_owner,
    recommendedOwnerName: r.recommended_owner,
    aiConfidence: r.confidence ?? 0,
    reviewStatus: "open",
    dateIdentified: "",
    currentSupportGroupName: r.current_owner,
  };
}

function mapIssue(r: SnIssueDetail): OwnershipIssue {
  return {
    sys_id: r.sys_id,
    number: r.sys_id.slice(0, 8),
    childCi: { sys_id: r.sys_id, name: r.ci_name ?? "", ciClass: r.ci_class ?? "" },
    relationshipType: r.issue_type ?? "",
    currentOwner: r.current_owner,
    currentSupportGroup: r.current_owner
      ? { sys_id: r.current_owner_id ?? "", name: r.current_owner }
      : null,
    managedBy: r.managed_by,
    evidence: toEvidenceItems(r.evidence),
    aiReason: r.issue_type ?? "",
    aiRationale: r.ai_rationale ?? "",
    aiConfidence: r.confidence ?? 0,
    recommendedOwner: r.recommended_owner
      ? { sys_id: r.recommended_owner_id ?? "", name: r.recommended_owner }
      : null,
    reviewStatus: toReviewStatus(r.ownership_status),
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    dateIdentified: "",
    created: "",
    createdBy: "",
    updated: "",
    updatedBy: "",
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

  return snFetch<DecisionResponse>(`/issues/${sysId}/decision`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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
