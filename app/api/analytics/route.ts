import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAnalytics();
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
