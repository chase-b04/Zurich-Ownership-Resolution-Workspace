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
  const [pending, setPending] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Invalid access key");
      }
      router.push(nextPathFromLocation());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Access Key</label>
        <div className="relative">
          <Input
            type={showAccessKey ? "text" : "password"}
            placeholder="Enter your steward or viewer access key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full pr-11"
            autoComplete="current-password"
            autoFocus
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
      <Button type="submit" disabled={pending || !apiKey}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {error && <ErrorCard title="Sign-in failed" message={error} />}
    </form>
  );
}
