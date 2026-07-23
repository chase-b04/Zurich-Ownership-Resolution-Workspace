import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-[0_16px_36px_rgba(0,0,0,0.12)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
