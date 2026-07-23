"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorCard } from "@/components/error-card";

function nextPathFromLocation(): string {
  if (typeof window === "undefined") return "/";
  return new URLSearchParams(window.location.search).get("next") || "/";
}

export function LoginForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"steward" | "viewer" | null>(null);
  const [showAccessKey, setShowAccessKey] = useState(false);

  async function createSession(body: { apiKey?: string; viewer?: boolean }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      throw new Error(responseBody?.error?.message ?? "Sign-in failed");
    }
    router.push(nextPathFromLocation());
    router.refresh();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submittedApiKey = String(
      new FormData(e.currentTarget).get("apiKey") ?? apiKey
    );
    setPending("steward");
    setError(null);
    try {
      await createSession({ apiKey: submittedApiKey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(null);
    }
  }

  async function continueAsViewer() {
    setPending("viewer");
    setError(null);
    try {
      await createSession({ viewer: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Viewer access failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Steward access key</label>
        <div className="relative">
          <Input
            name="apiKey"
            type={showAccessKey ? "text" : "password"}
            placeholder="Enter your steward access key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full pr-11"
            autoComplete="current-password"
            autoFocus
            required
          />
          <button
            type="button"
            onClick={() => setShowAccessKey((visible) => !visible)}
            aria-label={showAccessKey ? "Hide access key" : "Show access key"}
            aria-pressed={showAccessKey}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
          >
            <span
              aria-hidden="true"
              className="relative block h-3.5 w-5 rotate-45 rounded-[70%_15%] border border-current"
            >
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
              {!showAccessKey && (
                <span className="absolute -left-1 top-1/2 h-px w-7 -translate-y-1/2 bg-current" />
              )}
            </span>
          </button>
        </div>
      </div>
      <Button type="submit" disabled={pending !== null}>
        {pending === "steward" ? "Signing in…" : "Sign in as steward"}
      </Button>
      <div className="flex items-center gap-3 py-1" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Read only</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={continueAsViewer}
        disabled={pending !== null}
      >
        {pending === "viewer" ? "Opening workspace…" : "Continue as viewer"}
      </Button>
      <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        Viewers can inspect findings, analytics, and activity, but cannot submit decisions or run detection.
      </p>
      {error && <ErrorCard title="Sign-in failed" message={error} />}
    </form>
  );
}
