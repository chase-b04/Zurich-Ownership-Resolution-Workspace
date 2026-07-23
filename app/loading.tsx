export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading workspace">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-blue-500/20" />
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100 dark:bg-slate-900" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-28 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}
