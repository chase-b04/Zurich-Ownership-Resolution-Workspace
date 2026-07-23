import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuardrailBadge } from "@/components/status-badges";
import { guardrailRollup } from "@/lib/risk";
import type { GuardrailResult, RecommendationSource } from "@/lib/types";

const STATUS_MARK = { pass: "✓", warn: "!", fail: "×" };
const STATUS_CLASS = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  fail: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
};

export function GuardrailPanel({ results, source }: { results: GuardrailResult[]; source: RecommendationSource }) {
  const overall = guardrailRollup(results);
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-zinc-900 dark:text-zinc-100">Deterministic guardrails</CardTitle>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Independent checks run before a recommendation reaches the reviewer.
          </p>
        </div>
        <GuardrailBadge status={overall} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {source === "deterministic_fallback" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            AI validation did not complete successfully. This recommendation was produced by the deterministic fallback.
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li key={result.key} className="flex items-start gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${STATUS_CLASS[result.status]}`}>
                {STATUS_MARK[result.status]}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{result.label}</p>
                {result.detail && (
                  <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{result.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Guardrails support the reviewer; they do not authorize a CMDB write. Every change still requires a steward decision.
        </p>
      </CardContent>
    </Card>
  );
}
