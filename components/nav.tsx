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

export function Nav({ role, connected }: { role: Role | null; connected: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.startsWith("/login");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#080d16]/90">
      <div className="mx-auto flex min-h-16 max-w-[1480px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Ownership Resolution home">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/20">
            <span className="h-3.5 w-3.5 rotate-45 rounded-[3px] border-2 border-white" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-950 dark:text-white">
              Ownership Resolution
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              CMDB Risk Operations
            </span>
          </span>
        </Link>

        {!isLogin && (
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {!isLogin && (
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  connected ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]" : "bg-amber-400"
                )}
              />
              {connected ? "ServiceNow connected" : "Demo data"}
            </span>
          )}
          {role && !isLogin ? (
            <>
              <Badge tone={role === "steward" ? "green" : "neutral"}>
                {role === "steward" ? "Steward" : "Viewer"}
              </Badge>
              <Button variant="ghost" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : isLogin ? (
            <span className="text-xs font-medium text-slate-400">Secure access</span>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
