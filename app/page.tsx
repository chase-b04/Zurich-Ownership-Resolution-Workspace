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
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Prioritize CMDB remediation by operational risk, then review the evidence and safeguards.
        </p>
      </div>
      <DashboardClient
        canRunDetection={role === "steward"}
        detectionAvailable={isDetectionAvailable()}
      />
    </div>
  );
}
