import { NextResponse } from "next/server";
import { listActivity } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listActivity();
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
