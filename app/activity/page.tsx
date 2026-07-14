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
};

export default async function ActivityPage() {
  const entries = await listActivity();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Activity History</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Recommendations generated, decisions submitted, and ownership changes.
        </p>
      </div>

      <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">No activity recorded yet.</p>
        )}
        {entries.map((entry) => {
          const meta = TYPE_LABEL[entry.type];
          return (
            <div key={entry.id} className="flex items-start justify-between gap-4 p-4">
              <div className="flex flex-col gap-1">
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
              <span className="shrink-0 text-xs text-zinc-400">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
