import { NextResponse } from "next/server";
import { listGroups } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listGroups();
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
