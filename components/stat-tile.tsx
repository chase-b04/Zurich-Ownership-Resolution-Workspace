import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "blue" | "green" | "amber" | "rose" | "neutral";
}) {
  const displayValue =
    typeof value === "number" && !Number.isFinite(value) ? "—" : value;
  const accentClass =
    accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "green"
        ? "text-emerald-600 dark:text-emerald-400"
        : accent === "amber"
          ? "text-amber-600 dark:text-amber-400"
          : accent === "rose"
            ? "text-rose-600 dark:text-rose-400"
            : "text-zinc-900 dark:text-zinc-100";
  const railClass =
    accent === "blue"
      ? "before:bg-blue-500"
      : accent === "green"
        ? "before:bg-emerald-500"
        : accent === "amber"
          ? "before:bg-amber-500"
          : accent === "rose"
            ? "before:bg-rose-500"
            : "before:bg-slate-400";

  return (
    <Card
      className={cn(
        "relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-0.5",
        railClass
      )}
    >
      <CardHeader className="pb-1">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold tracking-tight tabular-nums", accentClass)}>
          {displayValue}
        </p>
      </CardContent>
    </Card>
  );
}
