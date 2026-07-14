import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Governance-level reporting across ownership issues.
        </p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
