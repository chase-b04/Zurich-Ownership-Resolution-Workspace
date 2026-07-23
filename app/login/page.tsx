import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl items-center gap-12 py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="hidden lg:block">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
          CMDB Risk Operations
        </p>
        <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 dark:text-white">
          Make high-confidence remediation decisions without losing human control.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-400">
          Review evidence, validate deterministic safeguards, and write approved ownership
          changes back to ServiceNow from one controlled workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-800">Evidence-backed</span>
          <span className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-800">Human approved</span>
          <span className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-800">ServiceNow audited</span>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Secure workspace</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stewards sign in with an access key. Viewers can continue in read-only mode.
          </p>
        </div>
        <Card className="border-slate-200/80 p-6 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:shadow-black/20">
          <LoginForm />
        </Card>
        <p className="mt-4 text-center text-xs text-slate-400">
          Credentials are verified server-side and are never sent to ServiceNow from your browser.
        </p>
      </div>
    </div>
  );
}
