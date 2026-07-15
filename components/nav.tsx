"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/types";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/health", label: "Health" },
  { href: "/analytics", label: "Analytics" },
  { href: "/activity", label: "Activity" },
];

export function Nav({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Ownership Resolution Workspace
        </span>
        <nav className="flex gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {role ? (
            <>
              <Badge tone={role === "steward" ? "green" : "neutral"}>
                {role === "steward" ? "Steward" : "Viewer"}
              </Badge>
              <Button variant="ghost" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-zinc-500 hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
