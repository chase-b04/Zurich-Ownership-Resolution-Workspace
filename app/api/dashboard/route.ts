import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (err) {
    return handleRouteError(err);
  }
}
