import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isDetectionAvailable } from "@/lib/servicenow/client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const role = token ? verifySessionToken(token) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Risk operations</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Remediation queue
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Triage the highest operational risk first, then validate evidence and safeguards.
        </p>
      </div>
      <DashboardClient
        canRunDetection={role === "steward"}
        detectionAvailable={isDetectionAvailable()}
      />
    </div>
  );
}
