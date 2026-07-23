"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorCard } from "@/components/error-card";
import { Input, Select } from "@/components/ui/input";
import { StatTile } from "@/components/stat-tile";
import {
  ConfidenceBadge,
  GuardrailBadge,
  ReviewStatusBadge,
  SeverityBadge,
} from "@/components/status-badges";
import { formatIssueType } from "@/lib/risk";
import {
  ConfidenceLevel,
  DetectionRunResult,
  GroupRef,
  IssueCategory,
  IssueListItem,
  ReviewStatus,
  SeverityBand,
} from "@/lib/types";

const CI_CLASSES = ["Database", "Server", "Application", "Network"];
const SEVERITY_ORDER: Record<SeverityBand, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "Not supplied";
}

export function DashboardClient({
  canRunDetection,
  detectionAvailable,
}: {
  canRunDetection: boolean;
  detectionAvailable: boolean;
}) {
  const [issues, setIssues] = useState<IssueListItem[] | null>(null);
  const [groups, setGroups] = useState<GroupRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionRunResult | null>(null);
  const [detectionPending, setDetectionPending] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<{
    count: number;
    refreshedAt: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [status, setStatus] = useState<ReviewStatus | "">("");
  const [confidence, setConfidence] = useState<ConfidenceLevel | "">("");
  const [severity, setSeverity] = useState<SeverityBand | "">("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [ciClass, setCiClass] = useState("");
  const [supportGroup, setSupportGroup] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/issues")
      .then((res) => readJson<{ items: IssueListItem[] }>(res))
      .then((data) => setIssues(data.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load risk queue"));

    fetch("/api/groups")
      .then((res) => readJson<{ items: GroupRef[] }>(res))
      .then((data) => setGroups(data.items ?? []))
      .catch(() => undefined);
  }, [refreshKey]);

  async function handleRunDetection() {
    if (!detectionAvailable) {
      setDetectionPending(true);
      setRefreshFeedback(null);
      setError(null);
      try {
        const [issueData, groupData] = await Promise.all([
          fetch("/api/issues").then((res) =>
            readJson<{ items: IssueListItem[] }>(res)
          ),
          fetch("/api/groups").then((res) =>
            readJson<{ items: GroupRef[] }>(res)
          ),
        ]);
        const refreshedIssues = issueData.items ?? [];
        setIssues(refreshedIssues);
        setGroups(groupData.items ?? []);
        setRefreshFeedback({
          count: refreshedIssues.length,
          refreshedAt: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refresh failed");
      } finally {
        setDetectionPending(false);
      }
      return;
    }

    setDetectionPending(true);
    setDetectionResult(null);
    setRefreshFeedback(null);
    setError(null);
    try {
      const result = await readJson<DetectionRunResult>(
        await fetch("/api/detection/run", { method: "POST" })
      );
      setDetectionResult(result);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setDetectionPending(false);
    }
  }

  const supportGroupNames = useMemo(
    () => Array.from(new Set(groups.map((group) => group.name))).sort(),
    [groups]
  );

  const riskSummary = useMemo(() => {
    const open = (issues ?? []).filter(
      (issue) => issue.reviewStatus === "open" || issue.reviewStatus === "in_review"
    );
    return {
      critical: open.filter((issue) => issue.severityBand === "Critical").length,
      high: open.filter((issue) => issue.severityBand === "High").length,
      medium: open.filter((issue) => issue.severityBand === "Medium").length,
      low: open.filter((issue) => issue.severityBand === "Low").length,
      open: open.length,
      guardrailAttention: open.filter((issue) => issue.guardrailStatus !== "pass").length,
    };
  }, [issues]);

  const visibleIssues = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (issues ?? [])
      .filter((issue) => !status || issue.reviewStatus === status)
      .filter((issue) => !confidence || (
        confidence === "high" ? issue.aiConfidence >= 85 :
        confidence === "medium" ? issue.aiConfidence >= 65 && issue.aiConfidence < 85 :
        issue.aiConfidence < 65
      ))
      .filter((issue) => !severity || issue.severityBand === severity)
      .filter((issue) => !category || issue.issueCategory === category)
      .filter((issue) => !ciClass || issue.ciClass === ciClass)
      .filter((issue) => !supportGroup || issue.currentSupportGroupName === supportGroup)
      .filter((issue) => {
        if (!needle) return true;
        return [
          issue.ciName,
          issue.number,
          issue.issueType,
          issue.currentOwner ?? "",
          issue.recommendedOwnerName ?? "",
        ].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) =>
        SEVERITY_ORDER[b.severityBand] - SEVERITY_ORDER[a.severityBand] ||
        b.severityScore - a.severityScore ||
        Number(b.environment === "Production") - Number(a.environment === "Production") ||
        b.aiConfidence - a.aiConfidence
      );
  }, [issues, status, confidence, severity, category, ciClass, supportGroup, search]);

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorCard title="Unable to complete request" message={error} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Critical" value={issues ? riskSummary.critical : "—"} accent="rose" />
        <StatTile label="High Risk" value={issues ? riskSummary.high : "—"} accent="amber" />
        <StatTile label="Medium Risk" value={issues ? riskSummary.medium : "—"} accent="blue" />
        <StatTile label="Low Risk" value={issues ? riskSummary.low : "—"} accent="neutral" />
        <StatTile label="Open Backlog" value={issues ? riskSummary.open : "—"} accent="blue" />
        <StatTile
          label="Guardrail Attention"
          value={issues ? riskSummary.guardrailAttention : "—"}
          accent={riskSummary.guardrailAttention ? "rose" : "green"}
        />
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {detectionAvailable ? "Run risk detection" : "Refresh risk findings"}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {detectionAvailable
              ? "Scan current CI and relationship records and add newly derived issues to the queue."
              : "Reload findings already produced by ServiceNow. Detection is not installed on this API."}
          </p>
        </div>
        <Button
          onClick={handleRunDetection}
          disabled={(detectionAvailable && !canRunDetection) || detectionPending}
        >
          {detectionPending
            ? detectionAvailable
              ? "Running detection…"
              : "Refreshing…"
            : detectionAvailable
              ? "Run detection"
              : refreshFeedback
                ? "Refresh again"
                : "Refresh findings"}
        </Button>
      </Card>

      {detectionAvailable && !canRunDetection && (
        <p className="-mt-4 text-xs text-zinc-500">
          Viewer access is read-only. Sign in with the steward access key to run detection.
        </p>
      )}

      {detectionResult && (
        <Card className="border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <p className="font-medium">{detectionResult.message}</p>
          <p className="mt-1 text-xs">
            Scanned {detectionResult.scanned} · Created {detectionResult.created} · Skipped existing {detectionResult.skipped_existing} · Source {detectionResult.source}
          </p>
        </Card>
      )}

      {refreshFeedback && (
        <Card
          className="border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium">Findings refreshed successfully</p>
          <p className="mt-1 text-xs">
            Loaded {refreshFeedback.count} findings from ServiceNow at{" "}
            {refreshFeedback.refreshedAt}.
          </p>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Risk queue</p>
            <p className="text-xs text-zinc-500">Worst-first across severity, environment, and confidence.</p>
          </div>
          <p className="text-xs tabular-nums text-zinc-500">{visibleIssues.length} findings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search CI, issue, owner, recommendation…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:w-72"
          />
          <Select value={severity} onChange={(event) => setSeverity(event.target.value as SeverityBand | "")}>
            <option value="">All severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value as IssueCategory | "")}>
            <option value="">All categories</option>
            <option value="ownership">Ownership</option>
            <option value="relationship">Relationship</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus | "")}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="deferred">Deferred</option>
          </Select>
          <Select value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceLevel | "")}>
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={ciClass} onChange={(event) => setCiClass(event.target.value)}>
            <option value="">All CI classes</option>
            {CI_CLASSES.map((value) => <option key={value}>{value}</option>)}
          </Select>
          <Select value={supportGroup} onChange={(event) => setSupportGroup(event.target.value)}>
            <option value="">All support groups</option>
            {supportGroupNames.map((value) => <option key={value}>{value}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Finding</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Ownership decision</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Guardrails</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {issues === null && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-400">Loading risk queue…</td></tr>
            )}
            {issues !== null && visibleIssues.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-400">No findings match the current filters.</td></tr>
            )}
            {visibleIssues.map((issue) => (
              <tr key={issue.sys_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3"><SeverityBadge band={issue.severityBand} score={issue.severityScore} /></td>
                <td className="px-4 py-3">
                  <Link href={`/issue/${issue.sys_id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                    {issue.ciName}
                  </Link>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {formatIssueType(issue.issueType)} · {issue.ciClass} · {issue.issueCategory}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{issue.environment}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {issue.recommendedChangeSummary ? (
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {issue.recommendedChangeSummary}
                    </span>
                  ) : (
                    <>
                      <span>{issue.currentOwner ?? issue.currentSupportGroupName ?? "Unowned"}</span>
                      <span className="mx-2 text-zinc-300 dark:text-zinc-700">→</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {issue.recommendedOwnerName ?? "Manual review"}
                      </span>
                    </>
                  )}
                </td>
                <td className="px-4 py-3"><ConfidenceBadge score={issue.aiConfidence} /></td>
                <td className="px-4 py-3"><GuardrailBadge status={issue.guardrailStatus} /></td>
                <td className="px-4 py-3"><ReviewStatusBadge status={issue.reviewStatus} /></td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(issue.dateIdentified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
