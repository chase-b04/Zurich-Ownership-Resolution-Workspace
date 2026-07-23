import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-950/20 hover:bg-blue-500 focus-visible:ring-blue-500",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  outline: "border border-slate-300 bg-white/50 text-slate-900 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-blue-950/30",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
