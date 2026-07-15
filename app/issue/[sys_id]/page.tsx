import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getIssue, listGroups } from "@/lib/servicenow/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, ReviewStatusBadge } from "@/components/status-badges";
import { DecisionPanel } from "@/components/issue/decision-panel";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ sys_id: string }>;
}) {
  const { sys_id } = await params;
  const [issue, groups, cookieStore] = await Promise.all([
    getIssue(sys_id),
    listGroups(),
    cookies(),
  ]);
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const role = token ? verifySessionToken(token) : null;

  if (!issue) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {issue.childCi.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{issue.number}</p>
        </div>
        <ReviewStatusBadge status={issue.reviewStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CI Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="CI Name" value={issue.childCi.name} />
            <Field label="CI Class" value={issue.childCi.ciClass} />
            <Field label="Current Owner" value={issue.currentOwner ?? "Unowned"} />
            <Field label="Managed By" value={issue.managedBy ?? "—"} />
            <Field
              label="Current Support Group"
              value={issue.currentSupportGroup?.name ?? "Unassigned"}
            />
            <Field
              label="Date Identified"
              value={new Date(issue.dateIdentified).toLocaleString()}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Recommended Owner" value={issue.recommendedOwner?.name ?? "None"} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Confidence Score
              </dt>
              <dd className="mt-1">
                <ConfidenceBadge score={issue.aiConfidence} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Recommendation Status
              </dt>
              <dd className="mt-1">
                <ReviewStatusBadge status={issue.reviewStatus} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          {issue.evidence.length === 0 ? (
            <p className="text-sm text-zinc-500">No supporting evidence found for this recommendation.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {issue.evidence.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">{e.value}</span>
                  <span className="shrink-0 text-xs text-zinc-400">weight {e.weight}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Explanation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{issue.aiReason}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{issue.aiRationale}</p>
        </CardContent>
      </Card>

      <DecisionPanel issue={issue} groups={groups} role={role} />
    </div>
  );
}
