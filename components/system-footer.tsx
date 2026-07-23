"use client";

import { usePathname } from "next/navigation";

export function SystemFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  return (
    <footer className="border-t border-slate-200/80 px-6 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
      ServiceNow remains the system of record · Human approval is required for every remediation
    </footer>
  );
}
