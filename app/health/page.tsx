import { getHealthMetrics } from "@/lib/servicenow/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/stat-tile";
import { ProgressBar } from "@/components/ui/progress-bar";

export const dynamic = "force-dynamic";

function scoreTone(score: number): "green" | "amber" | "rose" {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "rose";
}

function scoreAccent(score: number): "green" | "amber" | "rose" {
  return scoreTone(score);
}

export default async function HealthPage() {
  const metrics = await getHealthMetrics();
  const tone = scoreTone(metrics.healthScore);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Operational posture</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">CMDB backlog health</h1>
        <p className="mt-1 max-w-4xl text-sm text-slate-500 dark:text-slate-400">
          Backlog health for CIs currently flagged by ownership detection — not a measure of
          coverage across the entire CMDB. ServiceNow remains the system of record for total CI
          inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Backlog Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={
                "text-5xl font-semibold tabular-nums " +
                (tone === "green"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : tone === "amber"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400")
              }
            >
              {metrics.healthScore}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Equal parts ownership coverage and resolution rate among flagged issues.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coverage &amp; Resolution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Ownership coverage (flagged issues with a support group assigned)
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {metrics.ownershipCoveragePct}%
                </span>
              </div>
              <ProgressBar pct={metrics.ownershipCoveragePct} tone={scoreAccent(metrics.ownershipCoveragePct)} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Resolution rate</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {metrics.resolutionRatePct}%
                </span>
              </div>
              <ProgressBar pct={metrics.resolutionRatePct} tone={scoreAccent(metrics.resolutionRatePct)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Flagged Issues" value={metrics.totalFlagged} />
        <StatTile label="Unowned CIs" value={metrics.unowned} accent="rose" />
        <StatTile label="Open Backlog" value={metrics.openBacklog} accent="blue" />
        <StatTile label="Avg Open Age (days)" value={metrics.avgOpenAgeDays} accent="amber" />
        <StatTile label="Oldest Open (days)" value={metrics.oldestOpenAgeDays} accent="amber" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>By CI Class</CardTitle>
        </CardHeader>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">CI Class</th>
              <th className="px-4 py-3">Total Flagged</th>
              <th className="px-4 py-3">Unowned</th>
              <th className="px-4 py-3">Resolved</th>
              <th className="px-4 py-3">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {metrics.byClass.map((row) => {
              const coverage = row.total ? Math.round(((row.total - row.unowned) / row.total) * 100) : 100;
              return (
                <tr key={row.ciClass}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.ciClass}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.total}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.unowned}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.resolved}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ProgressBar pct={coverage} tone={scoreAccent(coverage)} />
                      </div>
                      <span className="text-xs text-zinc-500">{coverage}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
