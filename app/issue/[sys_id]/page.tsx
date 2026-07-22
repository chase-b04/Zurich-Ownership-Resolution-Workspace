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
          <Link href="/" className="text-sm text-zinc-500 hover:underline">← Back to risk queue</Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{issue.childCi.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
        <Card className="border-zinc-300 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-zinc-100">Recommended remediation</CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {issue.recommendationSource === "ai" ? "AI recommendation with deterministic validation" : "Deterministic fallback recommendation"}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Proposed owner</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {issue.recommendedOwner?.name ?? "Manual investigation required"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Current: {issue.currentSupportGroup?.name ?? issue.currentOwner ?? "Unassigned"}
                </p>
              </div>
              <ConfidenceBadge score={issue.aiConfidence} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{issue.aiReason}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{issue.aiRationale}</p>
            </div>
          </CardContent>
        </Card>
        <GuardrailPanel results={issue.guardrailResults} source={issue.recommendationSource} />
      </div>

      <Card>
        <CardHeader><CardTitle>Risk context and CI details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Issue Category" value={issue.issueCategory === "ownership" ? "Ownership" : "Relationship"} />
            <Field label="Issue Type" value={formatIssueType(issue.issueType)} />
            <Field label="Environment" value={issue.environment} />
            <Field label="Team Scope" value={issue.teamIdentifier ?? "Not supplied"} />
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

      <DecisionPanel issue={issue} groups={groups} role={role} />
    </div>
  );
}
