import { cn } from "@/lib/cn";

export function ProgressBar({
  pct,
  tone = "neutral",
}: {
  pct: number;
  tone?: "green" | "amber" | "rose" | "neutral";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const barClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "rose"
          ? "bg-rose-500"
          : "bg-zinc-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className={cn("h-full rounded-full transition-all", barClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
