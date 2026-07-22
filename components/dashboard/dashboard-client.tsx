"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatTile } from "@/components/stat-tile";
import { ConfidenceBadge, ReviewStatusBadge } from "@/components/status-badges";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/error-card";
import {
  ConfidenceLevel,
  DashboardSummary,
  DetectionRunResult,
  GroupRef,
  IssueListItem,
  ReviewStatus,
} from "@/lib/types";

const CI_CLASSES = ["Database", "Server", "Application", "Network"];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export function DashboardClient({ canRunDetection }: { canRunDetection: boolean }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [issues, setIssues] = useState<IssueListItem[] | null>(null);
  const [groups, setGroups] = useState<GroupRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionRunResult | null>(null);
  const [detectionPending, setDetectionPending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [status, setStatus] = useState<ReviewStatus | "">("");
  const [confidence, setConfidence] = useState<ConfidenceLevel | "">("");
  const [ciClass, setCiClass] = useState("");
  const [supportGroup, setSupportGroup] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => readJson<DashboardSummary>(res))
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard summary"));
    fetch("/api/groups")
      .then((res) => readJson<{ items: GroupRef[] }>(res))
      .then((data) => setGroups(data.items ?? []))
      .catch(() => undefined);
  }, [refreshKey]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (confidence) params.set("confidence", confidence);
    if (ciClass) params.set("ciClass", ciClass);
    if (supportGroup) params.set("supportGroup", supportGroup);
    if (debouncedSearch) params.set("q", debouncedSearch);

    const qs = params.toString();
    fetch(`/api/issues${qs ? `?${qs}` : ""}`)
      .then((res) => readJson<{ items: IssueListItem[] }>(res))
      .then((data) => setIssues(data.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load ownership issues"));
  }, [status, confidence, ciClass, supportGroup, debouncedSearch, refreshKey]);

  async function handleRunDetection() {
    setDetectionPending(true);
    setDetectionResult(null);
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
    () => Array.from(new Set(groups.map((g) => g.name))).sort(),
    [groups]
  );

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorCard title="Unable to complete request" message={error} />}

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Rule-based CMDB detection
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Scans unlabeled CI records and creates findings from their current field values.
          </p>
        </div>
        <Button onClick={handleRunDetection} disabled={!canRunDetection || detectionPending}>
          {detectionPending ? "Running detection…" : "Run detection"}
        </Button>
      </Card>

      {!canRunDetection && (
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label="Total Issues" value={summary?.total ?? "—"} />
        <StatTile label="Open Issues" value={summary?.open ?? "—"} accent="blue" />
        <StatTile label="Resolved" value={summary?.resolved ?? "—"} accent="green" />
        <StatTile label="Deferred" value={summary?.deferred ?? "—"} accent="neutral" />
        <StatTile label="High Confidence" value={summary?.highConfidence ?? "—"} accent="green" />
        <StatTile label="Medium Confidence" value={summary?.mediumConfidence ?? "—"} accent="amber" />
        <StatTile label="Low Confidence" value={summary?.lowConfidence ?? "—"} accent="rose" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search CI, owner, support group, recommendation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus | "")}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="deferred">Deferred</option>
          </Select>
          <Select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as ConfidenceLevel | "")}
          >
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={ciClass} onChange={(e) => setCiClass(e.target.value)}>
            <option value="">All CI classes</option>
            {CI_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={supportGroup} onChange={(e) => setSupportGroup(e.target.value)}>
            <option value="">All support groups</option>
            {supportGroupNames.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">CI Name</th>
              <th className="px-4 py-3">CI Class</th>
              <th className="px-4 py-3">Current Owner</th>
              <th className="px-4 py-3">Recommended Owner</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Review Status</th>
              <th className="px-4 py-3">Date Found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {issues === null && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  Loading ownership issues…
                </td>
              </tr>
            )}
            {issues?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  No ownership issues match the current filters.
                </td>
              </tr>
            )}
            {issues?.map((issue) => (
              <tr key={issue.sys_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  <Link href={`/issue/${issue.sys_id}`} className="hover:underline">
                    {issue.ciName}
                  </Link>
                  <div className="text-xs font-normal text-zinc-400">{issue.number}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{issue.ciClass}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {issue.currentOwner ?? issue.currentSupportGroupName ?? "Unowned"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {issue.recommendedOwnerName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge score={issue.aiConfidence} />
                </td>
                <td className="px-4 py-3">
                  <ReviewStatusBadge status={issue.reviewStatus} />
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(issue.dateIdentified).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
