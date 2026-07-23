import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Governance intelligence</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Risk analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Concentration, confidence, and ownership patterns across the remediation queue.
        </p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
