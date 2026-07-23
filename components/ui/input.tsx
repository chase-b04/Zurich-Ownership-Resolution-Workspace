import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}
