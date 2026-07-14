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

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-semibold tabular-nums", accentClass)}>{value}</p>
      </CardContent>
    </Card>
  );
}
