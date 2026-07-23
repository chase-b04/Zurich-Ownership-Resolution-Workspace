import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getIssue, listGroups } from "@/lib/servicenow/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConfidenceBadge,
  GuardrailBadge,
  ReviewStatusBadge,
  SeverityBadge,
} from "@/components/status-badges";
import { DecisionPanel } from "@/components/issue/decision-panel";
import { GuardrailPanel } from "@/components/issue/guardrail-panel";
import { formatIssueType, guardrailRollup } from "@/lib/risk";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Not supplied";
}

export default async function IssuePage({ params }: { params: Promise<{ sys_id: string }> }) {
  const { sys_id } = await params;
  const [issue, groups, cookieStore] = await Promise.all([getIssue(sys_id), listGroups(), cookies()]);
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const role = token ? verifySessionToken(token) : null;
  if (!issue) notFound();

  const guardrailStatus = guardrailRollup(issue.guardrailResults);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="text-xs font-semibold text-blue-600 hover:text-blue-500">← Back to risk queue</Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Finding investigation</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{issue.childCi.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {issue.number} · {formatIssueType(issue.issueType)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge band={issue.severityBand} score={issue.severityScore} />
          <GuardrailBadge status={guardrailStatus} />
          <ReviewStatusBadge status={issue.reviewStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Card className="border-blue-200/70 dark:border-blue-950">
          <CardHeader>
            <CardTitle>Recommended remediation</CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {issue.recommendationSource === "ai" ? "AI recommendation with deterministic validation" : "Deterministic fallback recommendation"}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {issue.recommendedChange ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Proposed relationship change
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                      Remove self-reference
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {issue.recommendedChange.relationshipType}:{" "}
                      {issue.recommendedChange.parentCi.name} →{" "}
                      {issue.recommendedChange.childCi.name}
                    </p>
                  </div>
                  <ConfidenceBadge score={issue.aiConfidence} />
                </div>
                <p className="mt-4 rounded-md border border-zinc-200 px-3 py-2 text-xs leading-5 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  Scope: delete relationship{" "}
                  <span className="font-mono">{issue.recommendedChange.relationshipSysId}</span>.
                  The parent and child CIs remain unchanged.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Ownership change</p>
                  <ConfidenceBadge score={issue.aiConfidence} />
                </div>
                <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current state</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {issue.currentSupportGroup?.name ?? issue.currentOwner ?? "Unassigned"}
                    </p>
                  </div>
                  <span className="flex items-center justify-center text-lg text-blue-500" aria-hidden="true">→</span>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/35">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">Proposed state</p>
                    <p className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {issue.recommendedOwner?.name ?? "Manual investigation required"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{issue.aiReason}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{issue.aiRationale}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <GuardrailPanel results={issue.guardrailResults} source={issue.recommendationSource} />
          <DecisionPanel issue={issue} groups={groups} role={role} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Risk context and CI details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Issue Category" value={issue.issueCategory === "ownership" ? "Ownership" : "Relationship"} />
            <Field label="Issue Type" value={formatIssueType(issue.issueType)} />
            <Field label="Environment" value={issue.environment} />
            <Field label="Risk Score" value={`${issue.severityScore} / 100`} />
            <Field label="CI Class" value={issue.childCi.ciClass} />
            <Field label="Managed By" value={issue.managedBy ?? "—"} />
            <Field label="Current Support Group" value={issue.currentSupportGroup?.name ?? "Unassigned"} />
            <Field label="Date Identified" value={formatDateTime(issue.dateIdentified)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Supporting evidence</CardTitle></CardHeader>
        <CardContent>
          {issue.evidence.length === 0 ? (
            <p className="text-sm text-zinc-500">No supporting evidence was returned. The evidence guardrail requires review.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {issue.evidence.map((evidence, index) => (
                <li key={`${evidence.type}-${index}`} className="flex items-start justify-between gap-4 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{formatIssueType(evidence.type)}</p>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300">{evidence.value}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">weight {evidence.weight}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
