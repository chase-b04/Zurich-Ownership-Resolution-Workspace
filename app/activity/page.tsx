import Link from "next/link";
import { listActivity } from "@/lib/servicenow/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<ActivityType, { label: string; tone: "blue" | "green" | "amber" }> = {
  recommendation_generated: { label: "Recommendation", tone: "blue" },
  decision_submitted: { label: "Decision", tone: "amber" },
  ownership_changed: { label: "Ownership Changed", tone: "green" },
  relationship_changed: { label: "Relationship Changed", tone: "green" },
};

function formatActivityTimestamp(value: string): string {
  if (!value.trim()) return "Not supplied";
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(" ", "T")
    : value;
  const timestamp = new Date(normalized);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toLocaleString() : "Not supplied";
}

export default async function ActivityPage() {
  const entries = await listActivity();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Audit visibility</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Activity history</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A chronological view of recommendations, steward decisions, and CMDB changes.
        </p>
      </div>

      <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {entries.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">No activity recorded yet.</p>
        )}
        {entries.map((entry) => {
          const meta = TYPE_LABEL[entry.type];
          return (
            <div key={entry.id} className="group flex items-start justify-between gap-4 p-5 transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/10">
              <div className="flex min-w-0 gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
                <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <Link
                    href={`/issue/${entry.issueSysId}`}
                    className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {entry.ciName}
                  </Link>
                  <span className="text-xs text-zinc-400">{entry.issueNumber}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{entry.message}</p>
                <p className="text-xs text-zinc-400">{entry.actor}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-zinc-400">
                {formatActivityTimestamp(entry.timestamp)}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
