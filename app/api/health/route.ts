import { NextResponse } from "next/server";
import { getHealthMetrics } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getHealthMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return handleRouteError(err);
  }
}
