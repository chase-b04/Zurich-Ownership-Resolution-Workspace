"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function nextPathFromLocation(): string {
  if (typeof window === "undefined") return "/";
  return new URLSearchParams(window.location.search).get("next") || "/";
}

export function LoginForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
        <Input
          type="password"
          placeholder="Enter your steward or viewer access key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
          autoFocus
        />
      </div>
      <Button type="submit" disabled={pending || !apiKey}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </form>
  );
}
