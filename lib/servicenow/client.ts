import "server-only";

import {
  ActivityEntry,
  AnalyticsData,
  DashboardSummary,
  DecisionRequest,
  DecisionResponse,
  GroupRef,
  IssueFilters,
  IssueListItem,
  OwnershipIssue,
} from "@/lib/types";
import { computeAnalytics, computeDashboardSummary, deriveActivityFromIssues } from "./derive";
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

  return res.json() as Promise<T>;
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
  const data = await snFetch<{ items: IssueListItem[] }>(`/issues${qs ? `?${qs}` : ""}`);
  return data.items;
}

export async function getIssue(sysId: string): Promise<OwnershipIssue | null> {
  if (!isLiveConfigured()) return mock.getIssue(sysId);

  try {
    return await snFetch<OwnershipIssue>(`/issues/${sysId}`);
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

export async function listActivity(): Promise<ActivityEntry[]> {
  if (!isLiveConfigured()) return mock.listActivity();
  const issues = await fetchAllFullIssues();
  return deriveActivityFromIssues(issues);
}
